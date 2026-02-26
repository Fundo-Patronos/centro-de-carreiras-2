import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PendingMentorDrawer({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}) {
  if (!user) return null;

  const handleApprove = () => {
    onApprove(user.uid, user.email);
  };

  const handleReject = () => {
    onReject(user.uid, user.email);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-xl transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
            >
              <div className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                {/* Header */}
                <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        Solicitacao de Mentor
                      </DialogTitle>
                      <p className="mt-1 text-sm text-gray-500">
                        Revise as informacoes antes de aprovar
                      </p>
                    </div>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        onClick={onClose}
                        className="relative rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-patronos-accent"
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Fechar</span>
                        <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 px-4 py-6 sm:px-6">
                  {/* Profile header */}
                  <div className="flex items-center gap-4 mb-6">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-patronos-gradient flex items-center justify-center text-white text-xl font-bold">
                        {user.displayName?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {user.displayName}
                      </h2>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        Mentor
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{user.email}</p>
                      </div>
                    </div>

                    {/* Company */}
                    {user.company && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Empresa</p>
                          <p className="text-sm text-gray-900">{user.company}</p>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    {user.title && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Cargo</p>
                          <p className="text-sm text-gray-900">{user.title}</p>
                        </div>
                      </div>
                    )}

                    {/* Course */}
                    {user.curso && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                          <AcademicCapIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Curso</p>
                          <p className="text-sm text-gray-900">{user.curso}</p>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn */}
                    {user.linkedin && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                          <a
                            href={user.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-patronos-accent hover:underline"
                          >
                            Ver perfil
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Registration date */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Data de cadastro</p>
                        <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info callout */}
                  <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Nota:</strong> Apos a aprovacao, o mentor podera completar seu perfil
                      (bio, areas de atuacao, etc.) na plataforma antes de aparecer para os estudantes.
                    </p>
                  </div>
                </div>

                {/* Footer with actions */}
                <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Aprovar
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
