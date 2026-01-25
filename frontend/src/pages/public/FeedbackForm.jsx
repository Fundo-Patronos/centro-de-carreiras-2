import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StarIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { feedbackService } from '../../services/feedbackService';

const MEETING_STATUS_OPTIONS = [
  { value: 'happened', label: 'Sim, o encontro aconteceu' },
  { value: 'scheduled', label: 'Ainda nao, mas esta agendado' },
  { value: 'not_happened', label: 'Nao, o encontro nao aconteceu' },
];

function StarRating({ rating, onRate, disabled = false }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onRate(star)}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className={`p-1 transition-transform ${!disabled ? 'hover:scale-110' : ''}`}
        >
          {(hoverRating || rating) >= star ? (
            <StarIcon className="h-8 w-8 text-yellow-400" />
          ) : (
            <StarOutlineIcon className="h-8 w-8 text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function FeedbackForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestInfo, setRequestInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [meetingStatus, setMeetingStatus] = useState('');
  const [noMeetingReason, setNoMeetingReason] = useState('');
  const [rating, setRating] = useState(0);
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token nao fornecido');
      setLoading(false);
      return;
    }

    fetchRequestInfo();
  }, [token]);

  const fetchRequestInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getFeedbackRequestInfo(token);
      setRequestInfo(data);

      if (data.already_submitted) {
        setSubmitted(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Link invalido ou expirado');
      } else {
        setError('Erro ao carregar formulario');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!meetingStatus) {
      setError('Por favor, selecione se o encontro aconteceu');
      return;
    }

    if (meetingStatus === 'happened' && rating === 0) {
      setError('Por favor, avalie o encontro');
      return;
    }

    if (meetingStatus === 'not_happened' && !noMeetingReason.trim()) {
      setError('Por favor, explique por que o encontro nao aconteceu');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await feedbackService.submitFeedback({
        token,
        meeting_status: meetingStatus,
        no_meeting_reason: meetingStatus === 'not_happened' ? noMeetingReason : null,
        rating: meetingStatus === 'happened' ? rating : null,
        additional_feedback: additionalFeedback || null,
      });

      setSubmitted(true);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Erro ao enviar feedback');
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-patronos-accent"></div>
      </div>
    );
  }

  // Error state (no token or invalid token)
  if (error && !requestInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold">
            <span className="text-gradient">Centro de Carreiras</span>
          </h1>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">Link Invalido</h2>
            <p className="mt-4 text-gray-600">{error}</p>
            <p className="mt-6 text-center text-xs text-gray-500">
              Fundo Patronos da Unicamp
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold">
            <span className="text-gradient">Centro de Carreiras</span>
          </h1>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">
              {requestInfo?.already_submitted ? 'Feedback ja Enviado' : 'Obrigado pelo Feedback!'}
            </h2>
            <p className="mt-4 text-gray-600">
              {requestInfo?.already_submitted
                ? 'Voce ja respondeu este formulario anteriormente.'
                : 'Sua resposta foi registrada com sucesso. Obrigado por ajudar a melhorar o programa de mentorias!'}
            </p>
            <p className="mt-6 text-center text-xs text-gray-500">
              Fundo Patronos da Unicamp
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  const isStudent = requestInfo?.recipient_type === 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <h1 className="text-center text-3xl font-bold">
          <span className="text-gradient">Centro de Carreiras</span>
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Fundo Patronos da Unicamp
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Ola, {requestInfo?.recipient_name}!
            </h2>
            <p className="mt-2 text-gray-600">
              {isStudent
                ? `Como foi sua experiencia de mentoria com ${requestInfo?.other_party_name}?`
                : `Como foi sua sessao de mentoria com ${requestInfo?.other_party_name}?`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meeting Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                O encontro de mentoria aconteceu?
              </label>
              <div className="space-y-2">
                {MEETING_STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      meetingStatus === option.value
                        ? 'border-patronos-accent bg-patronos-accent/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingStatus"
                      value={option.value}
                      checked={meetingStatus === option.value}
                      onChange={(e) => setMeetingStatus(e.target.value)}
                      className="h-4 w-4 text-patronos-accent focus:ring-patronos-accent"
                    />
                    <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason (if not happened) */}
            {meetingStatus === 'not_happened' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Por que o encontro nao aconteceu? *
                </label>
                <textarea
                  value={noMeetingReason}
                  onChange={(e) => setNoMeetingReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-patronos-accent focus:ring-patronos-accent"
                  placeholder="Explique brevemente..."
                  required
                />
              </div>
            )}

            {/* Rating (if happened) */}
            {meetingStatus === 'happened' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Como voce avalia o encontro? *
                </label>
                <div className="flex items-center gap-4">
                  <StarRating rating={rating} onRate={setRating} />
                  {rating > 0 && (
                    <span className="text-sm text-gray-500">
                      {rating === 1 && 'Ruim'}
                      {rating === 2 && 'Regular'}
                      {rating === 3 && 'Bom'}
                      {rating === 4 && 'Muito bom'}
                      {rating === 5 && 'Excelente'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Additional Feedback (always shown when status selected) */}
            {meetingStatus && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback adicional para a equipe Patronos (opcional)
                </label>
                <textarea
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-patronos-accent focus:ring-patronos-accent"
                  placeholder="Compartilhe sugestoes, elogios ou criticas..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Suas respostas sao confidenciais e visiveis apenas para a equipe Patronos.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !meetingStatus}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-patronos-orange to-patronos-purple hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-patronos-accent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Este formulario e confidencial e suas respostas serao usadas apenas para melhorar o programa.
        </p>
      </div>
    </div>
  );
}
