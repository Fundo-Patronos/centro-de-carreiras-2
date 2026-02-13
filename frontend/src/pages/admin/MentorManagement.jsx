import { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

export default function MentorManagement() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'visible' | 'hidden'
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    analytics.track('Admin Mentors Viewed');
  }, []);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getMentors();
      setMentors(data.mentors);
    } catch (err) {
      setError('Erro ao carregar mentores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleVisibility = async (uid, currentlyActive) => {
    const mentor = mentors.find((m) => m.uid === uid);
    try {
      setActionLoading(uid);
      const newIsActive = !currentlyActive;
      await adminService.updateMentorVisibility(uid, newIsActive);

      setMentors(
        mentors.map((m) =>
          m.uid === uid ? { ...m, isActive: newIsActive } : m
        )
      );

      showToast(
        newIsActive
          ? `${mentor.displayName} agora esta visivel`
          : `${mentor.displayName} foi ocultado`
      );

      analytics.track('Admin Mentor Visibility Changed', {
        mentor_uid: uid,
        mentor_name: mentor.displayName,
        is_active: newIsActive,
      });
    } catch (err) {
      showToast('Erro ao atualizar visibilidade', 'error');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and search
  const filteredMentors = mentors.filter((mentor) => {
    // Filter by visibility
    if (filter === 'visible' && !mentor.isActive) return false;
    if (filter === 'hidden' && mentor.isActive) return false;

    // Search by name, email, title, or company
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        mentor.displayName.toLowerCase().includes(query) ||
        mentor.email.toLowerCase().includes(query) ||
        mentor.title?.toLowerCase().includes(query) ||
        mentor.company?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const visibleCount = mentors.filter((m) => m.isActive).length;
  const hiddenCount = mentors.filter((m) => !m.isActive).length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Mentores</h1>
          <p className="mt-1 text-gray-600">
            Controle a visibilidade dos mentores na plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <EyeIcon className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">{visibleCount} visiveis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{hiddenCount} ocultos</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email, cargo ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
          />
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border-gray-300 text-sm focus:border-patronos-accent focus:ring-patronos-accent"
        >
          <option value="all">Todos ({mentors.length})</option>
          <option value="visible">Visiveis ({visibleCount})</option>
          <option value="hidden">Ocultos ({hiddenCount})</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button
            onClick={fetchMentors}
            className="ml-2 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && filteredMentors.length === 0 && (
        <div className="mt-12 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhum mentor encontrado
          </h3>
          <p className="mt-2 text-gray-600">
            {searchQuery
              ? 'Tente buscar com outros termos.'
              : 'Nenhum mentor cadastrado ainda.'}
          </p>
        </div>
      )}

      {/* Mentors grid */}
      {!error && filteredMentors.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.uid}
              className={`bg-white rounded-xl shadow-sm p-5 border-2 transition-colors ${
                mentor.isActive
                  ? 'border-transparent'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Photo */}
                {mentor.photoURL ? (
                  <img
                    src={mentor.photoURL}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-patronos-accent flex items-center justify-center text-white font-medium">
                    {mentor.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {mentor.displayName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {mentor.title || 'Sem cargo'}
                    {mentor.company && ` @ ${mentor.company}`}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {mentor.email}
                  </p>
                </div>
              </div>

              {/* Status badges */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      mentor.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {mentor.isActive ? 'Visivel' : 'Oculto'}
                  </span>
                  {mentor.isProfileComplete && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      Perfil completo
                    </span>
                  )}
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => handleToggleVisibility(mentor.uid, mentor.isActive)}
                  disabled={actionLoading === mentor.uid}
                  className={`p-2 rounded-lg transition-colors ${
                    mentor.isActive
                      ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={mentor.isActive ? 'Ocultar mentor' : 'Mostrar mentor'}
                >
                  {actionLoading === mentor.uid ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : mentor.isActive ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
