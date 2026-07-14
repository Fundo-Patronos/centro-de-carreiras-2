import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import mentorService from '../../services/mentorService';
import analytics, { EVENTS } from '../../services/analytics';
import TagInput from '../../components/mentor/TagInput';
import PhotoUpload from '../../components/mentor/PhotoUpload';
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

// Suggestions for tags
const TAG_SUGGESTIONS = [
  'Tecnologia',
  'Consultoria',
  'Financas',
  'Marketing',
  'Vendas',
  'Recursos Humanos',
  'Empreendedorismo',
  'Pesquisa',
  'Academia',
  'Engenharia',
  'Produto',
  'Design',
  'Dados',
  'Direito',
  'Saude',
];

const EXPERTISE_SUGGESTIONS = [
  'Transicao de carreira',
  'Primeiro emprego',
  'Entrevistas',
  'Curriculo',
  'LinkedIn',
  'Networking',
  'Lideranca',
  'Gestao de tempo',
  'Desenvolvimento pessoal',
  'Startups',
  'Investimentos',
  'Negociacao salarial',
  'MBA e pos-graduacao',
  'Carreira internacional',
];

const PATRONOS_RELATIONS = [
  'Patrono',
  'Ex-bolsista',
  'Voluntario',
  'Parceiro',
  'Outro',
];

const DEGREE_LEVELS = [
  'Graduacao',
  'Pos-graduacao (Mestrado)',
  'Pos-graduacao (Doutorado)',
  'Pos-graduacao (MBA)',
];

