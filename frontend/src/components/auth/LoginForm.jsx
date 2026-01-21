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
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
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
          hover:bg-patronos-purple/90 focus:outline-none focus:ring-2
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
