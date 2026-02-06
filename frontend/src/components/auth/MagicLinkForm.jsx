import { useState } from 'react';
import { authService } from '../../services/authService';
import RoleSelector from './RoleSelector';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';

export default function MagicLinkForm() {
  const [formData, setFormData] = useState({
    email: '',
    role: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.role) {
      newErrors.role = 'Selecione se você é estudante ou mentor';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.sendMagicLink(formData.email, formData.role);
      setEmailSent(true);
      analytics.track(EVENTS.MAGIC_LINK_SENT, { role: formData.role });
    } catch (err) {
      console.error('Magic link error:', err);

      if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Email inválido' });
      } else {
        setErrors({ general: 'Erro ao enviar email. Tente novamente.' });
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

  // Success state - email was sent
  if (emailSent) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Email enviado!
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enviamos um link de acesso para <strong>{formData.email}</strong>
        </p>
        <p className="text-xs text-gray-500">
          Verifique sua caixa de entrada e clique no link para entrar.
          <br />
          O link expira em 1 hora.
        </p>
        <button
          type="button"
          onClick={() => setEmailSent(false)}
          className="mt-4 text-sm text-patronos-accent hover:underline"
        >
          Enviar para outro email
        </button>
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

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex gap-3">
          <EnvelopeIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Login sem senha</p>
            <p className="mt-1 text-blue-700">
              Enviaremos um link mágico para seu email. Basta clicar para entrar.
            </p>
          </div>
        </div>
      </div>

      <RoleSelector
        value={formData.role}
        onChange={(role) => handleChange('role', role)}
        error={errors.role}
      />

      <div>
        <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="magic-email"
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
        {loading ? 'Enviando...' : 'Enviar link de acesso'}
      </button>
    </form>
  );
}
