from pyairtable import Api
from app.core.config import settings
from typing import List, Dict, Optional

# Inicializar Airtable
api = Api(settings.AIRTABLE_API_KEY)
base = api.base(settings.AIRTABLE_BASE_ID)

# Nomes das tabelas
class Tables:
    MENTORS = "Mentores"
    STUDENTS = "Estudantes"
    JOBS = "Vagas"
    BOOKINGS = "Agendamentos"

class AirtableService:
    """Serviço para integração com Airtable"""

    @staticmethod
    async def get_all_records(table_name: str, formula: Optional[str] = None) -> List[Dict]:
        """Busca todos os registros de uma tabela"""
        try:
            table = base.table(table_name)
            records = table.all(formula=formula) if formula else table.all()
            return [{"id": record["id"], **record["fields"]} for record in records]
        except Exception as e:
            print(f"Erro ao buscar registros de {table_name}: {e}")
            raise

    @staticmethod
    async def get_record(table_name: str, record_id: str) -> Dict:
        """Busca um registro específico"""
        try:
            table = base.table(table_name)
            record = table.get(record_id)
            return {"id": record["id"], **record["fields"]}
        except Exception as e:
            print(f"Erro ao buscar registro {record_id} de {table_name}: {e}")
            raise

    @staticmethod
    async def create_record(table_name: str, fields: Dict) -> Dict:
        """Cria um novo registro"""
        try:
            table = base.table(table_name)
            record = table.create(fields)
            return {"id": record["id"], **record["fields"]}
        except Exception as e:
            print(f"Erro ao criar registro em {table_name}: {e}")
            raise

    @staticmethod
    async def update_record(table_name: str, record_id: str, fields: Dict) -> Dict:
        """Atualiza um registro"""
        try:
            table = base.table(table_name)
            record = table.update(record_id, fields)
            return {"id": record["id"], **record["fields"]}
        except Exception as e:
            print(f"Erro ao atualizar registro {record_id} em {table_name}: {e}")
            raise

    @staticmethod
    async def delete_record(table_name: str, record_id: str) -> bool:
        """Deleta um registro"""
        try:
            table = base.table(table_name)
            table.delete(record_id)
            return True
        except Exception as e:
            print(f"Erro ao deletar registro {record_id} de {table_name}: {e}")
            raise

    @staticmethod
    async def find_by_email(table_name: str, email: str) -> Optional[Dict]:
        """Busca registro por email"""
        try:
            formula = f"{{Email}} = '{email}'"
            records = await AirtableService.get_all_records(table_name, formula)
            return records[0] if records else None
        except Exception as e:
            print(f"Erro ao buscar por email em {table_name}: {e}")
            return None
