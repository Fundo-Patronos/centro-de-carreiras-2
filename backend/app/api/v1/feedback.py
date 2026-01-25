"""Feedback API endpoints for post-session feedback collection."""

import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from google.cloud.firestore_v1.base_query import FieldFilter

from ...core.firebase import db
from ...core.email import email_service
from ...core.config import settings
from ...core.analytics import track_event
from ...models.feedback import (
    FeedbackSubmit,
    FeedbackRequestResponse,
    SendFeedbackRequest,
    SendFeedbackResponse,
    ProcessPendingResponse,
)
from ...models.user import UserInDB
from ..deps import get_current_admin


router = APIRouter(prefix="/feedback", tags=["feedback"])


def generate_token() -> str:
    """Generate a unique 32-character token."""
    return secrets.token_hex(16)


def get_feedback_url(token: str) -> str:
    """Generate the feedback form URL with token."""
    return f"{settings.FRONTEND_URL}/feedback?token={token}"


async def create_feedback_requests_for_session(session_data: dict) -> tuple[str, str]:
    """
    Create feedback request documents for both student and mentor.
    Returns tuple of (student_token, mentor_token).
    """
    session_id = session_data["id"]
    now = datetime.utcnow()

    # Generate tokens
    student_token = generate_token()
    mentor_token = generate_token()

    # Create student feedback request
    student_request_id = f"{session_id}_student"
    student_request = {
        "id": student_request_id,
        "session_id": session_id,
        "recipient_type": "student",
        "recipient_email": session_data["student_email"],
        "recipient_name": session_data["student_name"],
        "token": student_token,
        "created_at": now,
        "sent_at": None,
        "email_sent": False,
        "submitted": False,
    }

    # Create mentor feedback request
    mentor_request_id = f"{session_id}_mentor"
    mentor_request = {
        "id": mentor_request_id,
        "session_id": session_id,
        "recipient_type": "mentor",
        "recipient_email": session_data["mentor_email"],
        "recipient_name": session_data["mentor_name"],
        "token": mentor_token,
        "created_at": now,
        "sent_at": None,
        "email_sent": False,
        "submitted": False,
    }

    # Save to Firestore
    feedback_requests_ref = db.collection("feedback_requests")
    feedback_requests_ref.document(student_request_id).set(student_request)
    feedback_requests_ref.document(mentor_request_id).set(mentor_request)

    return student_token, mentor_token


async def send_feedback_emails_for_session(session_data: dict) -> tuple[bool, bool]:
    """
    Send feedback request emails to both student and mentor.
    Returns tuple of (student_sent, mentor_sent).
    """
    session_id = session_data["id"]
    feedback_requests_ref = db.collection("feedback_requests")

    # Get or create feedback requests
    student_request_doc = feedback_requests_ref.document(f"{session_id}_student").get()
    mentor_request_doc = feedback_requests_ref.document(f"{session_id}_mentor").get()

    # If requests don't exist, create them
    if not student_request_doc.exists or not mentor_request_doc.exists:
        student_token, mentor_token = await create_feedback_requests_for_session(session_data)
    else:
        student_data = student_request_doc.to_dict()
        mentor_data = mentor_request_doc.to_dict()
        student_token = student_data["token"]
        mentor_token = mentor_data["token"]

    # Send student email
    student_url = get_feedback_url(student_token)
    student_result = email_service.send_feedback_request_to_student(
        student_name=session_data["student_name"],
        student_email=session_data["student_email"],
        mentor_name=session_data["mentor_name"],
        feedback_url=student_url,
    )
    student_sent = student_result.get("success", False)

    # Send mentor email
    mentor_url = get_feedback_url(mentor_token)
    mentor_result = email_service.send_feedback_request_to_mentor(
        mentor_name=session_data["mentor_name"],
        mentor_email=session_data["mentor_email"],
        student_name=session_data["student_name"],
        feedback_url=mentor_url,
    )
    mentor_sent = mentor_result.get("success", False)

    # Update sent status in Firestore
    now = datetime.utcnow()
    if student_sent:
        feedback_requests_ref.document(f"{session_id}_student").update({
            "email_sent": True,
            "sent_at": now,
        })
    if mentor_sent:
        feedback_requests_ref.document(f"{session_id}_mentor").update({
            "email_sent": True,
            "sent_at": now,
        })

    return student_sent, mentor_sent


@router.get("/request/{token}", response_model=FeedbackRequestResponse)
async def get_feedback_request_info(token: str):
    """
    Get feedback request info by token (public endpoint).
    Returns info needed to display the feedback form.
    """
    try:
        # Find feedback request by token
        feedback_requests_ref = db.collection("feedback_requests")
        query = feedback_requests_ref.where(filter=FieldFilter("token", "==", token))
        docs = list(query.stream())

        if not docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token invalido ou expirado",
            )

        request_data = docs[0].to_dict()

        # Check if already submitted
        if request_data.get("submitted", False):
            return FeedbackRequestResponse(
                session_id=request_data["session_id"],
                recipient_type=request_data["recipient_type"],
                recipient_name=request_data["recipient_name"],
                other_party_name="",  # Not needed for already submitted
                already_submitted=True,
            )

        # Get session data to get the other party's name
        session_doc = db.collection("sessions").document(request_data["session_id"]).get()
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sessao nao encontrada",
            )

        session_data = session_doc.to_dict()

        # Determine other party name based on recipient type
        if request_data["recipient_type"] == "student":
            other_party_name = session_data["mentor_name"]
        else:
            other_party_name = session_data["student_name"]

        return FeedbackRequestResponse(
            session_id=request_data["session_id"],
            recipient_type=request_data["recipient_type"],
            recipient_name=request_data["recipient_name"],
            other_party_name=other_party_name,
            already_submitted=False,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar informacoes: {str(e)}",
        )


