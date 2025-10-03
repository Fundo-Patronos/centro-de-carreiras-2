import { Link } from 'react-router-dom'

function Vagas() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-patronos-primary">
              Centro de Carreiras
            </Link>
            <div className="space-x-6">
              <Link to="/" className="text-gray-700 hover:text-patronos-primary">
                Início
              </Link>
              <Link to="/mentorias" className="text-gray-700 hover:text-patronos-primary">
                Mentorias
              </Link>
              <Link to="/vagas" className="text-patronos-primary font-semibold">
                Vagas
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Oportunidades de Carreira
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Explore vagas abertas compartilhadas por empresas parceiras do Centro de Carreiras.
            Encontre oportunidades de estágio, trainee e emprego em diversas áreas.
          </p>
        </div>

        {/* Filter Section */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Filtrar Oportunidades
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Vaga
              </label>
              <select className="input-field">
                <option>Todas</option>
                <option>Estágio</option>
                <option>Trainee</option>
                <option>Júnior</option>
                <option>Pleno</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <select className="input-field">
                <option>Todas</option>
                <option>Tecnologia</option>
                <option>Engenharia</option>
                <option>Finanças</option>
                <option>Consultoria</option>
                <option>Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <select className="input-field">
                <option>Todas</option>
                <option>São Paulo</option>
                <option>Campinas</option>
                <option>Rio de Janeiro</option>
                <option>Remoto</option>
                <option>Híbrido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-patronos-primary mb-2">150+</div>
            <p className="text-gray-600">Vagas Abertas</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-patronos-secondary mb-2">50+</div>
            <p className="text-gray-600">Empresas Parceiras</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-patronos-accent mb-2">20+</div>
            <p className="text-gray-600">Áreas de Atuação</p>
          </div>
        </div>

        {/* Airtable Embed */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vagas Disponíveis
          </h2>
          <p className="text-gray-600 mb-6">
            Navegue pelas oportunidades atualizadas diariamente. Clique em uma vaga
            para ver mais detalhes e instruções de candidatura.
          </p>

          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">
              {/* Airtable embed das vagas será inserido aqui */}
              💼 Lista de Vagas Abertas (Airtable Embed)
            </p>
            <div className="w-full h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <p className="text-gray-600 font-semibold mb-2">
                  Embed do Airtable será configurado aqui
                </p>
                <p className="text-sm text-gray-500">
                  Adicione a URL do embed do Airtable para visualizar as vagas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 card bg-gradient-to-r from-amber-500 to-blue-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Quer Divulgar uma Vaga?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Empresas parceiras podem divulgar oportunidades para estudantes da Unicamp
          </p>
          <a href="mailto:carreiras@fundopatronos.org.br" className="inline-block bg-white text-patronos-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition">
            Entre em Contato
          </a>
        </div>
      </div>
    </div>
  )
}

export default Vagas
