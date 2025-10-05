import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import FilterBox from '../components/FilterBox'

export default function Perfil() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    titulo: '',
    companhia: '',
    curso: '',
    biografia: '',
    linkedin: '',
    foto_url: '',
    tags: [],
    area_expertise: []
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allMentors, setAllMentors] = useState([])

  // Mock user ID - in production, this would come from authentication
  const mockMentorId = 'rec2jHnmQrMRqYbZ0'

  // Extract all unique tags and expertise options from all mentors
  const allAvailableTags = useMemo(() => {
    const tagsSet = new Set()
    allMentors.forEach(mentor => {
      mentor.tags?.forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  }, [allMentors])

  const allAvailableExpertise = useMemo(() => {
    const expertiseSet = new Set()
    allMentors.forEach(mentor => {
      mentor.area_expertise?.forEach(item => expertiseSet.add(item))
    })
    return Array.from(expertiseSet).sort()
  }, [allMentors])

  useEffect(() => {
    fetchMentorProfile()
    fetchAllMentors()
  }, [])

  const fetchMentorProfile = async () => {
    try {
      // For now, fetch the first mentor as a mock current user
      const response = await axios.get(`http://localhost:8000/api/mentors/${mockMentorId}`)
      setFormData({
        nome: response.data.nome || '',
        email: response.data.email || '',
        titulo: response.data.titulo || '',
        companhia: response.data.companhia || '',
        curso: response.data.curso || '',
        biografia: response.data.biografia || '',
        linkedin: response.data.linkedin || '',
        foto_url: response.data.foto_url || '',
        tags: response.data.tags || [],
        area_expertise: response.data.area_expertise || []
      })
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllMentors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/mentors/')
      setAllMentors(response.data)
    } catch (error) {
      console.error('Erro ao buscar mentores:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await axios.put(`http://localhost:8000/api/mentors/${mockMentorId}`, formData)
      alert('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil. Por favor, tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <p className="text-gray-600">Carregando perfil...</p>
      </div>
    )
  }

  return (
    <div className="px-8 pt-12 pb-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl sm:tracking-tight">
          Meu Perfil
        </h1>
        <p className="mt-2 text-base text-gray-600 max-w-3xl">
          Mantenha suas informações atualizadas para que os estudantes possam conhecer melhor seu perfil.
        </p>
      </div>

      {/* Settings forms */}
      <div className="divide-y divide-gray-200">
        {/* Personal Information */}
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-16 md:grid-cols-3">
          <div>
            <h2 className="text-base/7 font-semibold text-gray-900">Informações Pessoais</h2>
            <p className="mt-1 text-sm/6 text-gray-500">
              Informações básicas que serão exibidas no seu perfil de mentor.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              {/* Avatar */}
              <div className="col-span-full flex items-center gap-x-8">
                <img
                  alt={formData.nome}
                  src={formData.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nome)}&size=256&background=random`}
                  className="size-24 flex-none rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5"
                />
                <div>
                  <button
                    type="button"
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-100"
                  >
                    Alterar foto
                  </button>
                  <p className="mt-2 text-xs/5 text-gray-500">JPG, GIF ou PNG. 1MB máx.</p>
                </div>
              </div>

              {/* Nome */}
              <div className="col-span-full">
                <label htmlFor="nome" className="block text-sm/6 font-medium text-gray-900">
                  Nome completo
                </label>
                <div className="mt-2">
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="col-span-full">
                <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                  Email
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* Título */}
              <div className="col-span-full">
                <label htmlFor="titulo" className="block text-sm/6 font-medium text-gray-900">
                  Título/Cargo
                </label>
                <div className="mt-2">
                  <input
                    id="titulo"
                    name="titulo"
                    type="text"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ex: VP de Operações"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* Companhia */}
              <div className="col-span-full">
                <label htmlFor="companhia" className="block text-sm/6 font-medium text-gray-900">
                  Empresa
                </label>
                <div className="mt-2">
                  <input
                    id="companhia"
                    name="companhia"
                    type="text"
                    value={formData.companhia}
                    onChange={handleInputChange}
                    placeholder="Ex: McKinsey & Company"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* Curso */}
              <div className="col-span-full">
                <label htmlFor="curso" className="block text-sm/6 font-medium text-gray-900">
                  Formação na Unicamp
                </label>
                <div className="mt-2">
                  <input
                    id="curso"
                    name="curso"
                    type="text"
                    value={formData.curso}
                    onChange={handleInputChange}
                    placeholder="Ex: Engenharia de Computação"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="col-span-full">
                <label htmlFor="linkedin" className="block text-sm/6 font-medium text-gray-900">
                  LinkedIn
                </label>
                <div className="mt-2">
                  <input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* Biografia */}
              <div className="col-span-full">
                <label htmlFor="biografia" className="block text-sm/6 font-medium text-gray-900">
                  Biografia
                </label>
                <div className="mt-2">
                  <textarea
                    id="biografia"
                    name="biografia"
                    rows={6}
                    value={formData.biografia}
                    onChange={handleInputChange}
                    placeholder="Conte um pouco sobre sua trajetória profissional..."
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
                  />
                </div>
              </div>

              {/* Tags - Editable with FilterBox */}
              <div className="col-span-full">
                <FilterBox
                  title="Áreas de Atuação"
                  options={allAvailableTags}
                  selectedItems={formData.tags}
                  onSelectionChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
                />
              </div>

              {/* Pode Ajudar Com - Editable with FilterBox */}
              <div className="col-span-full">
                <FilterBox
                  title="Pode Ajudar Com"
                  options={allAvailableExpertise}
                  selectedItems={formData.area_expertise}
                  onSelectionChange={(newExpertise) => setFormData(prev => ({ ...prev, area_expertise: newExpertise }))}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-x-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-patronos-accent px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-patronos-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button
                type="button"
                onClick={fetchMentorProfile}
                disabled={saving}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