@router.post("/submit")
async def submit_feedback(feedback: FeedbackSubmit):
    """
    Submit feedback via token (public endpoint).
    """
    try:
        # Find feedback request by token
        feedback_requests_ref = db.collection("feedback_requests")
        query = feedback_requests_ref.where(filter=FieldFilter("token", "==", feedback.token))
        docs = list(query.stream())

        if not docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token invalido ou expirado",
            )

        request_doc = docs[0]
        request_data = request_doc.to_dict()

        # Check if already submitted
        if request_data.get("submitted", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Feedback ja foi enviado para esta solicitacao",
            )

        # Validate required fields based on meeting_status
        if feedback.meeting_status == "happened":
            if feedback.rating is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Avaliacao e obrigatoria quando o encontro aconteceu",
                )
        elif feedback.meeting_status == "not_happened":
            if not feedback.no_meeting_reason or not feedback.no_meeting_reason.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Motivo e obrigatorio quando o encontro nao aconteceu",
                )

        # Create feedback document
        now = datetime.utcnow()
        feedback_id = f"{request_data['session_id']}_{request_data['recipient_type']}"
        feedback_doc = {
            "id": feedback_id,
            "session_id": request_data["session_id"],
            "feedback_request_id": request_data["id"],
            "respondent_type": request_data["recipient_type"],
            "respondent_email": request_data["recipient_email"],
            "respondent_name": request_data["recipient_name"],
            "meeting_status": feedback.meeting_status,
            "no_meeting_reason": feedback.no_meeting_reason if feedback.meeting_status == "not_happened" else None,
            "rating": feedback.rating if feedback.meeting_status == "happened" else None,
            "additional_feedback": feedback.additional_feedback,
            "submitted_at": now,
        }

        # Save feedback
        db.collection("session_feedback").document(feedback_id).set(feedback_doc)

        # Mark request as submitted
        request_doc.reference.update({"submitted": True})

        # Track analytics
        track_event(
            user_id=request_data["recipient_email"],  # Use email as anonymous user ID
            event_name="Feedback Submitted",
            properties={
                "session_id": request_data["session_id"],
                "respondent_type": request_data["recipient_type"],
                "meeting_status": feedback.meeting_status,
                "rating": feedback.rating,
            },
        )

        return {"success": True, "message": "Feedback enviado com sucesso!"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao enviar feedback: {str(e)}",
        )


@router.post("/send", response_model=SendFeedbackResponse)
async def send_feedback_emails(
    request: SendFeedbackRequest,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Manually send feedback request emails for a session (admin only).
    """
    try:
        # Get session data
        session_doc = db.collection("sessions").document(request.session_id).get()
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sessao nao encontrada",
            )

        session_data = session_doc.to_dict()

        # Send emails
        student_sent, mentor_sent = await send_feedback_emails_for_session(session_data)

        # Track analytics
        track_event(
            user_id=admin.uid,
            event_name="Admin: Feedback Emails Sent",
            properties={
                "session_id": request.session_id,
                "student_email_sent": student_sent,
                "mentor_email_sent": mentor_sent,
            },
        )

        if not student_sent and not mentor_sent:
            return SendFeedbackResponse(
                success=False,
                message="Falha ao enviar emails de feedback",
                student_email_sent=False,
                mentor_email_sent=False,
            )

        return SendFeedbackResponse(
            success=True,
            message="Emails de feedback enviados com sucesso",
            student_email_sent=student_sent,
            mentor_email_sent=mentor_sent,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao enviar emails: {str(e)}",
        )


@router.post("/process-pending", response_model=ProcessPendingResponse)
async def process_pending_feedback_requests():
    """
    Process sessions from 5 days ago and send feedback requests.
    This endpoint is called by Cloud Scheduler.
    """
    try:
        # Calculate date 5 days ago
        target_date = datetime.utcnow() - timedelta(days=5)
        target_date_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        target_date_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Query sessions created 5 days ago
        sessions_ref = db.collection("sessions")
        query = (
            sessions_ref
            .where(filter=FieldFilter("created_at", ">=", target_date_start))
            .where(filter=FieldFilter("created_at", "<=", target_date_end))
        )
        sessions = list(query.stream())

        sessions_processed = 0
        emails_sent = 0
        errors = []

        for session_doc in sessions:
            session_data = session_doc.to_dict()
            session_id = session_data["id"]

            try:
                # Check if feedback requests already exist
                student_request = db.collection("feedback_requests").document(f"{session_id}_student").get()
                mentor_request = db.collection("feedback_requests").document(f"{session_id}_mentor").get()

                # Skip if both already sent
                if student_request.exists and mentor_request.exists:
                    student_data = student_request.to_dict()
                    mentor_data = mentor_request.to_dict()
                    if student_data.get("email_sent") and mentor_data.get("email_sent"):
                        continue

                # Send feedback emails
                student_sent, mentor_sent = await send_feedback_emails_for_session(session_data)

                sessions_processed += 1
                if student_sent:
                    emails_sent += 1
                if mentor_sent:
                    emails_sent += 1

            except Exception as e:
                errors.append(f"Session {session_id}: {str(e)}")

        # Track analytics
        track_event(
            user_id="system",
            event_name="System: Feedback Batch Processed",
            properties={
                "sessions_processed": sessions_processed,
                "emails_sent": emails_sent,
                "errors_count": len(errors),
            },
        )

        return ProcessPendingResponse(
            success=True,
            sessions_processed=sessions_processed,
            emails_sent=emails_sent,
            errors=errors,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar sessoes pendentes: {str(e)}",
        )
