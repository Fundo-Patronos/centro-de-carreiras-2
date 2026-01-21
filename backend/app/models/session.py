"""Session Pydantic models."""

from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class SessionCreate(BaseModel):
    """Data required to create a new session request."""

    mentor_id: str  # Airtable record ID
    mentor_name: str
    mentor_email: EmailStr
    mentor_company: str
    message: str


class SessionInDB(BaseModel):
    """Session data as stored in Firestore."""

    id: str  # 8-char unique ID
    student_uid: str  # Firebase UID
    student_name: str
    student_email: EmailStr
    mentor_id: str  # Airtable record ID
    mentor_name: str
    mentor_email: EmailStr
    mentor_company: str
    message: str
    status: Literal["pending", "confirmed", "completed", "cancelled"] = "pending"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    mentor_email_sent: bool = False
    student_email_sent: bool = False


class SessionResponse(BaseModel):
    """Session data returned in API responses."""

    id: str
    student_uid: str
    student_name: str
    student_email: EmailStr
    mentor_id: str
    mentor_name: str
    mentor_email: EmailStr
    mentor_company: str
    message: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SessionListResponse(BaseModel):
    """Response model for session list."""

    sessions: list[SessionResponse]
    total: int
