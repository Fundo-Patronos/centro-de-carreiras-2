import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { mentorService } from '../../services/mentorService';
import MentorDrawer from '../../components/mentor/MentorDrawer';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Tag color mapping
const tagColors = {
  Tecnologia: 'bg-purple-100 text-purple-700',
  Consultoria: 'bg-blue-100 text-blue-700',
  Finanças: 'bg-green-100 text-green-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Produto: 'bg-indigo-100 text-indigo-700',
  Operações: 'bg-yellow-100 text-yellow-700',
  Pesquisa: 'bg-cyan-100 text-cyan-700',
  default: 'bg-gray-100 text-gray-700',
};

function getTagColor(tag) {
  return tagColors[tag] || tagColors.default;
}

function MentorCard({ mentor, onClick }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(mentor)}
    >
      {/* Header with photo and info */}
      <div className="flex items-start gap-4">
        {mentor.photoURL ? (
          <img
            src={mentor.photoURL}
            alt={mentor.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-patronos-orange to-patronos-purple flex items-center justify-center text-white text-lg font-semibold">
            {mentor.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
          <p className="text-sm text-gray-600">{mentor.title}</p>
          <p className="text-sm text-patronos-accent font-medium">{mentor.company}</p>
        </div>
      </div>

      {/* Tags - fixed height for 2 lines to align buttons */}
      <div className="mt-4 h-[52px] flex flex-wrap gap-1.5 content-start">
        {mentor.tags?.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
          >
            {tag}
          </span>
        ))}
        {mentor.tags && mentor.tags.length > 4 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            +{mentor.tags.length - 4}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 py-2 px-4 bg-patronos-accent text-white text-sm font-medium rounded-lg hover:bg-patronos-accent/90 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick(mentor);
          }}
        >
          Ver Bio
        </button>
        {mentor.linkedin ? (
          <a
            href={mentor.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-4 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-center"
            onClick={(e) => e.stopPropagation()}
          >
            LinkedIn
          </a>
        ) : (
          <span className="flex-1 py-2 px-4 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg border border-gray-200 text-center cursor-not-allowed">
            LinkedIn
          </span>
        )}
      </div>
    </div>
  );
}

export default function MentorList() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch mentors on mount
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const data = await mentorService.getMentors();
        setMentors(data.mentors || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setError('Não foi possível carregar os mentores. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // Filter mentors based on search
  const filteredMentors = mentors.filter((mentor) => {
    const query = searchQuery.toLowerCase();
    return (
      mentor.name?.toLowerCase().includes(query) ||
      mentor.company?.toLowerCase().includes(query) ||
      mentor.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
      mentor.expertise?.some((exp) => exp.toLowerCase().includes(query))
    );
  });

  const handleMentorClick = (mentor) => {
    setSelectedMentor(mentor);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // Delay clearing mentor to allow animation
    setTimeout(() => setSelectedMentor(null), 300);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <UserCircleIcon className="mx-auto h-12 w-12 text-red-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Erro ao carregar mentores
          </h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-patronos-accent text-white rounded-lg hover:bg-patronos-accent/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Encontre seu Mentor</h1>
        <p className="mt-1 text-gray-600">
          Conecte-se com profissionais experientes para impulsionar sua carreira
        </p>
        <p className="mt-3 text-sm text-patronos-accent font-medium">
          Clique no perfil de um mentor para agendar uma mentoria
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, empresa ou área..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-patronos-accent focus:border-transparent"
          />
        </div>

        {/* Filter button */}
        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        Mostrando {filteredMentors.length} de {mentors.length} mentores
      </p>

      {/* Mentor grid */}
      {filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onClick={handleMentorClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhum mentor encontrado
          </h3>
          <p className="mt-1 text-gray-500">
            Tente ajustar sua busca ou filtros
          </p>
        </div>
      )}

      {/* Mentor drawer */}
      <MentorDrawer
        mentor={selectedMentor}
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
