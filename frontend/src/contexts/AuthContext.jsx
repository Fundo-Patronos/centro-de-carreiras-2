import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';
import analytics, { EVENTS } from '../services/analytics';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Manages authentication state and user profile data
 */
export function AuthProvider({ children }) {
  // Firebase Auth user (from Firebase Authentication)
  const [firebaseUser, setFirebaseUser] = useState(null);

  // User profile (from Firestore)
  const [userProfile, setUserProfile] = useState(null);

  // Loading state
  const [loading, setLoading] = useState(true);

  // True when user is authenticated but hasn't selected a role yet (Google sign-in)
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = null;

    // Subscribe to auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous profile subscription
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setFirebaseUser(user);

      if (user) {
        // User is signed in - subscribe to profile changes (real-time)
        // This handles both existing profiles and newly created ones
        unsubscribeProfile = userService.subscribeToUserProfile(
          user.uid,
          async (profile) => {
            if (profile) {
              // Profile exists
              setUserProfile(profile);
              setNeedsRoleSelection(false);
              setLoading(false);

              // Identify user in Mixpanel
              analytics.identify(user.uid, {
                email: profile.email,
                role: profile.role,
                authProvider: profile.authProvider,
                displayName: profile.displayName,
              });
              analytics.track(EVENTS.LOGIN_COMPLETED, {
                auth_provider: profile.authProvider,
                role: profile.role,
              });
            } else {
              // No profile yet - user needs to complete signup
              setUserProfile(null);
              setNeedsRoleSelection(true);
              setLoading(false);
            }
          }
        );
      } else {
        // User is signed out
        setUserProfile(null);
        setNeedsRoleSelection(false);
        setLoading(false);

        // Reset Mixpanel identity
        analytics.reset();
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  /**
   * Get fresh ID token for API calls
   * @returns {Promise<string|null>}
   */
  const getIdToken = async () => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    return null;
  };

  /**
   * Create user profile after role selection
   * @param {string} role - 'estudante' or 'mentor'
   * @param {string} authProvider - 'email', 'google', or 'magic_link'
   */
  const createProfile = async (role, authProvider) => {
    if (!firebaseUser) {
      throw new Error('No authenticated user');
    }

    await userService.createUserProfile(firebaseUser.uid, {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      photoURL: firebaseUser.photoURL,
      role,
      authProvider,
    });

    // Fetch the newly created profile
    const profile = await userService.getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    setNeedsRoleSelection(false);
  };

  // Context value
  const value = {
    // State
    firebaseUser,
    userProfile,
    loading,
    needsRoleSelection,

    // Computed properties
    isAuthenticated: !!firebaseUser && !!userProfile,
    isEstudante: userProfile?.role === 'estudante',
    isMentor: userProfile?.role === 'mentor',
    isAdmin: userProfile?.isAdmin === true,
    isPending: userProfile?.status === 'pending',
    isPendingVerification: userProfile?.status === 'pending_verification',
    isSuspended: userProfile?.status === 'suspended',
    isActive: userProfile?.status === 'active',

    // Methods
    getIdToken,
    createProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
