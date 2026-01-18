import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';
import GoogleButton from '../../components/auth/GoogleButton';
import MagicLinkForm from '../../components/auth/MagicLinkForm';
import RoleModal from '../../components/auth/RoleModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'magic'
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  const { isAuthenticated, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && userProfile) {
      const redirectPath =
        userProfile.role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard';
      navigate(redirectPath);
    }
  }, [isAuthenticated, userProfile, loading, navigate]);

  // Handle Google sign-in for new users
  const handleGoogleNewUser = (user) => {
    setPendingGoogleUser(user);
    setShowRoleModal(true);
  };

  const handleRoleModalClose = () => {
    setShowRoleModal(false);
    setPendingGoogleUser(null);
  };

  // Show loading while checking auth
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo and title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold">
          <span className="text-gradient">Centro de Carreiras</span>
        </h1>
        <p className="mt-2 text-center text-gray-600">
          {mode === 'login' && 'Entre na sua conta'}
          {mode === 'signup' && 'Crie sua conta'}
          {mode === 'magic' && 'Acesso rápido'}
        </p>
      </div>

      {/* Auth card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
          {/* Google Sign-In (always visible) */}
          <GoogleButton
            onNewUser={handleGoogleNewUser}
            label={mode === 'signup' ? 'Cadastrar com Google' : 'Entrar com Google'}
          />

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Mode-specific forms */}
          <div className="mt-6">
            {mode === 'login' && <LoginForm />}
            {mode === 'signup' && <SignupForm />}
            {mode === 'magic' && <MagicLinkForm />}
          </div>

          {/* Mode toggles */}
          <div className="mt-6 text-center text-sm space-y-2">
            {mode === 'login' && (
              <>
                <div>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-patronos-accent hover:underline"
                  >
                    Não tem conta? Cadastre-se
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setMode('magic')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Entrar sem senha
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-patronos-accent hover:underline"
              >
                Já tem conta? Entre
              </button>
            )}
            {mode === 'magic' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-patronos-accent hover:underline"
              >
                Voltar para login
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Fundo Patronos da Unicamp
        </p>
      </div>

      {/* Role selection modal for Google sign-in */}
      <RoleModal
        isOpen={showRoleModal}
        user={pendingGoogleUser}
        onClose={handleRoleModalClose}
      />
    </div>
  );
}
