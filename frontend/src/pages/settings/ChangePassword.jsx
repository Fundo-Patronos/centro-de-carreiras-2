import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import analytics, { EVENTS } from '../../services/analytics';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [error, setError] = useState('');

  const handleSendResetEmail = async () => {
    if (!userProfile?.email) {
      setError('Email não encontrado.');
      return;
    }

    setStatus('sending');
    setError('');

    analytics.track(EVENTS.PASSWORD_CHANGE_STARTED, {
      user_role: userProfile?.role,
    });

    try {
      await authService.sendPasswordReset(userProfile.email);
      setStatus('success');

      analytics.track(EVENTS.PASSWORD_RESET_REQUESTED, {
        user_role: userProfile?.role,
        source: 'settings',
      });
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setStatus('error');

      let errorMessage = 'Erro ao enviar email. Tente novamente.';

      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      }

      setError(errorMessage);

      analytics.track(EVENTS.PASSWORD_CHANGE_ERROR, {
        user_role: userProfile?.role,
        error_code: err.code,
      });
    }
  };

  const handleBackClick = () => {
    const basePath = userProfile?.role === 'estudante' ? '/estudante' : '/mentor';
    navigate(basePath);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <button
          onClick={handleBackClick}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          &larr; Voltar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-patronos-accent/10 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="w-6 h-6 text-patronos-accent" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Alterar Senha</h1>
          <p className="mt-2 text-sm text-gray-600">
            {userProfile?.email}
          </p>
        </div>

        {/* Idle State */}
        {status === 'idle' && (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Enviaremos um link para o seu email para definir uma nova senha.
            </p>

            <button
              onClick={handleSendResetEmail}
              className="
                w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg
                text-sm font-medium text-white bg-patronos-gradient
                hover:opacity-90 focus:outline-none focus:ring-2
                focus:ring-offset-2 focus:ring-patronos-accent
                transition-opacity duration-200
              "
            >
              <EnvelopeIcon className="w-5 h-5" />
              Enviar Link de Redefinição
            </button>
          </div>
        )}

        {/* Sending State */}
        {status === 'sending' && (
          <div className="text-center py-4">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Enviando email...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Email enviado!
            </h2>
            <p className="mt-2 text-gray-600">
              Verifique sua caixa de entrada e clique no link para definir sua nova senha.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Não recebeu? Verifique a pasta de spam ou{' '}
              <button
                onClick={() => setStatus('idle')}
                className="text-patronos-accent hover:underline"
              >
                tente novamente
              </button>
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-patronos-accent hover:underline text-sm"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
