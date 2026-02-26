import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import sessionService from '../../services/sessionService';
import SessionCard from '../../components/session/SessionCard';
import ResendEmailModal from '../../components/session/ResendEmailModal';
import FeedbackModal from '../../components/session/FeedbackModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

// Filter tabs
const filterTabs = [
  { key: null, label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'completed', label: 'Concluidas' },
];

// Quick Access cards configuration
const studentQuickAccess = [
  {
    name: 'Mentores',
    href: '/estudante/mentores',
    icon: UserGroupIcon,
    description: 'Encontrar mentores',
    bgColor: 'bg-patronos-accent/10',
    hoverColor: 'group-hover:bg-patronos-accent/20',
    iconColor: 'text-patronos-accent',
  },
  {
    name: 'Vagas',
    href: '/estudante/vagas',
    icon: BriefcaseIcon,
    description: 'Ver oportunidades',
    bgColor: 'bg-blue-100',
    hoverColor: 'group-hover:bg-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    name: 'Alterar Senha',
    href: '/configuracoes/senha',
    icon: KeyIcon,
    description: 'Atualizar minha senha',
    bgColor: 'bg-orange-100',
    hoverColor: 'group-hover:bg-orange-200',
    iconColor: 'text-orange-600',
  },
];

const mentorQuickAccess = [
  {
    name: 'Disponibilidade',
    href: '/mentor/disponibilidade',
    icon: Cog6ToothIcon,
    description: 'Gerenciar horarios',
    bgColor: 'bg-patronos-accent/10',
    hoverColor: 'group-hover:bg-patronos-accent/20',
    iconColor: 'text-patronos-accent',
  },
  {
    name: 'Meu Perfil',
    href: '/mentor/perfil',
    icon: UserCircleIcon,
    description: 'Editar perfil',
    bgColor: 'bg-green-100',
    hoverColor: 'group-hover:bg-green-200',
    iconColor: 'text-green-600',
  },
];

export default function MySessions() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  // Modal states
  const [resendModalSession, setResendModalSession] = useState(null);
  const [feedbackModalSession, setFeedbackModalSession] = useState(null);

  const viewerRole = userProfile?.role || 'estudante';
  const isStudent = viewerRole === 'estudante';
  const quickAccessItems = isStudent ? studentQuickAccess : mentorQuickAccess;

  // Track page view on mount
  useEffect(() => {
    analytics.track(EVENTS.MY_SESSIONS_VIEWED, {
      user_role: viewerRole,
    });
  }, [viewerRole]);

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await sessionService.getMySessions();
        setSessions(data.sessions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Nao foi possivel carregar suas sessoes. Tente novamente.');
        analytics.trackError('load_sessions', { error: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Track filter changes
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    analytics.track(EVENTS.SESSION_FILTER_APPLIED, {
      filter_status: filter || 'all',
      user_role: viewerRole,
    });
  };

  // Handle quick access click
  const handleQuickAccessClick = (itemName) => {
    analytics.track(EVENTS.QUICK_ACCESS_CLICKED, {
      destination: itemName,
      user_role: viewerRole,
    });
  };

  // Handle session status change
  const handleStatusChange = (updatedSession) => {
    setSessions(prev =>
      prev.map(s => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  // Handle feedback success
  const handleFeedbackSuccess = (sessionId, role) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            student_feedback_submitted: role === 'estudante' ? true : s.student_feedback_submitted,
            mentor_feedback_submitted: role === 'mentor' ? true : s.mentor_feedback_submitted,
          };
        }
        return s;
      })
    );
  };

  // Filter sessions based on active filter
  const filteredSessions = activeFilter
    ? sessions.filter((session) => session.status === activeFilter)
    : sessions;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-red-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Erro ao carregar sessoes
          </h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-patronos-accent text-white rounded-lg hover:bg-patronos-accent/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Quick Access Section */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Acesso Rapido
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickAccessItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => handleQuickAccessClick(item.name)}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center mb-2 ${item.hoverColor} transition-colors`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
              <p className="text-xs text-gray-500">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Sessoes</h1>
        <p className="mt-1 text-gray-600">
          {isStudent
            ? 'Acompanhe suas solicitacoes de mentoria'
            : 'Gerencie as sessoes solicitadas por estudantes'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key || 'all'}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-patronos-accent text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        Mostrando {filteredSessions.length} {filteredSessions.length === 1 ? 'sessao' : 'sessoes'}
      </p>

      {/* Sessions grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              viewerRole={viewerRole}
              onStatusChange={handleStatusChange}
              onOpenResendModal={setResendModalSession}
              onOpenFeedbackModal={setFeedbackModalSession}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {activeFilter ? 'Nenhuma sessao encontrada' : 'Voce ainda nao tem sessoes'}
          </h3>
          <p className="mt-1 text-gray-500 max-w-sm mx-auto">
            {activeFilter
              ? 'Tente ajustar o filtro para ver outras sessoes.'
              : isStudent
                ? 'Encontre um mentor e agende sua primeira sessao de mentoria.'
                : 'Quando estudantes solicitarem mentorias, elas aparecerao aqui.'}
          </p>
          {!activeFilter && isStudent && (
            <Link
              to="/estudante/mentores"
              className="mt-4 inline-block px-4 py-2 bg-patronos-accent text-white rounded-lg hover:bg-patronos-accent/90"
            >
              Encontrar Mentores
            </Link>
          )}
        </div>
      )}

      {/* Resend Email Modal */}
      <ResendEmailModal
        session={resendModalSession}
        isOpen={Boolean(resendModalSession)}
        onClose={() => setResendModalSession(null)}
        onSuccess={() => {
          // Optionally refresh sessions or show a toast
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        session={feedbackModalSession}
        viewerRole={viewerRole}
        isOpen={Boolean(feedbackModalSession)}
        onClose={() => setFeedbackModalSession(null)}
        onSuccess={handleFeedbackSuccess}
      />
    </div>
  );
}
