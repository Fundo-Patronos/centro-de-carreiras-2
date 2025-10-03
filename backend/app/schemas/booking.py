from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class BookingCreate(BaseModel):
    mentor_id: str
    data: date
    horario: str
    assunto: str = Field(..., min_length=10)

class BookingUpdate(BaseModel):
    status: str  # Confirmado, Cancelado

class BookingResponse(BaseModel):
    id: str
    estudante_id: str
    estudante_nome: str
    mentor_id: str
    mentor_nome: str
    data: date
    horario: str
    assunto: str
    status: str  # Pendente, Confirmado, Cancelado

    class Config:
        from_attributes = True
