from pydantic import BaseModel, EmailStr
from typing import Optional, List

class MentorBase(BaseModel):
    nome: str
    email: EmailStr
    area_expertise: List[str]
    biografia: str
    linkedin: Optional[str] = None

class MentorResponse(MentorBase):
    id: str
    foto_url: Optional[str] = None
    companhia: Optional[str] = None
    titulo: Optional[str] = None
    curso: Optional[str] = None
    tags: List[str] = []

    class Config:
        from_attributes = True

class MentorFilter(BaseModel):
    area: Optional[str] = None
    expertise: Optional[str] = None

class MentorUpdate(BaseModel):
    """Schema for updating mentor profile - all fields are optional"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    titulo: Optional[str] = None
    companhia: Optional[str] = None
    curso: Optional[str] = None
    biografia: Optional[str] = None
    linkedin: Optional[str] = None
    tags: Optional[List[str]] = None
    area_expertise: Optional[List[str]] = None
