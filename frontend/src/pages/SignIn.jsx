import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    // TODO: Implementar lógica de autenticação
    console.log('Login:', { email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-patronos-primary">
            Centro de Carreiras
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Entrar na Plataforma
          </h2>
          <p className="mt-2 text-gray-600">
            Conecte-se com mentores e oportunidades
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-patronos-primary focus:ring-patronos-primary border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Lembrar de mim
              </label>
            </div>

            <a href="#" className="text-sm text-patronos-primary hover:text-blue-700">
              Esqueceu a senha?
            </a>
          </div>

          <button type="submit" className="w-full btn-primary">
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="text-patronos-primary font-semibold hover:text-blue-700">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignIn
