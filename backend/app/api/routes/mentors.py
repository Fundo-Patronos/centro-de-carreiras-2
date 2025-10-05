from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.mentor import MentorResponse
from app.services.airtable import AirtableService, Tables

router = APIRouter()

@router.get("/test")
async def test_airtable_connection():
    """Endpoint de teste para verificar conexão com Airtable"""
    try:
        mentors = await AirtableService.get_all_records(Tables.MENTORS)
        return {
            "status": "success",
            "message": "Conexão com Airtable estabelecida!",
            "total_mentores": len(mentors),
            "sample_data": mentors[:2] if mentors else []  # Retorna os 2 primeiros registros
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro ao conectar com Airtable: {str(e)}",
            "error_type": type(e).__name__
        }

@router.get("/", response_model=List[MentorResponse])
async def listar_mentores(
    area: Optional[str] = Query(None, description="Filtrar por área"),
    expertise: Optional[str] = Query(None, description="Filtrar por expertise")
):
    """Lista todos os mentores com filtros opcionais"""
    formula = None

    if area and expertise:
        formula = f"AND(FIND('{area}', {{Área de Expertise}}), FIND('{expertise}', {{Área de Expertise}}))"
    elif area:
        formula = f"FIND('{area}', {{Área de Expertise}})"
    elif expertise:
        formula = f"FIND('{expertise}', {{Área de Expertise}})"

    mentors = await AirtableService.get_all_records(Tables.MENTORS, formula)

    return [
        MentorResponse(
            id=mentor["id"],
            nome=mentor.get("Name", ""),
            email=mentor.get("Email", ""),
            area_expertise=mentor.get("Pode ajudar com", []),
            biografia=mentor.get("Bio", ""),
            linkedin=mentor.get("Linkedin URL"),
            foto_url=mentor.get("Foto", [{}])[0].get("url") if mentor.get("Foto") else None,
            companhia=mentor.get("Companhia"),
            titulo=mentor.get("Título"),
            curso=mentor.get("Curso"),
            tags=mentor.get("Tags", [])
        )
        for mentor in mentors
    ]

@router.get("/{mentor_id}", response_model=MentorResponse)
async def buscar_mentor(mentor_id: str):
    """Busca mentor por ID"""
    try:
        mentor = await AirtableService.get_record(Tables.MENTORS, mentor_id)

        return MentorResponse(
            id=mentor["id"],
            nome=mentor.get("Name", ""),
            email=mentor.get("Email", ""),
            area_expertise=mentor.get("Pode ajudar com", []),
            biografia=mentor.get("Bio", ""),
            linkedin=mentor.get("Linkedin URL"),
            foto_url=mentor.get("Foto", [{}])[0].get("url") if mentor.get("Foto") else None,
            companhia=mentor.get("Companhia"),
            titulo=mentor.get("Título"),
            curso=mentor.get("Curso"),
            tags=mentor.get("Tags", [])
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Mentor não encontrado"
        )
