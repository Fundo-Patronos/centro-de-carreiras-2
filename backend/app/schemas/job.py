from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import date

class JobBase(BaseModel):
    titulo: str
    empresa: str
    tipo: str  # Estágio, Trainee, Júnior, etc.
    area: str
    localizacao: str
    descricao: str
    link_candidatura: HttpUrl

class JobResponse(JobBase):
    id: str
    data_publicacao: date

    class Config:
        from_attributes = True

class JobFilter(BaseModel):
    tipo: Optional[str] = None
    area: Optional[str] = None
    localizacao: Optional[str] = None
