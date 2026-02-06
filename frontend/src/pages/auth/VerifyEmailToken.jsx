import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { verificationService } from '../../services/verificationService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

export default function VerifyEmailToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token de verificacao nao encontrado');
        setVerifying(false);
        analytics.track(EVENTS.VERIFICATION_TOKEN_MISSING);
        return;
      }

      try {
        const result = await verificationService.verifyEmailToken(token);
        setSuccess(true);
        setVerifiedData(result);
        analytics.track(EVENTS.VERIFICATION_TOKEN_SUCCESS, {
          email: result.email,
          role: result.role,
        });
      } catch (err) {
        console.error('Error verifying token:', err);
        setError(err.response?.data?.detail || 'Token invalido ou expirado');
        analytics.track(EVENTS.VERIFICATION_TOKEN_ERROR, {
          error: err.response?.data?.detail || err.message,
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Redirect to dashboard after successful verification (with delay for user to see success)
  useEffect(() => {
    if (success && !authLoading && userProfile?.status === 'active') {
      const timer = setTimeout(() => {
        const redirectPath =
          userProfile.role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard';
        navigate(redirectPath);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, authLoading, userProfile, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">Centro de Carreiras</span>
          </h1>
          <div className="mt-8">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Verificando seu email...</p>
          </div>
        </div>
      </div>
    );
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
          {success ? (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                Email Verificado!
              </h2>

              <p className="mt-4 text-gray-600">
                Sua conta foi ativada com sucesso. Voce sera redirecionado para o painel em instantes...
              </p>

              {verifiedData && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">
                    <p>
                      <span className="font-medium text-gray-700">Email:</span>{' '}
                      {verifiedData.email}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/auth')}
                className="mt-6 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-lg text-white bg-patronos-accent hover:bg-patronos-orange/90 transition-colors"
              >
                Ir para o Painel
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <XCircleIcon className="h-10 w-10 text-red-600" />
              </div>

              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                Verificacao Falhou
              </h2>

              <p className="mt-4 text-gray-600">
                {error}
              </p>

              <div className="mt-6 text-sm text-gray-500">
                <p>
                  O link pode ter expirado ou ja foi utilizado. Faca login para solicitar um novo email de verificacao.
                </p>
              </div>

              <button
                onClick={() => navigate('/auth')}
                className="mt-6 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-lg text-white bg-patronos-accent hover:bg-patronos-orange/90 transition-colors"
              >
                Ir para Login
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Fundo Patronos da Unicamp
        </p>
      </div>
    </div>
  );
}
