import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import sessionService from '../../services/sessionService';
import analytics, { EVENTS } from '../../services/analytics';

export default function ConfirmExternalBookingModal({ mentor, isOpen, onClose, onConfirmed }) {
  const navigate = useNavigate();

  const [state, setState] = useState('idle'); // idle, submitting, success, error

  const handleConfirm = async () => {
    if (!mentor) return;

    analytics.track(EVENTS.EXTERNAL_BOOKING_CONFIRMATION_CONFIRMED, {
      mentor_id: mentor.id,
      mentor_name: mentor.name,
    });

    setState('submitting');

    try {
      const response = await sessionService.createSession({
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        mentor_email: mentor.email,
        mentor_company: mentor.company,
        booking_method: 'scheduling_link',
      });

      analytics.track(EVENTS.SESSION_SCHEDULED_VIA_LINK, {
        mentor_id: mentor.id,
        mentor_name: mentor.name,
      });

      setState('success');
      onConfirmed?.(response);
    } catch (err) {
      console.error('Failed to record scheduling-link session:', err);
      analytics.track(EVENTS.EXTERNAL_BOOKING_CONFIRMATION_ERROR, {
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        error: err?.message || String(err),
      });
      setState('error');
    }
  };

  const handleClose = () => {
    if (state === 'submitting') return;

    if (state !== 'success') {
      analytics.track(EVENTS.EXTERNAL_BOOKING_CONFIRMATION_DISMISSED, {
        mentor_id: mentor?.id,
        mentor_name: mentor?.name,
      });
    }

    setState('idle');
    onClose();
  };

  const handleGoToSessions = () => {
    handleClose();
    navigate('/estudante/sessoes');
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
                  Você conseguiu marcar a mentoria?
                </DialogTitle>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={state === 'submitting'}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-50"
                >
                  <span className="sr-only">Fechar</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {state === 'success' ? (
              // Success state
              <div className="px-6 py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Mentoria registrada! Ela já aparece em Minhas Sessões.
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleGoToSessions}
                    className="inline-flex items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90"
                  >
                    Ver Minhas Sessões
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
              // Confirmation state
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  Abrimos a agenda de <strong>{mentor.name}</strong> em outra aba. Escolha o
                  horário por lá e, depois de confirmar o agendamento, clique em "Sim, já agendei"
                  para registrarmos a mentoria no seu painel e no painel do mentor.
                </p>

                {state === 'error' && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                    <span>Não foi possível registrar a mentoria. Tente novamente.</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={state === 'submitting'}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Ainda não
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={state === 'submitting'}
                    className="inline-flex items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90 disabled:opacity-50"
                  >
                    {state === 'submitting' ? 'Enviando...' : 'Sim, já agendei'}
                  </button>
                </div>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
