import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Protected Route Component
 * Wraps routes that require authentication and optionally specific roles
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected content
 * @param {string[]} props.allowedRoles - Optional array of allowed roles ['estudante', 'mentor']
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, userProfile, loading, needsRoleSelection, firebaseUser } = useAuth();
  const location = useLocation();

  // Still checking auth state
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Not authenticated at all
  if (!firebaseUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but needs to complete profile (Google sign-in new user)
  if (needsRoleSelection) {
    // Stay on auth page to show role modal
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but no profile yet (edge case)
  if (!userProfile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check user status - redirect pending/pending_verification/suspended users
  if (userProfile.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (userProfile.status === 'pending_verification') {
    return <Navigate to="/pending-verification" replace />;
  }

  if (userProfile.status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    // Redirect to appropriate dashboard based on user's role
    const redirectPath =
      userProfile.role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // All checks passed - render protected content
  return children;
}
