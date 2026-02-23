import { useState, Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import sessionService from '../../services/sessionService';
import analytics, { EVENTS } from '../../services/analytics';

// Status badge configuration
const statusConfig = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-700',
    icon: ClockIcon,
  },
  completed: {
    label: 'Concluida',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircleIcon,
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

export default function SessionCard({
  session,
  viewerRole, // 'estudante' or 'mentor'
  onStatusChange,
  onOpenResendModal,
  onOpenFeedbackModal,
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Determine which person's info to show
  const isStudent = viewerRole === 'estudante';
  const personName = isStudent ? session.mentor_name : session.student_name;
  const personDetail = isStudent ? session.mentor_company : session.student_email;

  // Determine feedback status for current user
  const hasFeedbackSubmitted = isStudent
    ? session.student_feedback_submitted
    : session.mentor_feedback_submitted;

  // Feedback is only available for completed sessions
  const isSessionCompleted = session.status === 'completed';
  const canSubmitFeedback = isSessionCompleted && !hasFeedbackSubmitted;

  const handleStatusToggle = async () => {
    if (isUpdating) return;

    const newStatus = session.status === 'pending' ? 'completed' : 'pending';
    setIsUpdating(true);

    try {
      const updatedSession = await sessionService.updateSessionStatus(session.id, newStatus);

      analytics.track(EVENTS.SESSION_STATUS_UPDATED, {
        session_id: session.id,
        old_status: session.status,
        new_status: newStatus,
        user_role: viewerRole,
      });

      if (onStatusChange) {
        onStatusChange(updatedSession);
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFeedbackClick = () => {
    analytics.track(EVENTS.FEEDBACK_MODAL_OPENED, {
      session_id: session.id,
      user_role: viewerRole,
    });
    if (onOpenFeedbackModal) {
      onOpenFeedbackModal(session);
    }
  };

  const handleResendClick = () => {
    analytics.track(EVENTS.RESEND_EMAIL_MODAL_OPENED, {
      session_id: session.id,
    });
    if (onOpenResendModal) {
      onOpenResendModal(session);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header with person info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-patronos-gradient text-lg font-semibold text-white">
            {personName?.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{personName}</h3>
            <p className="text-sm text-patronos-accent font-medium truncate">{personDetail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={session.status} />

          {/* Three-dot menu - only for students */}
          {isStudent && (
            <Menu as="div" className="relative">
              <MenuButton className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </MenuButton>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={handleResendClick}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                        >
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          Reenviar Email
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Transition>
            </Menu>
          )}
        </div>
      </div>

      {/* Message preview */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 line-clamp-2">{session.message}</p>
      </div>

      {/* Footer with date */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>Solicitado em {formatDate(session.created_at)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        {/* Status toggle button */}
        <button
          onClick={handleStatusToggle}
          disabled={isUpdating}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${
            session.status === 'pending'
              ? 'bg-patronos-coral text-white hover:bg-patronos-coral/90'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isUpdating ? (
            <>
              <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Atualizando...
            </>
          ) : session.status === 'pending' ? (
            <>
              <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
              Concluida
            </>
          ) : (
            <>
              <ClockIcon className="h-4 w-4 flex-shrink-0" />
              Pendente
            </>
          )}
        </button>

        {/* Feedback button - only active for completed sessions */}
        <button
          onClick={handleFeedbackClick}
          disabled={!canSubmitFeedback}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            hasFeedbackSubmitted
              ? 'bg-blue-50 text-blue-600 cursor-default'
              : !isSessionCompleted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-patronos-accent text-white hover:bg-patronos-orange/90'
          }`}
        >
          {hasFeedbackSubmitted ? (
            <>
              <CheckCircleSolidIcon className="h-4 w-4 flex-shrink-0" />
              Enviado
            </>
          ) : (
            <>
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 flex-shrink-0" />
              Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
