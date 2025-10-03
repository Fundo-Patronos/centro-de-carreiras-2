import express from 'express'
import { body } from 'express-validator'

const router = express.Router()

// TODO: Implementar sistema de agendamento

// Criar novo agendamento
router.post('/',
  [
    body('mentorId').notEmpty().withMessage('ID do mentor é obrigatório'),
    body('data').isISO8601().withMessage('Data inválida'),
    body('horario').notEmpty().withMessage('Horário é obrigatório'),
    body('assunto').notEmpty().withMessage('Assunto é obrigatório')
  ],
  async (req, res) => {
    // TODO: Criar agendamento no Airtable e enviar emails de confirmação
    res.status(501).json({ message: 'Criação de agendamento em desenvolvimento' })
  }
)

// Listar agendamentos do usuário
router.get('/meus-agendamentos', async (req, res) => {
  // TODO: Buscar agendamentos do usuário logado
  res.status(501).json({ message: 'Listagem de agendamentos em desenvolvimento' })
})

// Cancelar agendamento
router.delete('/:id', async (req, res) => {
  // TODO: Cancelar agendamento e notificar mentor
  res.status(501).json({ message: 'Cancelamento de agendamento em desenvolvimento' })
})

// Confirmar agendamento (para mentores)
router.patch('/:id/confirmar', async (req, res) => {
  // TODO: Confirmar agendamento pelo mentor
  res.status(501).json({ message: 'Confirmação de agendamento em desenvolvimento' })
})

export default router
