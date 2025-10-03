import express from 'express'

const router = express.Router()

// TODO: Implementar integração com Airtable

// Listar todas as vagas
router.get('/', async (req, res) => {
  // TODO: Buscar vagas do Airtable
  res.status(501).json({ message: 'Listagem de vagas em desenvolvimento' })
})

// Buscar vaga por ID
router.get('/:id', async (req, res) => {
  // TODO: Buscar vaga específica do Airtable
  res.status(501).json({ message: 'Busca de vaga em desenvolvimento' })
})

// Filtrar vagas (tipo, área, localização)
router.get('/filtrar', async (req, res) => {
  // TODO: Filtrar vagas com base em query params
  res.status(501).json({ message: 'Filtro de vagas em desenvolvimento' })
})

export default router
