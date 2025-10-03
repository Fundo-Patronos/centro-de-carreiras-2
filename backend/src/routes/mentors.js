import express from 'express'

const router = express.Router()

// TODO: Implementar integração com Airtable

// Listar todos os mentores
router.get('/', async (req, res) => {
  // TODO: Buscar mentores do Airtable
  res.status(501).json({ message: 'Listagem de mentores em desenvolvimento' })
})

// Buscar mentor por ID
router.get('/:id', async (req, res) => {
  // TODO: Buscar mentor específico do Airtable
  res.status(501).json({ message: 'Busca de mentor em desenvolvimento' })
})

// Filtrar mentores por área/expertise
router.get('/filtrar', async (req, res) => {
  // TODO: Filtrar mentores com base em query params
  res.status(501).json({ message: 'Filtro de mentores em desenvolvimento' })
})

export default router
