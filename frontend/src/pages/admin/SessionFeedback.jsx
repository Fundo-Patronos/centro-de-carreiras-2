import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { feedbackService } from '../../services/feedbackService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import analytics, { EVENTS } from '../../services/analytics';

function StarDisplay({ rating }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= rating ? (
          <StarSolidIcon key={star} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon key={star} className="h-4 w-4 text-gray-300" />
        )
      ))}
    </div>
  );
}

function MeetingStatusBadge({ status }) {
  const config = {
    happened: { label: 'Aconteceu', className: 'bg-green-100 text-green-800' },
    scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-800' },
    not_happened: { label: 'Nao aconteceu', className: 'bg-red-100 text-red-800' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function FeedbackCard({ feedback, type }) {
  if (!feedback) {
    return (
      <div className="text-sm text-gray-500 italic">
        Aguardando resposta
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MeetingStatusBadge status={feedback.meeting_status} />
        {feedback.rating && <StarDisplay rating={feedback.rating} />}
      </div>
      {feedback.no_meeting_reason && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Motivo:</span> {feedback.no_meeting_reason}
        </p>
      )}
      {feedback.additional_feedback && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Comentario:</span> {feedback.additional_feedback}
        </p>
      )}
    </div>
  );
}

export default function SessionFeedback() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    analytics.track(EVENTS.ADMIN_FEEDBACK_VIEWED || 'Admin: Feedback Page Viewed');
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getAllFeedback();
      setSessions(data.sessions);
    } catch (err) {
      setError('Erro ao carregar feedback das sessoes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendFeedback = async (sessionId) => {
    try {
      setSendingId(sessionId);
      const result = await feedbackService.sendFeedbackEmails(sessionId);

      if (result.success) {
        showToast('Emails de feedback enviados com sucesso');
        // Refresh the list
        fetchFeedback();
      } else {
        showToast(result.message || 'Erro ao enviar emails', 'error');
      }
    } catch (err) {
      showToast('Erro ao enviar emails de feedback', 'error');
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getSessionStatus = (session) => {
    const studentResponded = !!session.student_feedback;
    const mentorResponded = !!session.mentor_feedback;
    const studentSent = session.student_feedback_sent;
    const mentorSent = session.mentor_feedback_sent;

    if (studentResponded && mentorResponded) {
      return { label: 'Completo', className: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
    }
    if (studentResponded || mentorResponded) {
      return { label: 'Parcial', className: 'bg-yellow-100 text-yellow-800', icon: ClockIcon };
    }
    if (studentSent || mentorSent) {
      return { label: 'Aguardando', className: 'bg-blue-100 text-blue-800', icon: ClockIcon };
    }
    return { label: 'Nao enviado', className: 'bg-gray-100 text-gray-800', icon: XCircleIcon };
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback das Sessoes</h1>
          <p className="mt-1 text-gray-600">
            Acompanhe o feedback das mentorias realizadas
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {sessions.length} {sessions.length === 1 ? 'sessao' : 'sessoes'}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
          <button
            onClick={fetchFeedback}
            className="ml-2 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && sessions.length === 0 && (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhuma sessao encontrada
          </h3>
          <p className="mt-2 text-gray-600">
            Ainda nao ha sessoes de mentoria registradas.
          </p>
        </div>
      )}

      {/* Sessions list */}
      {!error && sessions.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessao
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mentor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => {
                const status = getSessionStatus(session);
                const StatusIcon = status.icon;
                const isExpanded = expandedId === session.session_id;
                const canSend = !session.student_feedback_sent || !session.mentor_feedback_sent;

                return (
                  <>
                    <tr
                      key={session.session_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : session.session_id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            com {session.mentor_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(session.session_created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.student_feedback ? (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            {session.student_feedback.rating && (
                              <StarDisplay rating={session.student_feedback.rating} />
                            )}
                          </div>
                        ) : session.student_feedback_sent ? (
                          <span className="text-xs text-gray-500">Aguardando</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.mentor_feedback ? (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            {session.mentor_feedback.rating && (
                              <StarDisplay rating={session.mentor_feedback.rating} />
                            )}
                          </div>
                        ) : session.mentor_feedback_sent ? (
                          <span className="text-xs text-gray-500">Aguardando</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {canSend && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendFeedback(session.session_id);
                            }}
                            disabled={sendingId === session.session_id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-patronos-accent rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                            {sendingId === session.session_id ? 'Enviando...' : 'Enviar'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr key={`${session.session_id}-details`}>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Student feedback */}
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                                  Estudante
                                </span>
                                {session.student_name}
                              </h4>
                              <p className="text-xs text-gray-500 mb-2">{session.student_email}</p>
                              <FeedbackCard feedback={session.student_feedback} type="student" />
                            </div>

                            {/* Mentor feedback */}
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                  Mentor
                                </span>
                                {session.mentor_name}
                              </h4>
                              <p className="text-xs text-gray-500 mb-2">{session.mentor_email}</p>
                              <FeedbackCard feedback={session.mentor_feedback} type="mentor" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
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
