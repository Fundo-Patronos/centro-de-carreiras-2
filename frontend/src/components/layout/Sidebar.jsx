import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import analytics, { EVENTS } from '../../services/analytics';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Navigation items based on role
  const isEstudante = userProfile?.role === 'estudante';
  const isMentor = userProfile?.role === 'mentor';
  const isAdmin = userProfile?.isAdmin === true;

  const navigation = isEstudante
    ? [
        { name: 'Início', href: '/estudante/dashboard', icon: HomeIcon },
        { name: 'Mentores', href: '/estudante/mentores', icon: UserGroupIcon },
        { name: 'Minhas Sessões', href: '/estudante/sessoes', icon: CalendarDaysIcon },
        { name: 'Vagas', href: '/estudante/vagas', icon: BriefcaseIcon },
      ]
    : [
        { name: 'Início', href: '/mentor/dashboard', icon: HomeIcon },
        { name: 'Minhas Sessões', href: '/mentor/sessoes', icon: CalendarDaysIcon },
        { name: 'Disponibilidade', href: '/mentor/disponibilidade', icon: Cog6ToothIcon },
      ];

  const handleLogout = async () => {
    analytics.track(EVENTS.LOGOUT);
    await authService.logout();
    navigate('/auth');
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 h-full">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <span className="text-xl font-bold text-white">
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
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-patronos-accent text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors'
                      )
                    }
                  >
                    <item.icon aria-hidden="true" className="h-6 w-6 shrink-0" />
                    {item.name}
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
                  isEstudante ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300',
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
                <li>
                  <NavLink
                    to="/admin/approvals"
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-patronos-accent text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors'
                      )
                    }
                  >
                    <ShieldCheckIcon aria-hidden="true" className="h-6 w-6 shrink-0" />
                    Aprovacoes
                  </NavLink>
                </li>
              </ul>
            </li>
          )}

          {/* User profile at bottom */}
          <li className="-mx-6 mt-auto">
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/10">
              <div className="flex items-center gap-x-3 min-w-0">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full bg-gray-800"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-patronos-accent flex items-center justify-center text-white text-sm font-medium">
                    {userProfile?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile?.displayName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                title="Sair"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
