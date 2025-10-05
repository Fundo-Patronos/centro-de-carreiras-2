import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MentorModal from '../components/MentorModal'
import FilterBox from '../components/FilterBox'

export default function Mentorias() {
  const navigate = useNavigate()
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter states
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedPodeAjudarCom, setSelectedPodeAjudarCom] = useState([])

  // Utility function to convert text to proper title case
  const toTitleCase = (text) => {
    if (!text) return ''

    // Words that should remain lowercase in title case (unless they're the first word)
    const smallWords = ['e', 'de', 'da', 'do', 'dos', 'das', 'em', 'a', 'o', 'as', 'os', 'para', 'com', 'sem']

    return text
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Always capitalize the first word
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1)
        }
        // Keep small words lowercase unless they're at the start
        if (smallWords.includes(word)) {
          return word
        }
        // Capitalize other words
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
  }

  const handleOpenModal = (mentor) => {
    setSelectedMentor(mentor)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleAgendarMentoria = () => {
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

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/mentors/')
      setMentors(response.data)
    } catch (error) {
      console.error('Erro ao buscar mentores:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique tags and "Pode Ajudar Com" options from all mentors
  const allTags = useMemo(() => {
    const tagsSet = new Set()
    mentors.forEach(mentor => {
      mentor.tags?.forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  }, [mentors])

  const allPodeAjudarCom = useMemo(() => {
    const podeAjudarComSet = new Set()
    mentors.forEach(mentor => {
      mentor.area_expertise?.forEach(item => podeAjudarComSet.add(item))
    })
    return Array.from(podeAjudarComSet).sort()
  }, [mentors])

  // Initialize filter selections when data loads
  useEffect(() => {
    if (allTags.length > 0 && selectedTags.length === 0) {
      setSelectedTags([...allTags])
    }
  }, [allTags])

  useEffect(() => {
    if (allPodeAjudarCom.length > 0 && selectedPodeAjudarCom.length === 0) {
      setSelectedPodeAjudarCom([...allPodeAjudarCom])
    }
  }, [allPodeAjudarCom])

  // Filter mentors based on selections
  const filteredMentors = useMemo(() => {
    // If no filters are selected, show no mentors
    if (selectedTags.length === 0 || selectedPodeAjudarCom.length === 0) {
      return []
    }

    return mentors.filter(mentor => {
      // Check if mentor has at least one selected tag
      // If mentor has no tags, include them when all tags are selected
      const mentorTags = mentor.tags || []
      const hasMatchingTag = mentorTags.length === 0
        ? selectedTags.length === allTags.length
        : mentorTags.some(tag => selectedTags.includes(tag))

      // Check if mentor has at least one selected "Pode Ajudar Com"
      // If mentor has no area_expertise, include them when all items are selected
      const mentorAreaExpertise = mentor.area_expertise || []
      const hasMatchingPodeAjudarCom = mentorAreaExpertise.length === 0
        ? selectedPodeAjudarCom.length === allPodeAjudarCom.length
        : mentorAreaExpertise.some(item => selectedPodeAjudarCom.includes(item))

      return hasMatchingTag && hasMatchingPodeAjudarCom
    })
  }, [mentors, selectedTags, selectedPodeAjudarCom, allTags.length, allPodeAjudarCom.length])

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-gray-600">Carregando mentores...</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-8 pt-12 pb-8 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl sm:tracking-tight">
            Encontre seu Mentor
          </h1>
          <p className="mt-2 text-base text-gray-600 max-w-3xl">
            Conecte-se com profissionais experientes que podem ajudá-lo em sua jornada acadêmica e profissional.
            Escolha um mentor com base em sua área de interesse e agende uma conversa.
          </p>
        </div>

        {/* Filter boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <FilterBox
            title="Tags"
            options={allTags}
            selectedItems={selectedTags}
            onSelectionChange={setSelectedTags}
          />
          <FilterBox
            title="Pode Ajudar Com"
            options={allPodeAjudarCom}
            selectedItems={selectedPodeAjudarCom}
            onSelectionChange={setSelectedPodeAjudarCom}
          />
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredMentors.length}</span> de <span className="font-semibold">{mentors.length}</span> mentores
          </p>
        </div>

        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredMentors.map((mentor) => {
            // Calculate visible tags to fit in 2 rows (approximately 6-7 tags)
            const maxVisibleTags = 6
            const visibleTags = mentor.tags?.slice(0, maxVisibleTags) || []
            const remainingTags = (mentor.tags?.length || 0) - maxVisibleTags

            return (
              <li
                key={mentor.id}
                className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-sm"
              >
                <div className="flex flex-1 flex-col p-6">
                  <img
                    alt={mentor.nome}
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.nome)}&size=256&background=random`}
                    className="mx-auto size-20 shrink-0 rounded-full bg-gray-300 outline -outline-offset-1 outline-black/5"
                  />
                  <h3 className="mt-4 text-sm font-semibold text-gray-900">{toTitleCase(mentor.nome)}</h3>
                  <p className="text-xs text-gray-600 mt-1">{toTitleCase(mentor.titulo || 'Mentor')}</p>
                  {mentor.companhia && (
                    <p className="text-xs text-gray-500 mt-0.5">{toTitleCase(mentor.companhia)}</p>
                  )}

                  {/* Tags section with fixed height */}
                  <div className="mt-4 h-14 mb-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {visibleTags.map((tag, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium inset-ring ${getTagColor(tag, index)}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {remainingTags > 0 && (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/10">
                          +{remainingTags}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="-mt-px flex divide-x divide-gray-200">
                    <div className="flex w-0 flex-1">
                      <button
                        onClick={() => handleOpenModal(mentor)}
                        className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Saiba Mais
                      </button>
                    </div>
                    <div className="-ml-px flex w-0 flex-1">
                      <button
                        onClick={handleAgendarMentoria}
                        className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-patronos-accent hover:bg-gray-50"
                      >
                        Agendar Mentoria
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <MentorModal
        mentor={selectedMentor}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}
