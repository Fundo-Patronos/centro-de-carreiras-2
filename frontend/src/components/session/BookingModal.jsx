import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import sessionService from '../../services/sessionService';
import analytics, { EVENTS } from '../../services/analytics';

export default function BookingModal({ mentor, isOpen, onClose }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle, success, error
  const [error, setError] = useState('');

  // Generate default message template when modal opens
  useEffect(() => {
    if (isOpen && mentor && userProfile) {
      const defaultMessage = `Ola ${mentor.name},

Meu nome e ${userProfile.displayName} e sou estudante da Unicamp.
Gostaria de agendar uma sessao de mentoria com voce para conversar sobre minha carreira.

Tenho interesse em aprender mais sobre sua trajetoria profissional e receber orientacoes sobre proximos passos.

Fico a disposicao para agendarmos um horario que seja conveniente para voce.

Atenciosamente,
${userProfile.displayName}`;

      setMessage(defaultMessage);
      setSubmitState('idle');
      setError('');

      // Track modal opened
      analytics.track(EVENTS.BOOKING_MODAL_OPENED, {
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        mentor_company: mentor.company,
      });
    }
  }, [isOpen, mentor, userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Por favor, escreva uma mensagem.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await sessionService.createSession({
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        mentor_email: mentor.email,
        mentor_company: mentor.company,
        message: message.trim(),
      });

      // Track analytics
      analytics.track(EVENTS.SESSION_REQUESTED, {
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        mentor_company: mentor.company,
      });

      analytics.track(EVENTS.SESSION_REQUEST_SUCCESS, {
        mentor_id: mentor.id,
        mentor_name: mentor.name,
      });

      setSubmitState('success');
    } catch (err) {
      console.error('Error creating session:', err);
      // Handle FastAPI validation errors (detail is an array) vs regular errors (detail is a string)
      let errorMessage = 'Erro ao enviar solicitacao. Tente novamente.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail.map(e => e.msg || e.message || String(e)).join(', ');
      }
      setError(errorMessage);
      setSubmitState('error');

      analytics.track(EVENTS.SESSION_REQUEST_ERROR, {
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        error: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSessions = () => {
    analytics.track(EVENTS.VIEW_MY_SESSIONS_CLICKED, {
      from: 'booking_modal_success',
      mentor_id: mentor?.id,
    });
    onClose();
    navigate('/estudante/sessoes');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      analytics.track(EVENTS.BOOKING_MODAL_CLOSED, {
        mentor_id: mentor?.id,
        submit_state: submitState,
      });
      setSubmitState('idle');
      onClose();
    }
  };

  if (!mentor) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[60]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-lg transform rounded-2xl bg-white shadow-xl transition-all data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Agendar Mentoria
                </DialogTitle>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {submitState === 'success' ? (
              // Success state
              <div className="px-6 py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Solicitacao enviada!
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Sua mensagem foi enviada para <strong>{mentor.name}</strong>.
                  Voce recebera uma confirmacao por email e o mentor entrara em contato em breve.
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleGoToSessions}
                    className="inline-flex items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90"
                  >
                    Ver Minhas Sessoes
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              // Form state
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4">
                  {/* Mentor info */}
                  <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    {mentor.photoURL ? (
                      <img
                        src={mentor.photoURL}
                        alt={mentor.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-patronos-orange to-patronos-purple text-lg font-semibold text-white">
                        {mentor.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{mentor.name}</p>
                      <p className="text-sm text-gray-600">{mentor.title} @ {mentor.company}</p>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Message field */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sua mensagem
                    </label>
                    <textarea
                      id="message"
                      rows={10}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-patronos-accent focus:ring-patronos-accent text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Escreva sua mensagem para o mentor..."
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Esta mensagem sera enviada por email para o mentor e uma copia sera enviada para voce.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="inline-flex items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitacao'
                    )}
                  </button>
                </div>
              </form>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