export default function MeuPerfil() {
  const { userProfile, refreshProfile } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    bio: '',
    linkedin: '',
    schedulingLink: '',
    tags: [],
    expertise: [],
    course: '',
    graduationYear: '',
    isUnicampAlumni: null,
    unicampDegreeLevel: '',
    alternativeUniversity: '',
    patronosRelation: '',
  });
  const [originalData, setOriginalData] = useState({});

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  // Track page view
  useEffect(() => {
    analytics.track(EVENTS.MENTOR_PROFILE_PAGE_VIEWED);
  }, []);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mentorService.getMyProfile();
      const profile = data.mentorProfile || {};

      const formValues = {
        title: profile.title || '',
        company: profile.company || '',
        bio: profile.bio || '',
        linkedin: profile.linkedin || '',
        schedulingLink: profile.schedulingLink || '',
        tags: profile.tags || [],
        expertise: profile.expertise || [],
        course: profile.course || '',
        graduationYear: profile.graduationYear || '',
        isUnicampAlumni: profile.isUnicampAlumni,
        unicampDegreeLevel: profile.unicampDegreeLevel || '',
        alternativeUniversity: profile.alternativeUniversity || '',
        patronosRelation: profile.patronosRelation || '',
      };

      setFormData(formValues);
      setOriginalData(formValues);
      setPhotoURL(profile.photoURL || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Erro ao carregar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSchedulingDocClick = (provider) => {
    analytics.track(EVENTS.SCHEDULING_DOC_CLICKED, { provider });
  };

  const handleTutorialToggle = (e) => {
    analytics.track(EVENTS.SCHEDULING_TUTORIAL_TOGGLED, {
      open: e.target.open,
    });
  };

  const handlePhotoUpload = async (file) => {
    try {
      setIsUploadingPhoto(true);
      setPhotoError(null);

      const result = await mentorService.uploadPhoto(file);

      setPhotoURL(result.photoURL);

      analytics.track(EVENTS.MENTOR_PHOTO_UPLOADED);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setPhotoError('Erro ao enviar foto. Tente novamente.');
      analytics.track(EVENTS.MENTOR_PHOTO_UPLOAD_ERROR, {
        error: err.message,
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      // Only send changed fields
      const changedFields = {};
      for (const key of Object.keys(formData)) {
        const current = formData[key];
        const original = originalData[key];

        // Deep comparison for arrays
        if (Array.isArray(current) && Array.isArray(original)) {
          if (JSON.stringify(current) !== JSON.stringify(original)) {
            changedFields[key] = current;
          }
        } else if (current !== original) {
          changedFields[key] = current;
        }
      }

      if (Object.keys(changedFields).length === 0) {
        setSuccess(true);
        return;
      }

      // Convert graduationYear to number if present
      if (changedFields.graduationYear) {
        changedFields.graduationYear = parseInt(changedFields.graduationYear, 10) || null;
      }

      await mentorService.updateMyProfile(changedFields);

      setOriginalData({ ...formData });
      setSuccess(true);

      // Refresh user profile in context
      if (refreshProfile) {
        await refreshProfile();
      }

      analytics.track(EVENTS.MENTOR_PROFILE_SAVED, {
        fields_updated: Object.keys(changedFields),
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Erro ao salvar perfil. Tente novamente.');
      analytics.track(EVENTS.MENTOR_PROFILE_SAVE_ERROR, {
        error: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-1 text-gray-600">
          Atualize suas informacoes para que os estudantes possam conhecer voce melhor.
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
          <p className="text-sm text-green-700">Perfil atualizado com sucesso!</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Section 1: Photo & Basic Info */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informacoes Basicas
          </h2>

          <div className="space-y-6">
            {/* Photo upload */}
            <PhotoUpload
              currentPhotoURL={photoURL}
              onUpload={handlePhotoUpload}
              isUploading={isUploadingPhoto}
              error={photoError}
            />

            {/* Name (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={userProfile?.displayName || ''}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                O nome e gerenciado pela sua conta.
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulo / Cargo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Software Engineer, Product Manager"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Ex: Google, Nubank"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="url"
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/seu-perfil"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
            </div>
          </div>
        </section>

        {/* Section: Scheduling Link */}
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
            sem troca de emails. Se voce nao adicionar um link, os estudantes
            continuarao enviando solicitacoes por email normalmente.
          </p>

          <div className="space-y-6">
            {/* Scheduling link input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link de agendamento
              </label>
              <input
                type="url"
                value={formData.schedulingLink}
                onChange={(e) => handleInputChange('schedulingLink', e.target.value)}
                placeholder="https://calendar.app.google/... ou https://outlook.office365.com/book/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Cole o link publico do seu horario de agendamento. Deve comecar com https://
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
                  Escolha a ferramenta que voce ja usa e siga o passo a passo oficial:
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
                      Criar um horario de agendamento &rarr;
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
                      Visao geral do Bookings &rarr;
                    </span>
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  Depois de criar, copie o link publico gerado e cole no campo acima.
                </p>
              </div>
            </details>

            {/* Tip: control meeting volume */}
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
              <LightBulbIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Dica: controle o volume de mentorias</p>
                <p className="mt-1">
                  A procura dos estudantes pode ser alta. Nas configuracoes do seu
                  link de agendamento, limite o numero de reunioes por semana ou por
                  mes e defina os horarios disponiveis, para manter um ritmo
                  sustentavel para voce.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Bio */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sobre Voce
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biografia
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Conte um pouco sobre sua trajetoria profissional e o que te motiva a ser mentor..."
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.bio.length}/500 caracteres
            </p>
          </div>
        </section>

        {/* Section 3: Career Areas */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Areas de Atuacao
          </h2>

          <div className="space-y-6">
            <TagInput
              label="Areas de Carreira"
              value={formData.tags}
              onChange={(tags) => handleInputChange('tags', tags)}
              suggestions={TAG_SUGGESTIONS}
              placeholder="Ex: Tecnologia, Consultoria"
              maxTags={5}
            />

            <TagInput
              label="Como Posso Ajudar"
              value={formData.expertise}
              onChange={(expertise) => handleInputChange('expertise', expertise)}
              suggestions={EXPERTISE_SUGGESTIONS}
              placeholder="Ex: Transicao de carreira, Curriculo"
              maxTags={5}
            />
          </div>
        </section>

        {/* Section 4: Education */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Formacao Academica
          </h2>

          <div className="space-y-6">
            {/* Unicamp Alumni */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voce e ex-aluno(a) da Unicamp?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isUnicampAlumni"
                    checked={formData.isUnicampAlumni === true}
                    onChange={() => handleInputChange('isUnicampAlumni', true)}
                    className="h-4 w-4 text-patronos-accent focus:ring-patronos-accent"
                  />
                  <span className="text-sm text-gray-700">Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isUnicampAlumni"
                    checked={formData.isUnicampAlumni === false}
                    onChange={() => handleInputChange('isUnicampAlumni', false)}
                    className="h-4 w-4 text-patronos-accent focus:ring-patronos-accent"
                  />
                  <span className="text-sm text-gray-700">Nao</span>
                </label>
              </div>
            </div>

            {/* Conditional: Unicamp degree level */}
            {formData.isUnicampAlumni === true && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel do Curso na Unicamp
                </label>
                <select
                  value={formData.unicampDegreeLevel}
                  onChange={(e) => handleInputChange('unicampDegreeLevel', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
                >
                  <option value="">Selecione...</option>
                  {DEGREE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Conditional: Alternative university */}
            {formData.isUnicampAlumni === false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Universidade de Formacao
                </label>
                <input
                  type="text"
                  value={formData.alternativeUniversity}
                  onChange={(e) => handleInputChange('alternativeUniversity', e.target.value)}
                  placeholder="Ex: USP, UFRJ"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
                />
              </div>
            )}

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => handleInputChange('course', e.target.value)}
                placeholder="Ex: Engenharia de Computacao, Administracao"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
            </div>

            {/* Graduation Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano de Formatura
              </label>
              <input
                type="number"
                value={formData.graduationYear}
                onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                placeholder="Ex: 2020"
                min="1950"
                max="2030"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
              />
            </div>
          </div>
        </section>

        {/* Section 5: Patronos Relationship */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Relacao com Patronos
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qual sua relacao com o Fundo Patronos?
            </label>
            <select
              value={formData.patronosRelation}
              onChange={(e) => handleInputChange('patronosRelation', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-patronos-accent focus:ring-1 focus:ring-patronos-accent"
            >
              <option value="">Selecione...</option>
              {PATRONOS_RELATIONS.map((relation) => (
                <option key={relation} value={relation}>
                  {relation}
                </option>
              ))}
            </select>
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
            {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
          </button>
        </div>
      </div>
    </div>
  );
}
