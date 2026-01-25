"""Feedback Pydantic models for post-session feedback collection."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


# Feedback request models (for storing in feedback_requests collection)

class FeedbackRequestInDB(BaseModel):
    """Feedback request data as stored in Firestore."""

    id: str
    session_id: str
    recipient_type: Literal["student", "mentor"]
    recipient_email: EmailStr
    recipient_name: str
    token: str  # 32-char unique token
    created_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    email_sent: bool = False
    submitted: bool = False


class FeedbackRequestResponse(BaseModel):
    """Feedback request info returned for the public form."""

    session_id: str
    recipient_type: Literal["student", "mentor"]
    recipient_name: str
    other_party_name: str  # mentor name for student, student name for mentor
    already_submitted: bool = False


# Feedback submission models

class FeedbackSubmit(BaseModel):
    """Data submitted via the feedback form."""

    token: str
    meeting_status: Literal["happened", "scheduled", "not_happened"]
    no_meeting_reason: Optional[str] = None  # Required if meeting_status != "happened"
    rating: Optional[int] = Field(None, ge=1, le=5)  # Required if meeting_status == "happened"
    additional_feedback: Optional[str] = None


class FeedbackInDB(BaseModel):
    """Feedback data as stored in session_feedback collection."""

    id: str
    session_id: str
    feedback_request_id: str
    respondent_type: Literal["student", "mentor"]
    respondent_email: EmailStr
    respondent_name: str
    meeting_status: Literal["happened", "scheduled", "not_happened"]
    no_meeting_reason: Optional[str] = None
    rating: Optional[int] = None  # 1-5
    additional_feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None


class FeedbackResponse(BaseModel):
    """Single feedback response for API responses."""

    id: str
    session_id: str
    respondent_type: Literal["student", "mentor"]
    respondent_name: str
    meeting_status: str
    no_meeting_reason: Optional[str] = None
    rating: Optional[int] = None
    additional_feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None


# Admin view models

class SessionFeedbackSummary(BaseModel):
    """Summary of feedback for a session (admin view)."""

    session_id: str
    student_name: str
    student_email: EmailStr
    mentor_name: str
    mentor_email: EmailStr
    session_created_at: Optional[datetime] = None

    # Feedback request status
    student_feedback_sent: bool = False
    mentor_feedback_sent: bool = False

    # Feedback responses
    student_feedback: Optional[FeedbackResponse] = None
    mentor_feedback: Optional[FeedbackResponse] = None


class SessionFeedbackListResponse(BaseModel):
    """Response model for listing sessions with feedback status."""

    sessions: list[SessionFeedbackSummary]
    total: int


# Manual send models

class SendFeedbackRequest(BaseModel):
    """Request to manually send feedback emails for a session."""

    session_id: str


class SendFeedbackResponse(BaseModel):
    """Response after sending feedback emails."""

    success: bool
    message: str
    student_email_sent: bool = False
    mentor_email_sent: bool = False


# Process pending models

class ProcessPendingResponse(BaseModel):
    """Response from processing pending feedback requests."""

    success: bool
    sessions_processed: int
    emails_sent: int
    errors: list[str] = []
