import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Handles Firebase's /__/auth/action URLs
 *
 * Firebase sends auth action emails (magic links, password reset) to this path.
 * Since we're not using Firebase Hosting, we need to handle it ourselves
 * and redirect to the appropriate handler based on the 'mode' parameter.
 *
 * Modes:
 * - signIn: Magic link sign-in → redirect to /auth/verify with full URL
 * - resetPassword: Password reset → redirect to /auth/action
 * - verifyEmail: Email verification → redirect to /auth/verify-email
 */
export default function FirebaseActionHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const continueUrl = searchParams.get('continueUrl');

    // Preserve all query parameters for the redirect
    const queryString = window.location.search;

    switch (mode) {
      case 'signIn':
        // Magic link sign-in - redirect to /auth/verify
        // The VerifyEmail component will detect the magic link and complete sign-in
        // We need to pass the full URL so isSignInWithEmailLink can detect it
        navigate(`/auth/verify${queryString}`, { replace: true });
        break;

      case 'resetPassword':
        // Password reset - redirect to our custom handler
        navigate(`/auth/action${queryString}`, { replace: true });
        break;

      case 'verifyEmail':
        // Email verification (if using Firebase's built-in email verification)
        navigate(`/auth/verify-email?token=${oobCode}`, { replace: true });
        break;

      case 'recoverEmail':
        // Email recovery - redirect to login with message
        navigate('/auth?recovered=true', { replace: true });
        break;

      default:
        // Unknown mode - if there's a continueUrl, go there
        if (continueUrl) {
          try {
            const url = new URL(continueUrl);
            // Only redirect to same origin for security
            if (url.origin === window.location.origin) {
              navigate(url.pathname + url.search, { replace: true });
              return;
            }
          } catch (e) {
            // Invalid URL, fall through to default
          }
        }
        // Default: go to login
        navigate('/auth', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">Centro de Carreiras</span>
        </h1>
        <div className="mt-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    </div>
  );
}
