import { useState } from 'react';
import { authService } from '../../services/authService';
import analytics, { EVENTS } from '../../services/analytics';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    analytics.track(EVENTS.LOGIN_STARTED, { auth_provider: 'email' });

    try {
      // Sign in with Firebase - AuthContext will handle the redirect
      await authService.signInWithEmail(formData.email, formData.password);
      // AuthContext's onAuthStateChanged will update state and
      // AuthPage's useEffect will redirect based on role
    } catch (err) {
      console.error('Login error:', err);

      analytics.track(EVENTS.LOGIN_ERROR, {
        auth_provider: 'email',
        error_code: err.code,
      });

      // Handle Firebase errors in Portuguese
      if (err.code === 'auth/user-not-found') {
        setErrors({ email: 'Email não cadastrado' });
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrors({ password: 'Senha incorreta' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Email inválido' });
      } else if (err.code === 'auth/too-many-requests') {
        setErrors({ general: 'Muitas tentativas. Tente novamente mais tarde.' });
      } else {
        setErrors({ general: 'Erro ao entrar. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      setResetError('Digite seu email');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      await authService.sendPasswordReset(resetEmail);
      setResetSuccess(true);
      analytics.track(EVENTS.PASSWORD_RESET_REQUESTED, { email: resetEmail });
    } catch (err) {
      console.error('Password reset error:', err);

      if (err.code === 'auth/user-not-found') {
        setResetError('Email nao cadastrado');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Email invalido');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setResetError('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setResetMode(false);
    setResetSuccess(false);
    setResetError('');
    setResetEmail('');
  };

  // Forgot password mode
  if (resetMode) {
    return (
      <div className="space-y-5">
        {resetSuccess ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Email enviado!</h3>
            <p className="mt-2 text-sm text-gray-600">
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="mt-4 text-patronos-accent hover:underline text-sm"
            >
              Voltar para login
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Esqueceu sua senha?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {resetError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {resetError}
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="
                  mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                "
                placeholder="seu@email.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="
                w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg
                text-sm font-medium text-white bg-patronos-accent
                hover:bg-patronos-orange/90 focus:outline-none focus:ring-2
                focus:ring-offset-2 focus:ring-patronos-accent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {resetLoading ? 'Enviando...' : 'Enviar link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Voltar para login
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.general && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="login-email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`
            mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
            ${errors.email ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <button
            type="button"
            onClick={() => {
              setResetMode(true);
              setResetEmail(formData.email);
            }}
            className="text-sm text-patronos-accent hover:underline"
          >
            Esqueceu a senha?
          </button>
        </div>
        <input
          type="password"
          id="login-password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          className={`
            mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
            ${errors.password ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Sua senha"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg
          text-sm font-medium text-white bg-patronos-accent
          hover:bg-patronos-orange/90 focus:outline-none focus:ring-2
          focus:ring-offset-2 focus:ring-patronos-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        "
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
