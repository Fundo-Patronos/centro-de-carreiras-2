import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import sessionService from '../../services/sessionService';
import analytics, { EVENTS } from '../../services/analytics';

function StarRating({ rating, onRatingChange, disabled }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onRatingChange(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
            disabled={disabled}
            className={`p-1 transition-colors ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {isFilled ? (
              <StarSolidIcon className="h-8 w-8 text-yellow-400" />
            ) : (
              <StarIcon className="h-8 w-8 text-gray-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackModal({ session, viewerRole, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle, success, error
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComments('');
      setSubmitState('idle');
      setError('');
    }
  }, [isOpen]);

  // Determine the other person's name based on viewer role
  const isStudent = viewerRole === 'estudante';
  const otherPersonName = isStudent ? session?.mentor_name : session?.student_name;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Por favor, selecione uma avaliacao.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await sessionService.submitFeedback(session.id, {
        rating,
        comments: comments.trim(),
      });

      analytics.track(EVENTS.SESSION_FEEDBACK_SUBMITTED, {
        session_id: session.id,
        rating,
        has_comments: Boolean(comments.trim()),
        user_role: viewerRole,
      });

      if (result.success) {
        setSubmitState('success');
        if (onSuccess) {
          onSuccess(session.id, viewerRole);
        }
      } else {
        setError(result.message || 'Falha ao enviar feedback');
        setSubmitState('error');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      const errorMessage = err.response?.data?.detail || 'Erro ao enviar feedback. Tente novamente.';
      setError(errorMessage);
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      analytics.track(EVENTS.FEEDBACK_MODAL_CLOSED, {
        session_id: session?.id,
        submit_state: submitState,
        user_role: viewerRole,
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
                  Avaliar Sessao
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
                  Feedback enviado!
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Obrigado por avaliar sua sessao com <strong>{otherPersonName}</strong>.
                  Seu feedback nos ajuda a melhorar o programa.
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
                  {/* Person info */}
                  <div className="mb-6 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-patronos-orange to-patronos-purple text-lg font-semibold text-white">
                      {otherPersonName?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{otherPersonName}</p>
                      <p className="text-sm text-gray-600">
                        {isStudent ? session.mentor_company : 'Estudante'}
                      </p>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Rating field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Como foi sua experiencia?
                    </label>
                    <div className="flex justify-center">
                      <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="mt-2 text-center text-sm text-gray-500">
                      {rating === 0 && 'Selecione uma nota de 1 a 5 estrelas'}
                      {rating === 1 && 'Muito ruim'}
                      {rating === 2 && 'Ruim'}
                      {rating === 3 && 'Regular'}
                      {rating === 4 && 'Bom'}
                      {rating === 5 && 'Excelente'}
                    </p>
                  </div>

                  {/* Comments field */}
                  <div>
                    <label htmlFor="feedback-comments" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Comentarios (opcional)
                    </label>
                    <textarea
                      id="feedback-comments"
                      rows={4}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-patronos-accent focus:ring-patronos-accent text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Conte-nos mais sobre sua experiencia..."
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
                    disabled={isSubmitting || rating === 0}
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
                      'Enviar Feedback'
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
