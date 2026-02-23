import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';
import BookingModal from '../session/BookingModal';

function getTagColor(tag) {
  const tagColors = {
    Tecnologia: 'bg-purple-100 text-purple-700',
    Consultoria: 'bg-blue-100 text-blue-700',
    Finanças: 'bg-green-100 text-green-700',
    Marketing: 'bg-pink-100 text-pink-700',
    Produto: 'bg-indigo-100 text-indigo-700',
    Operações: 'bg-yellow-100 text-yellow-700',
    Pesquisa: 'bg-cyan-100 text-cyan-700',
  };
  return tagColors[tag] || 'bg-gray-100 text-gray-700';
}

export default function MentorDrawer({ mentor, isOpen, onClose }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Track LinkedIn clicks
  const handleLinkedInClick = () => {
    analytics.track(EVENTS.LINKEDIN_CLICKED, {
      mentor_id: mentor?.id,
      mentor_name: mentor?.name,
    });
  };

  // Track book session clicks and open modal
  const handleBookSessionClick = () => {
    analytics.track(EVENTS.BOOK_SESSION_CLICKED, {
      mentor_id: mentor?.id,
      mentor_name: mentor?.name,
    });
    setIsBookingModalOpen(true);
  };

  if (!mentor) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-2xl transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
            >
              <div className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                {/* Header */}
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-base font-semibold text-gray-900">
                      Perfil do Mentor
                    </DialogTitle>
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
                <div className="divide-y divide-gray-200">
                  {/* Profile header with photo */}
                  <div className="pb-6">
                    <div className="h-24 bg-patronos-gradient sm:h-20 lg:h-28" />
                    <div className="-mt-12 flow-root px-4 sm:-mt-8 sm:flex sm:items-end sm:px-6 lg:-mt-16">
                      <div>
                        <div className="-m-1 flex">
                          <div className="inline-flex overflow-hidden rounded-lg border-4 border-white">
                            {mentor.photoURL ? (
                              <img
                                alt={mentor.name}
                                src={mentor.photoURL}
                                className="h-24 w-24 shrink-0 bg-gray-100 object-cover sm:h-40 sm:w-40 lg:h-48 lg:w-48"
                              />
                            ) : (
                              <div className="h-24 w-24 shrink-0 bg-patronos-gradient flex items-center justify-center text-white text-3xl font-bold sm:h-40 sm:w-40 lg:h-48 lg:w-48 sm:text-5xl">
                                {mentor.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 sm:ml-6 sm:flex-1 sm:pt-12 lg:pt-16">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
                            {mentor.name}
                          </h3>
                          <p className="text-sm text-gray-600">{mentor.title}</p>
                          <p className="text-sm font-medium text-patronos-accent">
                            {mentor.company}
                          </p>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleBookSessionClick}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-patronos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-patronos-orange/90 focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:ring-offset-2"
                          >
                            Agendar Mentoria
                          </button>
                          {mentor.linkedin && (
                            <a
                              href={mentor.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={handleLinkedInClick}
                              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Ver LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details section */}
                  <div className="px-4 py-5 sm:px-0 sm:py-0">
                    <dl className="space-y-8 sm:space-y-0 sm:divide-y sm:divide-gray-200">
                      {/* Bio */}
                      {mentor.bio && (
                        <div className="sm:flex sm:px-6 sm:py-5">
                          <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0 lg:w-48">
                            Bio
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 sm:ml-6">
                            <p className="whitespace-pre-line">{mentor.bio}</p>
                          </dd>
                        </div>
                      )}

                      {/* Course */}
                      {mentor.course && (
                        <div className="sm:flex sm:px-6 sm:py-5">
                          <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0 lg:w-48">
                            Curso
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 sm:ml-6">
                            {mentor.course}
                          </dd>
                        </div>
                      )}

                      {/* Tags */}
                      {mentor.tags && mentor.tags.length > 0 && (
                        <div className="sm:flex sm:px-6 sm:py-5">
                          <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0 lg:w-48">
                            Áreas
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 sm:ml-6">
                            <div className="flex flex-wrap gap-2">
                              {mentor.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </dd>
                        </div>
                      )}

                      {/* Expertise */}
                      {mentor.expertise && mentor.expertise.length > 0 && (
                        <div className="sm:flex sm:px-6 sm:py-5">
                          <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:shrink-0 lg:w-48">
                            Pode ajudar com
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 sm:ml-6">
                            <ul className="list-disc list-inside space-y-1">
                              {mentor.expertise.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        mentor={mentor}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </Dialog>
  );
}
