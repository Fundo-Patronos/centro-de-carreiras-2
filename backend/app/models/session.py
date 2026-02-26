"""Session Pydantic models."""

from pydantic import BaseModel, EmailStr, Field
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
    student_feedback_submitted: bool = False
    mentor_feedback_submitted: bool = False


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
    student_feedback_submitted: bool = False
    mentor_feedback_submitted: bool = False


class SessionListResponse(BaseModel):
    """Response model for session list."""

    sessions: list[SessionResponse]
    total: int


class SessionStatusUpdate(BaseModel):
    """Data for updating session status."""

    status: Literal["pending", "completed"]


class SessionResendEmail(BaseModel):
    """Data for resending session email."""

    message: str


class SessionFeedback(BaseModel):
    """Data for submitting session feedback."""

    rating: int  # 1-5 stars
    comments: str = ""


class SessionCompleteWithFeedback(BaseModel):
    """Data for completing a session with feedback in one operation."""

    rating: int = Field(..., ge=1, le=5)  # Required 1-5 stars
    comments: str = ""
