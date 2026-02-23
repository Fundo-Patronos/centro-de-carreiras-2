import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import sessionService from '../../services/sessionService';
import analytics, { EVENTS } from '../../services/analytics';

export default function ResendEmailModal({ session, isOpen, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle, success, error
  const [error, setError] = useState('');

  // Initialize message when modal opens
  useEffect(() => {
    if (isOpen && session) {
      setMessage(session.message || '');
      setSubmitState('idle');
      setError('');
    }
  }, [isOpen, session]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Por favor, escreva uma mensagem.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await sessionService.resendSessionEmail(session.id, message.trim());

      analytics.track(EVENTS.SESSION_EMAIL_RESENT, {
        session_id: session.id,
        mentor_name: session.mentor_name,
        success: result.success,
      });

      if (result.success) {
        setSubmitState('success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.message || 'Falha ao reenviar email');
        setSubmitState('error');
      }
    } catch (err) {
      console.error('Error resending email:', err);
      const errorMessage = err.response?.data?.detail || 'Erro ao reenviar email. Tente novamente.';
      setError(errorMessage);
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      analytics.track(EVENTS.RESEND_EMAIL_MODAL_CLOSED, {
        session_id: session?.id,
        submit_state: submitState,
      });
      setSubmitState('idle');
      onClose();
    }
  };

  if (!session) return null;

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
                  Reenviar Email
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
                  Email reenviado!
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Sua mensagem foi reenviada para <strong>{session.mentor_name}</strong>.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90"
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-patronos-orange to-patronos-purple text-lg font-semibold text-white">
                      {session.mentor_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.mentor_name}</p>
                      <p className="text-sm text-gray-600">{session.mentor_company}</p>
                    </div>
                  </div>

                  {/* Info text */}
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                    <EnvelopeIcon className="h-5 w-5 flex-shrink-0" />
                    <span>
                      Voce pode editar a mensagem antes de reenviar. O mentor recebera um novo email com esta mensagem.
                    </span>
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
                    <label htmlFor="resend-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sua mensagem
                    </label>
                    <textarea
                      id="resend-message"
                      rows={10}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-patronos-accent focus:ring-patronos-accent text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Escreva sua mensagem para o mentor..."
                    />
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
                      'Reenviar Email'
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
