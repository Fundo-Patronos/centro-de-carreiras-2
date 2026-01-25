import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import sessionService from '../../services/sessionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

// Status badge configuration
const statusConfig = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-700',
    icon: ClockIcon,
  },
  confirmed: {
    label: 'Confirmada',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircleIcon,
  },
  completed: {
    label: 'Concluida',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-700',
    icon: XCircleIcon,
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function SessionCard({ session }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header with mentor info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-patronos-orange to-patronos-purple text-lg font-semibold text-white">
            {session.mentor_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{session.mentor_name}</h3>
            <p className="text-sm text-patronos-accent font-medium">{session.mentor_company}</p>
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* Message preview */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 line-clamp-3">{session.message}</p>
      </div>

      {/* Footer with date */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>Solicitado em {formatDate(session.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// Filter tabs
const filterTabs = [
  { key: null, label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Concluidas' },
];

export default function MySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  // Track page view on mount
  useEffect(() => {
    analytics.track(EVENTS.MY_SESSIONS_VIEWED);
  }, []);

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
    });
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Sessoes</h1>
        <p className="mt-1 text-gray-600">
          Acompanhe suas solicitacoes de mentoria
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
            <SessionCard key={session.id} session={session} />
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
              : 'Encontre um mentor e agende sua primeira sessao de mentoria.'}
          </p>
          {!activeFilter && (
            <Link
              to="/estudante/mentores"
              className="mt-4 inline-block px-4 py-2 bg-patronos-accent text-white rounded-lg hover:bg-patronos-accent/90"
            >
              Encontrar Mentores
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
