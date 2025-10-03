import jwt from 'jsonwebtoken'

// Middleware para verificar JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido ou expirado'
      })
    }

    req.user = user
    next()
  })
}

// Middleware para verificar se usuário é mentor
export const isMentor = (req, res, next) => {
  if (req.user && req.user.role === 'mentor') {
    next()
  } else {
    res.status(403).json({
      error: 'Acesso negado. Apenas mentores podem acessar este recurso.'
    })
  }
}

// Middleware para verificar se usuário é estudante
export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next()
  } else {
    res.status(403).json({
      error: 'Acesso negado. Apenas estudantes podem acessar este recurso.'
    })
  }
}

export default { authenticateToken, isMentor, isStudent }
