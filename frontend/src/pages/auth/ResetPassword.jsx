import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../config/firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CheckCircleIcon, ExclamationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'ready' | 'submitting' | 'success' | 'error'
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
      setStatus('error');
      setError('Link inválido.');
      return;
    }

    verifyCode();
  }, [mode, oobCode]);

  const verifyCode = async () => {
    try {
      // Verify the password reset code and get the email
      const userEmail = await verifyPasswordResetCode(auth, oobCode);
      setEmail(userEmail);
      setStatus('ready');
    } catch (err) {
      console.error('Error verifying reset code:', err);
      setStatus('error');

      if (err.code === 'auth/expired-action-code') {
        setError('Este link expirou. Solicite um novo link de redefinição de senha.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('Link inválido ou já utilizado.');
      } else {
        setError('Erro ao verificar o link. Tente novamente.');
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStatus('submitting');
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('success');
      analytics.track(EVENTS.PASSWORD_RESET_COMPLETED, { email });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setStatus('ready');

      if (err.code === 'auth/expired-action-code') {
        setError('Este link expirou. Solicite um novo link de redefinição de senha.');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use uma senha mais forte.');
      } else {
        setError('Erro ao redefinir senha. Tente novamente.');
      }
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
              <p className="mt-4 text-gray-600">Verificando link...</p>
            </div>
          )}

          {/* Ready state - show form */}
          {status === 'ready' && (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-patronos-accent/10 rounded-full flex items-center justify-center mb-4">
                  <LockClosedIcon className="w-6 h-6 text-patronos-accent" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configure sua senha
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {email}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`
                      mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                      ${formErrors.password ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`
                      mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                      ${formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Digite a senha novamente"
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="
                    w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg
                    text-sm font-medium text-white bg-patronos-gradient
                    hover:opacity-90 focus:outline-none focus:ring-2
                    focus:ring-offset-2 focus:ring-patronos-accent
                    transition-opacity duration-200
                  "
                >
                  Definir senha
                </button>
              </form>
            </div>
          )}

          {/* Submitting state */}
          {status === 'submitting' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Salvando nova senha...</p>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Senha configurada!
              </h2>
              <p className="mt-2 text-gray-600">
                Redirecionando para login...
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
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Fundo Patronos da Unicamp
        </p>
      </div>
    </div>
  );
}
