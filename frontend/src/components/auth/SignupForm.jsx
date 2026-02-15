import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { verificationService } from '../../services/verificationService';
import RoleSelector from './RoleSelector';
import analytics, { EVENTS } from '../../services/analytics';

export default function SignupForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    curso: '',
    // Mentor-specific fields
    company: '',
    title: '',
    linkedin: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    if (!formData.role) {
      setErrors({ role: 'Selecione se voce e estudante ou mentor' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome e obrigatorio';
    }

    if (!formData.curso.trim()) {
      newErrors.curso = 'Curso e obrigatorio';
    }

    // Mentor-specific validation
    if (formData.role === 'mentor') {
      if (!formData.company.trim()) {
        newErrors.company = 'Empresa e obrigatoria';
      }
      if (!formData.title.trim()) {
        newErrors.title = 'Cargo e obrigatorio';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email e obrigatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha e obrigatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas nao coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);
    analytics.track(EVENTS.SIGN_UP_STARTED, { auth_provider: 'email', role: formData.role });

    try {
      // Create Firebase Auth user
      const user = await authService.signUpWithEmail(
        formData.email,
        formData.password,
        formData.name
      );

      // Create Firestore profile with role
      // AuthContext's real-time subscription will detect this and update state
      await userService.createUserProfile(user.uid, {
        email: formData.email,
        displayName: formData.name,
        photoURL: null,
        role: formData.role,
        authProvider: 'email',
        curso: formData.curso,
        // Mentor-specific fields
        ...(formData.role === 'mentor' && {
          company: formData.company,
          title: formData.title,
          linkedin: formData.linkedin || null,
        }),
      });

      analytics.track(EVENTS.SIGN_UP_COMPLETED, { auth_provider: 'email', role: formData.role });

      // Check if user needs email verification (auto-approved domain with email/password)
      const profile = await userService.getUserProfile(user.uid);
      if (profile?.status === 'pending_verification') {
        // Send verification email
        try {
          await verificationService.sendVerificationEmail();
          analytics.track(EVENTS.VERIFICATION_EMAIL_SENT, { role: formData.role });
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          // Don't block signup, user can resend from pending verification page
        }
        navigate('/pending-verification');
        return;
      }
      // For other statuses, let AuthContext handle redirect via real-time subscription
    } catch (err) {
      console.error('Signup error:', err);

      analytics.track(EVENTS.SIGN_UP_ERROR, {
        auth_provider: 'email',
        role: formData.role,
        error_code: err.code,
      });

      // Handle Firebase errors in Portuguese
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Este email ja esta cadastrado' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Email invalido' });
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

  // Step 1: Role selection
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Como voce quer usar o Centro de Carreiras?</h3>
          <p className="mt-1 text-sm text-gray-500">Selecione seu perfil para continuar</p>
        </div>

        <RoleSelector
          value={formData.role}
          onChange={(role) => handleChange('role', role)}
          error={errors.role}
        />

        <button
          type="button"
          onClick={handleContinue}
          disabled={!formData.role}
          className="
            w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg
            text-sm font-medium text-white bg-patronos-accent
            hover:bg-patronos-orange/90 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-patronos-accent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
          "
        >
          Continuar
        </button>
      </div>
    );
  }

  // Step 2: Form fields based on role
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Voltar
      </button>

      {/* Role badge */}
      <div className="flex items-center gap-2 pb-2">
        <span className={`
          inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
          ${formData.role === 'estudante' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
        `}>
          {formData.role === 'estudante' ? 'Estudante' : 'Mentor'}
        </span>
        <span className="text-sm text-gray-500">Preencha seus dados</span>
      </div>

      {errors.general && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

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
        <label htmlFor="curso" className="block text-sm font-medium text-gray-700">
          Curso
        </label>
        <input
          type="text"
          id="curso"
          value={formData.curso}
          onChange={(e) => handleChange('curso', e.target.value)}
          className={`
            mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
            ${errors.curso ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Ex: Engenharia de Computacao"
        />
        {errors.curso && (
          <p className="mt-1 text-sm text-red-600">{errors.curso}</p>
        )}
      </div>

      {/* Mentor-specific fields */}
      {formData.role === 'mentor' && (
        <>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Empresa
            </label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className={`
                mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                ${errors.company ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Ex: Google, McKinsey, Itau"
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Cargo
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`
                mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                ${errors.title ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Ex: Software Engineer, Consultor, Analista"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
              LinkedIn <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              className="
                mt-1 block w-full rounded-lg border px-3 py-2 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent
                border-gray-300
              "
              placeholder="https://linkedin.com/in/seu-perfil"
            />
          </div>
        </>
      )}

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
          placeholder="Minimo 6 caracteres"
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
          hover:bg-patronos-orange/90 focus:outline-none focus:ring-2
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
