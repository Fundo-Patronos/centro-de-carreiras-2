import { useState } from 'react';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import RoleSelector from './RoleSelector';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.role) {
      newErrors.role = 'Selecione se você é estudante ou mentor';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create Firebase Auth user
      const user = await authService.signUpWithEmail(
        formData.email,
        formData.password,
        formData.name
      );

      // Create Firestore profile with role
      // AuthContext's real-time subscription will detect this and update state
      // Then AuthPage's useEffect will redirect based on role
      await userService.createUserProfile(user.uid, {
        email: formData.email,
        displayName: formData.name,
        photoURL: null,
        role: formData.role,
        authProvider: 'email',
      });
      // Don't navigate here - let AuthContext handle it via real-time subscription
    } catch (err) {
      console.error('Signup error:', err);

      // Handle Firebase errors in Portuguese
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Este email já está cadastrado' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Email inválido' });
      } else if (err.code === 'auth/weak-password') {
        setErrors({ password: 'Senha muito fraca' });
      } else {
        setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
      }
      setLoading(false);
    }
    // Don't setLoading(false) on success - keep showing loading until redirect
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
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

      <RoleSelector
        value={formData.role}
        onChange={(role) => handleChange('role', role)}
        error={errors.role}
      />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome completo
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`
            mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
            ${errors.name ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Seu nome"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
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
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          className={`
            mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
            ${errors.password ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Mínimo 6 caracteres"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmar senha
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          className={`
            mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
            ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Repita a senha"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
        {loading ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  );
}
