import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';

export default function VerifyEmail() {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'need-email'
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    analytics.track(EVENTS.VERIFY_EMAIL_VIEWED);
    verifyMagicLink();
  }, []);

  const verifyMagicLink = async () => {
    const url = window.location.href;

    // Check if this is a valid magic link
    if (!authService.isEmailLink(url)) {
      setStatus('error');
      setError('Link inválido ou expirado.');
      return;
    }

    // Get stored email
    const storedEmail = authService.getStoredEmail();

    if (!storedEmail) {
      // Email not in storage - need to ask user
      setStatus('need-email');
      return;
    }

    await completeSignIn(storedEmail, url);
  };

  const completeSignIn = async (emailToUse, url) => {
    setStatus('verifying');

    try {
      const { user, role } = await authService.completeMagicLinkSignIn(emailToUse, url);

      // Check if profile exists
      const profileExists = await userService.userProfileExists(user.uid);

      if (!profileExists) {
        // Create profile with stored role
        await userService.createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          role: role,
          authProvider: 'magic_link',
        });
      } else {
        // Update last login
        await userService.updateLastLogin(user.uid);
      }

      setStatus('success');
      analytics.track(EVENTS.MAGIC_LINK_VERIFIED, { role });

      // Get profile for redirect
      const profile = await userService.getUserProfile(user.uid);

      // Redirect after short delay
      setTimeout(() => {
        navigate(profile.role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Magic link verification error:', err);
      setStatus('error');

      analytics.track(EVENTS.MAGIC_LINK_ERROR, {
        error_code: err.code,
        error_message: err.message,
      });

      if (err.code === 'auth/invalid-action-code') {
        setError('Link expirado. Solicite um novo link de acesso.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else {
        setError('Erro ao verificar email. Tente novamente.');
      }
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (email.trim()) {
      await completeSignIn(email, window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold">
          <span className="text-gradient">Centro de Carreiras</span>
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
          {/* Verifying state */}
          {status === 'verifying' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Verificando seu acesso...</p>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Email verificado!
              </h2>
              <p className="mt-2 text-gray-600">
                Redirecionando para o dashboard...
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Ops! Algo deu errado
              </h2>
              <p className="mt-2 text-gray-600">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="mt-6 text-patronos-accent hover:underline"
              >
                Voltar para login
              </button>
            </div>
          )}

          {/* Need email state */}
          {status === 'need-email' && (
            <div className="py-4">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Confirme seu email
              </h2>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Por favor, digite o email usado para solicitar o link de acesso.
              </p>

              <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="verify-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="verify-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
                      mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                    "
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="
                    w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg
                    text-sm font-medium text-white bg-patronos-accent
                    hover:bg-patronos-purple/90 focus:outline-none focus:ring-2
                    focus:ring-offset-2 focus:ring-patronos-accent
                    transition-colors duration-200
                  "
                >
                  Confirmar
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
