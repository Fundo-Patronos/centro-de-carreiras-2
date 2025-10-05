"""
Script de teste para verificar conexão com Airtable
"""
import asyncio
from app.services.airtable import AirtableService, Tables

async def test_connection():
    print("🔍 Testando conexão com Airtable...")
    print(f"📋 Tabela: {Tables.MENTORS}")
    print()

    try:
        mentors = await AirtableService.get_all_records(Tables.MENTORS)
        print(f"✅ Conexão estabelecida com sucesso!")
        print(f"📊 Total de mentores encontrados: {len(mentors)}")
        print()

        if mentors:
            print("🎯 Primeiros 2 registros:")
            for i, mentor in enumerate(mentors[:2], 1):
                print(f"\n--- Mentor {i} ---")
                for key, value in mentor.items():
                    if key != 'id':
                        print(f"{key}: {value}")
        else:
            print("⚠️  Nenhum mentor encontrado na tabela")

    except Exception as e:
        print(f"❌ Erro ao conectar com Airtable:")
        print(f"   Tipo: {type(e).__name__}")
        print(f"   Mensagem: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_connection())
