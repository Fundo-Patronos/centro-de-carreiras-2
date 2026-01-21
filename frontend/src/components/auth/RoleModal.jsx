import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { userService } from '../../services/userService';
import RoleSelector from './RoleSelector';
import analytics, { EVENTS } from '../../services/analytics';

export default function RoleModal({ isOpen, user, onClose }) {
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!role) {
      setError('Selecione se você é estudante ou mentor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create Firestore profile with selected role
      await userService.createUserProfile(user.uid, {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        role,
        authProvider: 'google',
      });

      analytics.track(EVENTS.ROLE_SELECTED, { role, auth_provider: 'google' });
      analytics.track(EVENTS.SIGN_UP_COMPLETED, { auth_provider: 'google', role });

      // Redirect to role-specific dashboard
      navigate(role === 'mentor' ? '/mentor/dashboard' : '/estudante/dashboard');
      onClose();
    } catch (err) {
      console.error('Profile creation error:', err);
      setError('Erro ao criar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-gray-900 text-center">
            Bem-vindo ao Centro de Carreiras!
          </DialogTitle>

          <p className="mt-2 text-sm text-gray-600 text-center">
            Para continuar, nos conte um pouco sobre você.
          </p>

          {user && (
            <div className="mt-4 flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-patronos-accent flex items-center justify-center text-white font-medium">
                  {user.displayName?.[0] || user.email?.[0] || '?'}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-6">
            <RoleSelector value={role} onChange={setRole} />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !role}
            className="
              mt-6 w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg
              text-sm font-medium text-white bg-patronos-accent
              hover:bg-patronos-purple/90 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-patronos-accent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {loading ? 'Criando perfil...' : 'Continuar'}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
