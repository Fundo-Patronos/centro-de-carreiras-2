import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-patronos-primary">
              Centro de Carreiras
            </h1>
            <div className="space-x-4">
              <Link to="/entrar" className="text-gray-700 hover:text-patronos-primary">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn-primary">
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Centro de Carreiras da Unicamp
          </h2>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            O Fundo Patronos deu um passo decisivo na missão de apoiar a trajetória
            profissional dos estudantes da Unicamp com o lançamento do Centro de Carreiras,
            estruturado como uma plataforma digital.
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Conecte-se com mentores experientes, agende reuniões ilimitadas e
            descubra oportunidades de carreira em todas as áreas e indústrias.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/mentorias" className="btn-primary text-lg px-8 py-3">
              Ver Mentores
            </Link>
            <Link to="/vagas" className="btn-secondary text-lg px-8 py-3">
              Vagas Abertas
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Mentoria Profissional</h3>
            <p className="text-gray-600">
              Acesse mentores de diversas áreas, incluindo carreiras globais,
              pós-graduação e empreendedorismo
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Reuniões Ilimitadas</h3>
            <p className="text-gray-600">
              Agende quantas sessões precisar com seus mentores escolhidos
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2">Oportunidades</h3>
            <p className="text-gray-600">
              Acesse vagas e oportunidades compartilhadas por empresas parceiras
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 Fundo Patronos - Unicamp. Plataforma disponível 24/7/365.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
