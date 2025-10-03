from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.job import JobResponse
from app.services.airtable import AirtableService, Tables

router = APIRouter()

@router.get("/", response_model=List[JobResponse])
async def listar_vagas(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    area: Optional[str] = Query(None, description="Filtrar por área"),
    localizacao: Optional[str] = Query(None, description="Filtrar por localização")
):
    """Lista todas as vagas com filtros opcionais"""
    formulas = []

    if tipo:
        formulas.append(f"{{Tipo}} = '{tipo}'")
    if area:
        formulas.append(f"{{Área}} = '{area}'")
    if localizacao:
        formulas.append(f"FIND('{localizacao}', {{Localização}})")

    formula = f"AND({', '.join(formulas)})" if formulas else None

    jobs = await AirtableService.get_all_records(Tables.JOBS, formula)

    return [
        JobResponse(
            id=job["id"],
            titulo=job.get("Título", ""),
            empresa=job.get("Empresa", ""),
            tipo=job.get("Tipo", ""),
            area=job.get("Área", ""),
            localizacao=job.get("Localização", ""),
            descricao=job.get("Descrição", ""),
            link_candidatura=job.get("Link de Candidatura", ""),
            data_publicacao=job.get("Data de Publicação", "")
        )
        for job in jobs
    ]

@router.get("/{job_id}", response_model=JobResponse)
async def buscar_vaga(job_id: str):
    """Busca vaga por ID"""
    try:
        job = await AirtableService.get_record(Tables.JOBS, job_id)

        return JobResponse(
            id=job["id"],
            titulo=job.get("Título", ""),
            empresa=job.get("Empresa", ""),
            tipo=job.get("Tipo", ""),
            area=job.get("Área", ""),
            localizacao=job.get("Localização", ""),
            descricao=job.get("Descrição", ""),
            link_candidatura=job.get("Link de Candidatura", ""),
            data_publicacao=job.get("Data de Publicação", "")
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Vaga não encontrada"
        )
