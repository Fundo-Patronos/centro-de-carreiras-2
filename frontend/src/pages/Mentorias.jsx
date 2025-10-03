import { Link } from 'react-router-dom'

function Mentorias() {
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
              <Link to="/mentorias" className="text-patronos-primary font-semibold">
                Mentorias
              </Link>
              <Link to="/vagas" className="text-gray-700 hover:text-patronos-primary">
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
            Nossos Mentores
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Conecte-se com profissionais experientes de diversas áreas de atuação.
            Agende reuniões ilimitadas para discutir carreiras, processos seletivos
            e estratégias de networking.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-patronos-primary mb-2">
              🌍 Carreiras Globais
            </h3>
            <p className="text-gray-600">
              Mentores com experiência internacional em empresas multinacionais
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-patronos-primary mb-2">
              🎓 Pós-Graduação
            </h3>
            <p className="text-gray-600">
              Orientação para mestrado, doutorado e programas internacionais
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-patronos-primary mb-2">
              🚀 Empreendedorismo
            </h3>
            <p className="text-gray-600">
              Fundadores e executivos de startups e empresas de tecnologia
            </p>
          </div>
        </div>

        {/* Airtable Embed */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Explore Nossos Mentores
          </h2>
          <p className="text-gray-600 mb-6">
            Navegue pela lista de mentores disponíveis e suas áreas de expertise.
            Em breve você poderá agendar sessões diretamente pela plataforma.
          </p>

          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">
              {/* Airtable embed será inserido aqui */}
              📊 Visualização dos Mentores (Airtable Embed)
            </p>
            <iframe
              className="airtable-embed w-full rounded-lg"
              src="https://airtable.com/embed/app4uSEqO2S03EO5X/shr9ZDEboM5pT8Kpc?viewControls=on"
              frameBorder="0"
              width="100%"
              height="533"
              style={{ background: 'transparent', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 card bg-gradient-to-r from-blue-600 to-amber-500 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Crie sua conta gratuitamente e comece a agendar sessões com nossos mentores
          </p>
          <Link to="/cadastro" className="inline-block bg-white text-patronos-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition">
            Cadastre-se Agora
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Mentorias
