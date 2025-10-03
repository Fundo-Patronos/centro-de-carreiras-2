import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function SignUp() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    curso: '',
    anoGraduacao: '',
    password: '',
    confirmPassword: ''
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }
    // TODO: Implementar lógica de cadastro
    console.log('Cadastro:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-12 px-4">
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-patronos-primary">
            Centro de Carreiras
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Criar Conta
          </h2>
          <p className="mt-2 text-gray-600">
            Junte-se ao Centro de Carreiras da Unicamp
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className="input-field"
                placeholder="Seu nome completo"
                value={formData.nome}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Institucional
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="seu.email@dac.unicamp.br"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                required
                className="input-field"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="curso" className="block text-sm font-medium text-gray-700 mb-2">
                Curso
              </label>
              <input
                id="curso"
                name="curso"
                type="text"
                required
                className="input-field"
                placeholder="Ex: Engenharia de Computação"
                value={formData.curso}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="anoGraduacao" className="block text-sm font-medium text-gray-700 mb-2">
              Ano de Graduação (Previsto)
            </label>
            <input
              id="anoGraduacao"
              name="anoGraduacao"
              type="number"
              required
              className="input-field"
              placeholder="2026"
              min="2025"
              max="2035"
              value={formData.anoGraduacao}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 mt-1 text-patronos-primary focus:ring-patronos-primary border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              Concordo com os termos de uso e política de privacidade do Centro de Carreiras
            </label>
          </div>

          <button type="submit" className="w-full btn-primary">
            Criar Conta
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Já tem uma conta?{' '}
          <Link to="/entrar" className="text-patronos-primary font-semibold hover:text-blue-700">
            Entre aqui
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp
