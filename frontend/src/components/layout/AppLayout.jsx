import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import analytics, { EVENTS } from '../../services/analytics';
import BetaBanner from './BetaBanner';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Navigation items based on role
  const isEstudante = userProfile?.role === 'estudante';
  const isAdmin = userProfile?.isAdmin === true;

  const navigation = isEstudante
    ? [
        { name: 'Inicio', href: '/estudante/dashboard', icon: HomeIcon },
        { name: 'Mentores', href: '/estudante/mentores', icon: UserGroupIcon },
        { name: 'Minhas Sessoes', href: '/estudante/sessoes', icon: CalendarDaysIcon },
        { name: 'Vagas', href: '/estudante/vagas', icon: BriefcaseIcon },
      ]
    : [
        { name: 'Inicio', href: '/mentor/dashboard', icon: HomeIcon },
        { name: 'Minhas Sessoes', href: '/mentor/sessoes', icon: CalendarDaysIcon },
        { name: 'Disponibilidade', href: '/mentor/disponibilidade', icon: Cog6ToothIcon },
        { name: 'Meu Perfil', href: '/mentor/perfil', icon: UserCircleIcon },
      ];

  const adminNavigation = [
    { name: 'Aprovacoes', href: '/admin/approvals', icon: ShieldCheckIcon },
    { name: 'Mentores', href: '/admin/mentors', icon: UserGroupIcon },
    { name: 'Feedback', href: '/admin/feedback', icon: ChatBubbleLeftRightIcon },
  ];

  const handleLogout = async () => {
    analytics.track(EVENTS.LOGOUT, {
      user_role: userProfile?.role,
    });
    await authService.logout();
    navigate('/auth');
  };

  const handleNavClick = (itemName, itemHref) => {
    analytics.track(EVENTS.NAVIGATION_CLICKED, {
      destination: itemName,
      destination_path: itemHref,
      user_role: userProfile?.role,
    });
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-x-3">
        <img
          alt="Patronos"
          src="/patronos-logo.svg"
          className="h-8 w-auto"
        />
        <span className="text-lg font-semibold text-gray-900">
          Centro de Carreiras
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Main navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => handleNavClick(item.name, item.href)}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-gray-50 text-patronos-accent'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-patronos-accent',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            isActive ? 'text-patronos-accent' : 'text-gray-400 group-hover:text-patronos-accent',
                            'h-6 w-6 shrink-0'
                          )}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          {/* Role badge */}
          <li>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Sua conta
            </div>
            <div className="mt-2 px-2 py-1.5">
              <span
                className={classNames(
                  isEstudante ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700',
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
                )}
              >
                {isEstudante ? 'Estudante' : 'Mentor'}
              </span>
            </div>
          </li>

          {/* Admin section */}
          {isAdmin && (
            <li>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administracao
              </div>
              <ul role="list" className="mt-2 -mx-2 space-y-1">
                {adminNavigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={() => handleNavClick(item.name, item.href)}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'bg-gray-50 text-patronos-accent'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-patronos-accent',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              isActive ? 'text-patronos-accent' : 'text-gray-400 group-hover:text-patronos-accent',
                              'h-6 w-6 shrink-0'
                            )}
                          />
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          )}

          {/* Logout at bottom */}
          <li className="mt-auto">
            <button
              onClick={handleLogout}
              className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-patronos-accent transition-colors"
            >
              <ArrowRightOnRectangleIcon
                aria-hidden="true"
                className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-patronos-accent"
              />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div>
      {/* Mobile sidebar */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Fechar menu</span>
                  <XMarkIcon aria-hidden="true" className="h-6 w-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            <SidebarContent />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-x-3">
            <img
              alt="Patronos"
              src="/patronos-logo.svg"
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold text-gray-900">
              Centro de Carreiras
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              {/* Main navigation */}
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        onClick={() => handleNavClick(item.name, item.href)}
                        className={({ isActive }) =>
                          classNames(
                            isActive
                              ? 'bg-gray-50 text-patronos-accent'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-patronos-accent',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                isActive ? 'text-patronos-accent' : 'text-gray-400 group-hover:text-patronos-accent',
                                'h-6 w-6 shrink-0'
                              )}
                            />
                            {item.name}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Role badge */}
              <li>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Sua conta
                </div>
                <div className="mt-2 px-2 py-1.5">
                  <span
                    className={classNames(
                      isEstudante ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700',
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
                    )}
                  >
                    {isEstudante ? 'Estudante' : 'Mentor'}
                  </span>
                </div>
              </li>

              {/* Admin section */}
              {isAdmin && (
                <li>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administracao
                  </div>
                  <ul role="list" className="mt-2 -mx-2 space-y-1">
                    {adminNavigation.map((item) => (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          onClick={() => handleNavClick(item.name, item.href)}
                          className={({ isActive }) =>
                            classNames(
                              isActive
                                ? 'bg-gray-50 text-patronos-accent'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-patronos-accent',
                              'group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  isActive ? 'text-patronos-accent' : 'text-gray-400 group-hover:text-patronos-accent',
                                  'h-6 w-6 shrink-0'
                                )}
                              />
                              {item.name}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              {/* Logout at bottom */}
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-patronos-accent transition-colors"
                >
                  <ArrowRightOnRectangleIcon
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-patronos-accent"
                  />
                  Sair
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden"
          >
            <span className="sr-only">Abrir menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div aria-hidden="true" className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="relative flex items-center -m-1.5 p-1.5">
                  <span className="sr-only">Abrir menu do usuario</span>
                  {userProfile?.photoURL ? (
                    <img
                      alt=""
                      src={userProfile.photoURL}
                      className="h-8 w-8 rounded-full bg-gray-50"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-patronos-accent flex items-center justify-center text-white text-sm font-medium">
                      {userProfile?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="hidden lg:flex lg:items-center">
                    <span aria-hidden="true" className="ml-4 text-sm font-semibold text-gray-900">
                      {userProfile?.displayName}
                    </span>
                    <ChevronDownIcon aria-hidden="true" className="ml-2 h-5 w-5 text-gray-400" />
                  </span>
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userProfile?.email}
                    </p>
                  </div>
                  <MenuItem>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-x-2 px-3 py-2 text-sm text-gray-700 data-[focus]:bg-gray-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                      Sair
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>

        {/* Beta banner */}
        <BetaBanner />

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
