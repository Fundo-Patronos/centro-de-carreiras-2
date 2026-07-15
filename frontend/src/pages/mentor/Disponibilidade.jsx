import { useState, useEffect } from 'react';
import mentorService from '../../services/mentorService';
import analytics, { EVENTS } from '../../services/analytics';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

// External documentation for creating a scheduling link
const SCHEDULING_DOCS = {
  google:
    'https://support.google.com/calendar/answer/10729749?hl=pt-br',
  outlook:
    'https://learn.microsoft.com/pt-br/microsoft-365/bookings/bookings-overview?view=o365-worldwide',
};

export default function Disponibilidade() {
  const [schedulingLink, setSchedulingLink] = useState('');
  const [originalLink, setOriginalLink] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    analytics.track(EVENTS.MENTOR_PROFILE_PAGE_VIEWED, { section: 'disponibilidade' });
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mentorService.getMyProfile();
      const profile = data.mentorProfile || {};
      const link = profile.schedulingLink || '';

      setSchedulingLink(link);
      setOriginalLink(link);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Erro ao carregar disponibilidade. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (value) => {
    setSchedulingLink(value);
    setSuccess(false);
  };

  const handleSchedulingDocClick = (provider) => {
    analytics.track(EVENTS.SCHEDULING_DOC_CLICKED, { provider });
  };

  const handleTutorialToggle = (e) => {
    analytics.track(EVENTS.SCHEDULING_TUTORIAL_TOGGLED, { open: e.target.open });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      await mentorService.updateMyProfile({ schedulingLink });

      setOriginalLink(schedulingLink);
      setSuccess(true);

      analytics.track(EVENTS.MENTOR_PROFILE_SAVED, {
        fields_updated: ['schedulingLink'],
        section: 'disponibilidade',
      });
    } catch (err) {
      console.error('Failed to save scheduling link:', err);
      setError('Erro ao salvar disponibilidade. Tente novamente.');
      analytics.track(EVENTS.MENTOR_PROFILE_SAVE_ERROR, {
        error: err.message,
        section: 'disponibilidade',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = schedulingLink !== originalLink;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidade</h1>
        <p className="mt-1 text-gray-600">
          Defina como os estudantes podem agendar mentorias com você.
        </p>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 flex items-start gap-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Disponibilidade atualizada com sucesso!</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Scheduling Link */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="h-5 w-5 text-patronos-accent" />
            <h2 className="text-lg font-semibold text-gray-900">
              Link de Agendamento
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Adicione um link de agendamento (Google Agenda ou Microsoft Bookings)
            para que os estudantes marquem a mentoria diretamente na sua agenda,
            sem troca de emails. Se você não adicionar um link, os estudantes
            enviarão solicitações por email para coordenar um horário.
          </p>

          <div className="space-y-6">
            {/* Scheduling link input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link de agendamento
              </label>
              <input
                type="url"
                value={schedulingLink}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="https://calendar.app.google/... ou https://outlook.office365.com/book/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Cole o link público do seu horário de agendamento. Deve começar com https://
              </p>
            </div>

            {/* Tutorial */}
            <details
              onToggle={handleTutorialToggle}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <summary className="cursor-pointer text-sm font-medium text-gray-900 select-none">
                Como criar meu link de agendamento?
              </summary>
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <p>
                  Escolha a ferramenta que você já usa e siga o passo a passo oficial:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={SCHEDULING_DOCS.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSchedulingDocClick('google')}
                    className="flex flex-col rounded-lg border border-gray-300 bg-white p-3 hover:border-patronos-accent hover:shadow-sm transition"
                  >
                    <span className="font-semibold text-gray-900">Google Agenda</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      Criar um horário de agendamento &rarr;
                    </span>
                  </a>
                  <a
                    href={SCHEDULING_DOCS.outlook}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSchedulingDocClick('outlook')}
                    className="flex flex-col rounded-lg border border-gray-300 bg-white p-3 hover:border-patronos-accent hover:shadow-sm transition"
                  >
                    <span className="font-semibold text-gray-900">Microsoft Bookings (Outlook)</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      Visão geral do Bookings &rarr;
                    </span>
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  Depois de criar, copie o link público gerado e cole no campo acima.
                </p>
              </div>
            </details>

            {/* Tip: control meeting volume */}
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
              <LightBulbIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Dica: controle o volume de mentorias</p>
                <p className="mt-1">
                  A procura dos estudantes pode ser alta. Nas configurações do seu
                  link de agendamento, limite o número de reuniões por semana ou por
                  mês e defina os horários disponíveis, para manter um ritmo
                  sustentável para você.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`
              px-6 py-2.5 rounded-lg font-medium transition-colors
              ${hasChanges
                ? 'bg-patronos-accent text-white hover:bg-patronos-accent/90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
              ${isSaving ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
