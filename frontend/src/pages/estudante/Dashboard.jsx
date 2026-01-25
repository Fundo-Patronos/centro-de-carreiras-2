import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import analytics, { EVENTS } from '../../services/analytics';

export default function EstudanteDashboard() {
  const { userProfile } = useAuth();

  // Track page view on mount
  useEffect(() => {
    analytics.track(EVENTS.ESTUDANTE_DASHBOARD_VIEWED);
  }, []);

  // Track quick access clicks
  const handleQuickAccessClick = (destination) => {
    analytics.track(EVENTS.QUICK_ACCESS_CLICKED, {
      destination,
      user_role: 'estudante',
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
          Bem-vindo ao Centro de Carreiras da Unicamp. Encontre mentores e impulsione sua carreira.
        </p>
      </div>

      {/* Quick actions */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Acesso rápido</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Find Mentors */}
        <Link
          to="/estudante/mentores"
          onClick={() => handleQuickAccessClick('mentores')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 bg-patronos-accent/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-patronos-accent/20 transition-colors">
            <UserGroupIcon className="w-5 h-5 text-patronos-accent" />
          </div>
          <h4 className="font-semibold text-gray-900">Encontrar Mentores</h4>
          <p className="mt-1 text-sm text-gray-500">
            Conecte-se com profissionais experientes
          </p>
        </Link>

        {/* My Sessions */}
        <Link
          to="/estudante/sessoes"
          onClick={() => handleQuickAccessClick('sessoes')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
            <CalendarIcon className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Minhas Sessões</h4>
          <p className="mt-1 text-sm text-gray-500">
            Visualize suas mentorias agendadas
          </p>
        </Link>

        {/* Jobs */}
        <Link
          to="/estudante/vagas"
          onClick={() => handleQuickAccessClick('vagas')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <BriefcaseIcon className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Vagas</h4>
          <p className="mt-1 text-sm text-gray-500">
            Explore oportunidades de trabalho
          </p>
        </Link>

        {/* Profile */}
        <div
          onClick={() => handleQuickAccessClick('perfil')}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
            <AcademicCapIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Meu Perfil</h4>
          <p className="mt-1 text-sm text-gray-500">
            Atualize suas informações
          </p>
        </div>
      </div>

      {/* Stats or recent activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4">Próximas sessões</h4>
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Nenhuma sessão agendada</p>
            <Link
              to="/estudante/mentores"
              className="mt-3 inline-block text-sm text-patronos-accent hover:underline"
            >
              Agendar mentoria
            </Link>
          </div>
        </div>

        {/* Recommended mentors */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 mb-4">Mentores recomendados</h4>
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Complete seu perfil para receber recomendações</p>
          </div>
        </div>
      </div>
    </div>
  );
}
