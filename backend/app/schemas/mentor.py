from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List

class MentorBase(BaseModel):
    nome: str
    email: EmailStr
    area_expertise: List[str]
    biografia: str
    linkedin: Optional[HttpUrl] = None

class MentorResponse(MentorBase):
    id: str
    foto_url: Optional[str] = None

    class Config:
        from_attributes = True

class MentorFilter(BaseModel):
    area: Optional[str] = None
    expertise: Optional[str] = None
