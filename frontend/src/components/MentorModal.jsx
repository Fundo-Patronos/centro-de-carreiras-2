import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function MentorModal({ mentor, open, onClose }) {
  const navigate = useNavigate()

  if (!mentor) return null

  const handleAgendarMentoria = () => {
    onClose()
    navigate('/mentorias/agendar')
  }

  // Tag-to-color mapping - each tag always gets the same color
  const tagColorMap = {
    'Consultoria': 'bg-purple-50 text-purple-700 inset-ring-purple-700/10',
    'Indústria': 'bg-yellow-50 text-yellow-800 inset-ring-yellow-600/20',
    'Tecnologia': 'bg-orange-50 text-orange-700 inset-ring-orange-600/10',
    'Empreendedorismo e Startups': 'bg-pink-50 text-pink-700 inset-ring-pink-700/10',
    'Mercado Financeiro': 'bg-green-50 text-green-700 inset-ring-green-600/20',
    'Carreira Internacional': 'bg-blue-50 text-blue-700 inset-ring-blue-700/10',
    'Carreira Acadêmica e Pesquisa': 'bg-indigo-50 text-indigo-700 inset-ring-indigo-700/10',
    'Setor Público e Governo': 'bg-red-50 text-red-700 inset-ring-red-600/10',
    'Terceiro Setor': 'bg-teal-50 text-teal-700 inset-ring-teal-600/10',
  }

  // Default colors for tags not in the map
  const defaultTagColors = [
    'bg-purple-50 text-purple-700 inset-ring-purple-700/10',
    'bg-blue-50 text-blue-700 inset-ring-blue-700/10',
    'bg-green-50 text-green-700 inset-ring-green-600/20',
    'bg-pink-50 text-pink-700 inset-ring-pink-700/10',
    'bg-yellow-50 text-yellow-800 inset-ring-yellow-600/20',
    'bg-indigo-50 text-indigo-700 inset-ring-indigo-700/10',
    'bg-orange-50 text-orange-700 inset-ring-orange-600/10',
  ]

  const getTagColor = (tag, index) => {
    // Return mapped color if exists, otherwise use rotating default colors
    return tagColorMap[tag] || defaultTagColors[index % defaultTagColors.length]
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-6xl h-[800px] flex flex-col">
                {/* Fixed header section */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
                  <div className="absolute right-0 top-0 pr-6 pt-6">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Fechar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Header with profile image and name */}
                  <div className="flex items-center gap-6">
                    <img
                      alt={mentor.nome}
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.nome)}&size=256&background=random`}
                      className="size-20 shrink-0 rounded-full bg-gray-300 outline -outline-offset-1 outline-black/5"
                    />
                    <div className="flex-1">
                      <DialogTitle as="h3" className="text-xl font-semibold text-gray-900">
                        {mentor.nome}
                      </DialogTitle>
                      <p className="mt-1 text-sm text-gray-500">{mentor.titulo}</p>
                      {mentor.companhia && (
                        <p className="mt-0.5 text-sm text-gray-500">{mentor.companhia}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable content section */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                      <dl className="divide-y divide-gray-100">
                        {/* Tags */}
                        {mentor.tags && mentor.tags.length > 0 && (
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium text-gray-900">Áreas de Atuação</dt>
                            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                              <div className="flex flex-wrap gap-2">
                                {mentor.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium inset-ring ${getTagColor(tag, index)}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </dd>
                          </div>
                        )}

                        {/* Curso */}
                        {mentor.curso && (
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium text-gray-900">Formação na Unicamp</dt>
                            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{mentor.curso}</dd>
                          </div>
                        )}

                        {/* Pode ajudar com */}
                        {mentor.area_expertise && mentor.area_expertise.length > 0 && (
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium text-gray-900">Pode ajudar com</dt>
                            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                              <div className="flex flex-wrap gap-2">
                                {mentor.area_expertise.map((area, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium inset-ring ${getTagColor(area, index)}`}
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </dd>
                          </div>
                        )}

                        {/* Email */}
                        <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                          <dt className="text-sm font-medium text-gray-900">Email</dt>
                          <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                            <a href={`mailto:${mentor.email}`} className="text-patronos-accent hover:text-patronos-pink">
                              {mentor.email}
                            </a>
                          </dd>
                        </div>

                        {/* LinkedIn */}
                        {mentor.linkedin && (
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium text-gray-900">LinkedIn</dt>
                            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                              <a
                                href={mentor.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-patronos-accent hover:text-patronos-pink"
                              >
                                Ver perfil no LinkedIn
                              </a>
                            </dd>
                          </div>
                        )}

                        {/* Biografia */}
                        {mentor.biografia && (
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium text-gray-900">Sobre</dt>
                            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                              {mentor.biografia}
                            </dd>
                          </div>
                        )}
                      </dl>
                </div>

                {/* Fixed footer section */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md bg-patronos-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-patronos-accent"
                      onClick={handleAgendarMentoria}
                    >
                      Agendar Mentoria
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
