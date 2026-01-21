import { useNavigate } from 'react-router-dom';
import { ClockIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PendingApproval() {
  const { userProfile, loading, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/auth');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // If user is not pending, redirect to appropriate page
  if (!firebaseUser) {
    navigate('/auth');
    return null;
  }

  if (userProfile?.status === 'active') {
    const redirectPath =
      userProfile.role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard';
    navigate(redirectPath);
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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            Aguardando Aprovacao
          </h2>

          <p className="mt-4 text-gray-600">
            Sua conta esta aguardando aprovacao de um administrador.
            Voce recebera um e-mail quando sua conta for aprovada.
          </p>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">
              <p>
                <span className="font-medium text-gray-700">E-mail:</span>{' '}
                {userProfile?.email || firebaseUser?.email}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-700">Perfil:</span>{' '}
                {userProfile?.role === 'estudante' ? 'Estudante' : 'Mentor'}
              </p>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              O processo de aprovacao pode levar ate 48 horas uteis.
              Agradecemos sua paciencia.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sair
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Fundo Patronos da Unicamp
        </p>
      </div>
    </div>
  );
}
