import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import axios from 'axios';
import { db } from '../config/firebase';

// Auto-approved domains by role (must match backend/app/core/approval.py)
const APPROVED_DOMAINS = {
  estudante: ['dac.unicamp.br', 'patronos.org'],
  mentor: ['patronos.org'],
};

/**
 * Get initial status for a new user based on email domain and auth provider
 * @param {string} email - User's email address
 * @param {string} role - User's role ('estudante' or 'mentor')
 * @param {string} authProvider - Authentication method ('email', 'google', 'magic_link')
 * @returns {string} 'active', 'pending_verification', or 'pending'
 */
function getInitialStatus(email, role, authProvider) {
  try {
    const domain = email.split('@')[1].toLowerCase();
    const approvedDomains = APPROVED_DOMAINS[role] || [];

    if (!approvedDomains.includes(domain)) {
      return 'pending';
    }

    // Auto-approved domain - check auth provider
    if (authProvider === 'google' || authProvider === 'magic_link') {
      return 'active';
    }

    // Email/password signup needs email verification
    return 'pending_verification';
  } catch {
    return 'pending';
  }
}

export const userService = {
  /**
   * Create user profile in Firestore
   * @param {string} uid - Firebase Auth UID
   * @param {Object} userData - User data
   * @param {string} userData.email
   * @param {string} userData.displayName
   * @param {string|null} userData.photoURL
   * @param {string} userData.role - 'estudante' or 'mentor'
   * @param {string} userData.authProvider - 'email', 'google', or 'magic_link'
   * @param {string} [userData.curso] - User's course/major
   * @param {string} [userData.company] - Mentor's company (mentor only)
   * @param {string} [userData.title] - Mentor's job title (mentor only)
   * @param {string} [userData.linkedin] - Mentor's LinkedIn URL (mentor only)
   */
  async createUserProfile(uid, userData) {
    const userRef = doc(db, 'users', uid);
    const status = getInitialStatus(userData.email, userData.role, userData.authProvider);

    const profileData = {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL || null,
      role: userData.role,
      status,
      authProvider: userData.authProvider,
      profile: {
        phone: null,
        linkedIn: userData.linkedin || null,
        bio: null,
        // Shared field
        course: userData.curso || null,
        // Estudante fields
        graduationYear: null,
        // Mentor fields
        company: userData.company || null,
        position: userData.title || null,
        expertise: [],
      },
      emailNotifications: true,
      language: 'pt-BR',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    // Add mentorProfile for mentors with initial data from signup
    if (userData.role === 'mentor') {
      profileData.mentorProfile = {
        title: userData.title || '',
        company: userData.company || '',
        bio: '',
        linkedin: userData.linkedin || '',
        tags: [],
        expertise: [],
        course: userData.curso || '',
        graduationYear: null,
        isUnicampAlumni: null,
        unicampDegreeLevel: null,
        alternativeUniversity: null,
        patronosRelation: null,
        photoURL: null,
        isActive: false, // Hidden until profile is complete
        isProfileComplete: false,
      };
    }

    await setDoc(userRef, profileData);

    // If user is pending approval, notify admins
    if (status === 'pending') {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        await axios.post(`${apiUrl}/auth/notify-pending-user`, {
          uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          company: userData.company || null,
          title: userData.title || null,
        });
        console.log('Admin notification sent for pending user');
      } catch (error) {
        // Don't fail signup if notification fails
        console.error('Failed to send admin notification:', error);
      }
    }
  },

  /**
   * Get user profile from Firestore
   * @param {string} uid - Firebase Auth UID
   * @returns {Promise<Object|null>}
   */
  async getUserProfile(uid) {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return { uid: snapshot.id, ...snapshot.data() };
    }
    return null;
  },

  /**
   * Check if user profile exists
   * @param {string} uid - Firebase Auth UID
   * @returns {Promise<boolean>}
   */
  async userProfileExists(uid) {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists();
  },

  /**
   * Update user profile in Firestore
   * @param {string} uid - Firebase Auth UID
   * @param {Object} updates - Fields to update
   */
  async updateUserProfile(uid, updates) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update last login timestamp
   * @param {string} uid - Firebase Auth UID
   */
  async updateLastLogin(uid) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  },

  /**
   * Subscribe to user profile changes (real-time)
   * @param {string} uid - Firebase Auth UID
   * @param {Function} callback - Called with user data on changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToUserProfile(uid, callback) {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ uid: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  },
};

export default userService;
