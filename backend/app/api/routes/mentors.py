from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.mentor import MentorResponse, MentorUpdate
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

@router.put("/{mentor_id}", response_model=MentorResponse)
async def atualizar_mentor(mentor_id: str, mentor_update: MentorUpdate):
    """Atualiza informações de um mentor"""
    try:
        # Preparar campos para atualização no Airtable
        # Mapeando os campos da aplicação para os nomes dos campos do Airtable
        fields = {}

        if mentor_update.nome is not None:
            fields["Name"] = mentor_update.nome
        if mentor_update.email is not None:
            fields["Email"] = mentor_update.email
        if mentor_update.titulo is not None:
            fields["Título"] = mentor_update.titulo
        if mentor_update.companhia is not None:
            fields["Companhia"] = mentor_update.companhia
        if mentor_update.curso is not None:
            fields["Curso"] = mentor_update.curso
        if mentor_update.biografia is not None:
            fields["Bio"] = mentor_update.biografia
        if mentor_update.linkedin is not None:
            fields["Linkedin URL"] = mentor_update.linkedin
        if mentor_update.tags is not None:
            fields["Tags"] = mentor_update.tags
        if mentor_update.area_expertise is not None:
            fields["Pode ajudar com"] = mentor_update.area_expertise

        # Atualizar registro no Airtable
        updated_mentor = await AirtableService.update_record(Tables.MENTORS, mentor_id, fields)

        # Retornar mentor atualizado
        return MentorResponse(
            id=updated_mentor["id"],
            nome=updated_mentor.get("Name", ""),
            email=updated_mentor.get("Email", ""),
            area_expertise=updated_mentor.get("Pode ajudar com", []),
            biografia=updated_mentor.get("Bio", ""),
            linkedin=updated_mentor.get("Linkedin URL"),
            foto_url=updated_mentor.get("Foto", [{}])[0].get("url") if updated_mentor.get("Foto") else None,
            companhia=updated_mentor.get("Companhia"),
            titulo=updated_mentor.get("Título"),
            curso=updated_mentor.get("Curso"),
            tags=updated_mentor.get("Tags", [])
        )
    except Exception as e:
        print(f"Erro ao atualizar mentor: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar mentor: {str(e)}"
        )
