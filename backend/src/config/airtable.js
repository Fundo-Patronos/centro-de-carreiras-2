import Airtable from 'airtable'
import dotenv from 'dotenv'

dotenv.config()

// Configurar Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
)

// Nomes das tabelas (ajustar conforme seu Airtable)
export const TABLES = {
  MENTORS: 'Mentores',
  STUDENTS: 'Estudantes',
  JOBS: 'Vagas',
  BOOKINGS: 'Agendamentos'
}

// Função helper para buscar registros
export const getRecords = async (tableName, options = {}) => {
  try {
    const records = await base(tableName).select(options).all()
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }))
  } catch (error) {
    console.error(`Erro ao buscar registros de ${tableName}:`, error)
    throw error
  }
}

// Função helper para criar registro
export const createRecord = async (tableName, fields) => {
  try {
    const record = await base(tableName).create(fields)
    return {
      id: record.id,
      ...record.fields
    }
  } catch (error) {
    console.error(`Erro ao criar registro em ${tableName}:`, error)
    throw error
  }
}

// Função helper para atualizar registro
export const updateRecord = async (tableName, recordId, fields) => {
  try {
    const record = await base(tableName).update(recordId, fields)
    return {
      id: record.id,
      ...record.fields
    }
  } catch (error) {
    console.error(`Erro ao atualizar registro em ${tableName}:`, error)
    throw error
  }
}

// Função helper para deletar registro
export const deleteRecord = async (tableName, recordId) => {
  try {
    await base(tableName).destroy(recordId)
    return { success: true }
  } catch (error) {
    console.error(`Erro ao deletar registro de ${tableName}:`, error)
    throw error
  }
}

export default base
