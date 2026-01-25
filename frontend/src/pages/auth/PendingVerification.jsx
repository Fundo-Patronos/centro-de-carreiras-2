import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, ArrowRightOnRectangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { verificationService } from '../../services/verificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

const RESEND_COOLDOWN_SECONDS = 60;

export default function PendingVerification() {
  const { userProfile, loading, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Track page view on mount
  useEffect(() => {
    analytics.track(EVENTS.PENDING_VERIFICATION_VIEWED, {
      user_role: userProfile?.role,
    });
  }, [userProfile?.role]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      await verificationService.sendVerificationEmail();
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      analytics.track(EVENTS.VERIFICATION_EMAIL_RESENT, {
        user_role: userProfile?.role,
      });
    } catch (err) {
      console.error('Error resending verification email:', err);
      setResendError(err.response?.data?.detail || 'Erro ao reenviar email');
      analytics.track(EVENTS.VERIFICATION_EMAIL_RESEND_ERROR, {
        user_role: userProfile?.role,
        error: err.response?.data?.detail || err.message,
      });
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    analytics.track(EVENTS.LOGOUT, { from_page: 'pending_verification' });
    await authService.logout();
    navigate('/auth');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // If user is not authenticated, redirect to auth
  if (!firebaseUser) {
    navigate('/auth');
    return null;
  }

  // If user is already verified/active, redirect to dashboard
  if (userProfile?.status === 'active') {
    const redirectPath =
      userProfile.role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard';
    navigate(redirectPath);
    return null;
  }

  // If user is pending admin approval (not verification), redirect there
  if (userProfile?.status === 'pending') {
    navigate('/pending-approval');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold">
          <span className="text-gradient">Centro de Carreiras</span>
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
          </div>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            Verifique seu Email
          </h2>

          <p className="mt-4 text-gray-600">
            Enviamos um link de verificacao para o seu email.
            Clique no link para ativar sua conta.
          </p>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">
              <p>
                <span className="font-medium text-gray-700">Email:</span>{' '}
                {userProfile?.email || firebaseUser?.email}
              </p>
            </div>
          </div>

          {resendSuccess && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600 text-sm">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Email reenviado com sucesso!</span>
            </div>
          )}

          {resendError && (
            <div className="mt-4 text-red-600 text-sm">
              {resendError}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={cooldown > 0 || resending}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-patronos-accent rounded-lg text-patronos-accent bg-white hover:bg-patronos-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Reenviando...
                </>
              ) : cooldown > 0 ? (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  Reenviar em {cooldown}s
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  Reenviar Email
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Sair
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              Nao recebeu o email? Verifique sua caixa de spam ou clique em "Reenviar Email".
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Fundo Patronos da Unicamp
        </p>
      </div>
    </div>
  );
}
