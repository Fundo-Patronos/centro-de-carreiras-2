from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    nome: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    telefone: str
    curso: str
    ano_graduacao: int = Field(..., ge=2025, le=2035)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    telefone: str
    curso: str
    ano_graduacao: int
    role: str = "student"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
