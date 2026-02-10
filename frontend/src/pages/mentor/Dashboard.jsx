import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';

export default function MentorDashboard() {
  const { userProfile } = useAuth();

  // Track page view on mount
  useEffect(() => {
    analytics.track(EVENTS.MENTOR_DASHBOARD_VIEWED);
  }, []);

  // Track quick access clicks
  const handleQuickAccessClick = (destination) => {
    analytics.track(EVENTS.QUICK_ACCESS_CLICKED, {
      destination,
      user_role: 'mentor',
    });
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Olá, {userProfile?.displayName?.split(' ')[0]}!
        </h2>
        <p className="mt-2 text-gray-600">
          Bem-vindo ao Centro de Carreiras. Aqui você pode gerenciar suas mentorias e ajudar estudantes.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Sessões agendadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0h</p>
              <p className="text-sm text-gray-500">Horas de mentoria</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-patronos-accent/10 rounded-lg flex items-center justify-center">
              <UserCircleIcon className="w-5 h-5 text-patronos-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Estudantes ajudados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Acesso rápido</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sessions */}
        <Link
          to="/mentor/sessoes"
          onClick={() => handleQuickAccessClick('sessoes')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
            <CalendarDaysIcon className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Minhas Sessões</h4>
          <p className="mt-1 text-sm text-gray-500">
            Veja solicitações e sessões agendadas
          </p>
        </Link>

        {/* Availability */}
        <Link
          to="/mentor/disponibilidade"
          onClick={() => handleQuickAccessClick('disponibilidade')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <ClockIcon className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Disponibilidade</h4>
          <p className="mt-1 text-sm text-gray-500">
            Configure seus horários disponíveis
          </p>
        </Link>

        {/* Profile */}
        <Link
          to="/mentor/perfil"
          onClick={() => handleQuickAccessClick('perfil')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 bg-patronos-accent/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-patronos-accent/20 transition-colors">
            <BriefcaseIcon className="w-5 h-5 text-patronos-accent" />
          </div>
          <h4 className="font-semibold text-gray-900">Meu Perfil</h4>
          <p className="mt-1 text-sm text-gray-500">
            Atualize suas informacoes e expertise
          </p>
        </Link>
      </div>

      {/* Recent activity sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4">Próximas sessões</h4>
          <div className="text-center py-8 text-gray-500">
            <CalendarDaysIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Nenhuma sessão agendada</p>
            <Link
              to="/mentor/disponibilidade"
              className="mt-3 inline-block text-sm text-patronos-accent hover:underline"
            >
              Configurar disponibilidade
            </Link>
          </div>
        </div>

        {/* Pending requests */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4">Solicitações pendentes</h4>
          <div className="text-center py-8 text-gray-500">
            <UserCircleIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Nenhuma solicitação pendente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
