import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

export default function UserApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'estudante' | 'mentor'
  const [actionLoading, setActionLoading] = useState(null); // uid of user being processed
  const [toast, setToast] = useState(null);

  // Track page view on mount
  useEffect(() => {
    analytics.track(EVENTS.ADMIN_APPROVALS_VIEWED);
  }, []);

  // Fetch pending users on mount
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingUsers();
      setUsers(data.users);
    } catch (err) {
      setError('Erro ao carregar usuarios pendentes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (uid, email) => {
    const user = users.find(u => u.uid === uid);
    try {
      setActionLoading(uid);
      await adminService.approveUser(uid);
      setUsers(users.filter((u) => u.uid !== uid));
      showToast(`Usuario ${email} aprovado com sucesso`);
      analytics.track(EVENTS.USER_APPROVED, {
        approved_user_uid: uid,
        approved_user_email: email,
        approved_user_role: user?.role,
      });
    } catch (err) {
      showToast('Erro ao aprovar usuario', 'error');
      console.error(err);
      analytics.track(EVENTS.ADMIN_ACTION_ERROR, {
        action: 'approve',
        user_uid: uid,
        error: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid, email) => {
    if (!window.confirm(`Tem certeza que deseja rejeitar ${email}?`)) {
      return;
    }

    const user = users.find(u => u.uid === uid);
    try {
      setActionLoading(uid);
      await adminService.rejectUser(uid);
      setUsers(users.filter((u) => u.uid !== uid));
      showToast(`Usuario ${email} rejeitado`);
      analytics.track(EVENTS.USER_REJECTED, {
        rejected_user_uid: uid,
        rejected_user_email: email,
        rejected_user_role: user?.role,
      });
    } catch (err) {
      showToast('Erro ao rejeitar usuario', 'error');
      console.error(err);
      analytics.track(EVENTS.ADMIN_ACTION_ERROR, {
        action: 'reject',
        user_uid: uid,
        error: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    analytics.track(EVENTS.ADMIN_FILTER_CHANGED, {
      filter_type: newFilter,
    });
  };

  const filteredUsers =
    filter === 'all' ? users : users.filter((u) => u.role === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Aprovacoes</h1>
          <p className="mt-1 text-gray-600">
            Gerencie usuarios aguardando aprovacao
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:border-patronos-accent focus:ring-patronos-accent"
          >
            <option value="all">Todos</option>
            <option value="estudante">Estudantes</option>
            <option value="mentor">Mentores</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button
            onClick={fetchPendingUsers}
            className="ml-2 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && filteredUsers.length === 0 && (
        <div className="mt-12 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhum usuario pendente
          </h3>
          <p className="mt-2 text-gray-600">
            {filter === 'all'
              ? 'Todos os usuarios foram aprovados ou rejeitados.'
              : `Nenhum ${filter} aguardando aprovacao.`}
          </p>
        </div>
      )}

      {/* Users table */}
      {!error && filteredUsers.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-patronos-accent flex items-center justify-center text-white font-medium">
                          {user.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === 'estudante'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.role === 'estudante' ? 'Estudante' : 'Mentor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprove(user.uid, user.email)}
                        disabled={actionLoading === user.uid}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(user.uid, user.email)}
                        disabled={actionLoading === user.uid}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Rejeitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
