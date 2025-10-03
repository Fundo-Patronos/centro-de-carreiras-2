import express from 'express'
import { body } from 'express-validator'

const router = express.Router()

// TODO: Implementar controllers de autenticação

// Registro
router.post('/registro',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('curso').notEmpty().withMessage('Curso é obrigatório')
  ],
  async (req, res) => {
    // TODO: Implementar lógica de registro
    res.status(501).json({ message: 'Registro em desenvolvimento' })
  }
)

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
  ],
  async (req, res) => {
    // TODO: Implementar lógica de login
    res.status(501).json({ message: 'Login em desenvolvimento' })
  }
)

// Verificar token
router.get('/me', async (req, res) => {
  // TODO: Implementar verificação de token
  res.status(501).json({ message: 'Verificação de token em desenvolvimento' })
})

// Esqueci minha senha
router.post('/esqueci-senha',
  [
    body('email').isEmail().withMessage('Email inválido')
  ],
  async (req, res) => {
    // TODO: Implementar lógica de recuperação de senha
    res.status(501).json({ message: 'Recuperação de senha em desenvolvimento' })
  }
)

export default router
