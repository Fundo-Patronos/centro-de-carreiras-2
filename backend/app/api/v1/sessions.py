"""Sessions API endpoints."""

import secrets
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from ...core.firebase import db
from ...core.email import email_service
from ...core.analytics import track_event, Events
from ...models.session import (
    SessionCreate,
    SessionResponse,
    SessionListResponse,
    SessionStatusUpdate,
    SessionResendEmail,
    SessionFeedback,
)
from ...models.user import UserInDB
from ..deps import get_current_user, get_current_estudante


router = APIRouter(prefix="/sessions", tags=["sessions"])


def generate_session_id() -> str:
    """Generate a unique 8-character session ID."""
    return secrets.token_hex(4)


@router.post("", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    current_user: UserInDB = Depends(get_current_estudante),
):
    """
    Create a new mentorship session request.
    Only students (estudante) can create sessions.
    """
    try:
        # Generate unique session ID
        session_id = generate_session_id()

        # Prepare session document
        now = datetime.utcnow()
        session_doc = {
            "id": session_id,
            "student_uid": current_user.uid,
            "student_name": current_user.displayName,
            "student_email": current_user.email,
            "mentor_id": session_data.mentor_id,
            "mentor_name": session_data.mentor_name,
            "mentor_email": session_data.mentor_email,
            "mentor_company": session_data.mentor_company,
            "message": session_data.message,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
            "mentor_email_sent": False,
            "student_email_sent": False,
        }

        # Save to Firestore
        sessions_ref = db.collection("sessions")
        sessions_ref.document(session_id).set(session_doc)

        # Send emails
        mentor_email_result = email_service.send_session_request_to_mentor(
            mentor_name=session_data.mentor_name,
            mentor_email=session_data.mentor_email,
            student_name=current_user.displayName,
            student_email=current_user.email,
            message=session_data.message,
        )

        # Track mentor email result
        if mentor_email_result.get("success", False):
            track_event(
                user_id=current_user.uid,
                event_name=Events.EMAIL_MENTOR_REQUEST_SENT,
                properties={
                    "session_id": session_id,
                    "mentor_email": session_data.mentor_email,
                    "mentor_name": session_data.mentor_name,
                },
            )
        else:
            track_event(
                user_id=current_user.uid,
                event_name=Events.EMAIL_MENTOR_REQUEST_FAILED,
                properties={
                    "session_id": session_id,
                    "mentor_email": session_data.mentor_email,
                    "error": mentor_email_result.get("error", "Unknown error"),
                },
            )

        student_email_result = email_service.send_session_confirmation_to_student(
            student_name=current_user.displayName,
            student_email=current_user.email,
            mentor_name=session_data.mentor_name,
            mentor_company=session_data.mentor_company,
            message=session_data.message,
        )

        # Track student email result
        if student_email_result.get("success", False):
            track_event(
                user_id=current_user.uid,
                event_name=Events.EMAIL_STUDENT_CONFIRMATION_SENT,
                properties={
                    "session_id": session_id,
                    "student_email": current_user.email,
                },
            )
        else:
            track_event(
                user_id=current_user.uid,
                event_name=Events.EMAIL_STUDENT_CONFIRMATION_FAILED,
                properties={
                    "session_id": session_id,
                    "student_email": current_user.email,
                    "error": student_email_result.get("error", "Unknown error"),
                },
            )

        # Update email status in Firestore
        update_data = {
            "mentor_email_sent": mentor_email_result.get("success", False),
            "student_email_sent": student_email_result.get("success", False),
        }
        sessions_ref.document(session_id).update(update_data)

        # Track session created
        track_event(
            user_id=current_user.uid,
            event_name=Events.SESSION_CREATED,
            properties={
                "session_id": session_id,
                "mentor_id": session_data.mentor_id,
                "mentor_name": session_data.mentor_name,
                "mentor_company": session_data.mentor_company,
                "mentor_email_sent": mentor_email_result.get("success", False),
                "student_email_sent": student_email_result.get("success", False),
            },
        )

        # Return response
        return SessionResponse(
            id=session_id,
            student_uid=current_user.uid,
            student_name=current_user.displayName,
            student_email=current_user.email,
            mentor_id=session_data.mentor_id,
            mentor_name=session_data.mentor_name,
            mentor_email=session_data.mentor_email,
            mentor_company=session_data.mentor_company,
            message=session_data.message,
            status="pending",
            created_at=now,
            updated_at=now,
            student_feedback_submitted=False,
            mentor_feedback_submitted=False,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create session: {str(e)}",
        )


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Get list of sessions for the current user.
    Students see their own session requests.
    Mentors see sessions requested to them.
    """
    try:
        sessions_ref = db.collection("sessions")

        # Filter by user role using new filter syntax
        if current_user.role == "estudante":
            query = sessions_ref.where(filter=FieldFilter("student_uid", "==", current_user.uid))
        else:  # mentor
            query = sessions_ref.where(filter=FieldFilter("mentor_email", "==", current_user.email))

        # Filter by status if provided
        if status:
            query = query.where(filter=FieldFilter("status", "==", status))

        # Order by creation date (most recent first)
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)

        # Execute query
        docs = query.stream()

        sessions = []
        for doc in docs:
            data = doc.to_dict()
            sessions.append(SessionResponse(
                id=data["id"],
                student_uid=data["student_uid"],
                student_name=data["student_name"],
                student_email=data["student_email"],
                mentor_id=data["mentor_id"],
                mentor_name=data["mentor_name"],
                mentor_email=data["mentor_email"],
                mentor_company=data["mentor_company"],
                message=data["message"],
                status=data["status"],
                created_at=data.get("created_at"),
                updated_at=data.get("updated_at"),
                student_feedback_submitted=data.get("student_feedback_submitted", False),
                mentor_feedback_submitted=data.get("mentor_feedback_submitted", False),
            ))

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.SESSIONS_LISTED,
            properties={
                "role": current_user.role,
                "status_filter": status,
                "result_count": len(sessions),
            },
        )

        return SessionListResponse(
            sessions=sessions,
            total=len(sessions),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch sessions: {str(e)}",
        )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Get a specific session by ID.
    Users can only access their own sessions.
    """
    try:
        doc_ref = db.collection("sessions").document(session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Session not found",
            )

        data = doc.to_dict()

        # Check access permission
        is_student = data["student_uid"] == current_user.uid
        is_mentor = data["mentor_email"] == current_user.email

        if not is_student and not is_mentor:
            raise HTTPException(
                status_code=403,
                detail="Access denied",
            )

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.SESSION_DETAIL_FETCHED,
            properties={
                "session_id": session_id,
                "user_role": current_user.role,
                "is_student": is_student,
                "is_mentor": is_mentor,
            },
        )

        return SessionResponse(
            id=data["id"],
            student_uid=data["student_uid"],
            student_name=data["student_name"],
            student_email=data["student_email"],
            mentor_id=data["mentor_id"],
            mentor_name=data["mentor_name"],
            mentor_email=data["mentor_email"],
            mentor_company=data["mentor_company"],
            message=data["message"],
            status=data["status"],
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            student_feedback_submitted=data.get("student_feedback_submitted", False),
            mentor_feedback_submitted=data.get("mentor_feedback_submitted", False),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch session: {str(e)}",
        )


@router.patch("/{session_id}/status", response_model=SessionResponse)
async def update_session_status(
    session_id: str,
    status_update: SessionStatusUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Update the status of a session.
    Both students and mentors can update status.
    """
    try:
        doc_ref = db.collection("sessions").document(session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Session not found",
            )

        data = doc.to_dict()

        # Check access permission
        is_student = data["student_uid"] == current_user.uid
        is_mentor = data["mentor_email"] == current_user.email

        if not is_student and not is_mentor:
            raise HTTPException(
                status_code=403,
                detail="Access denied",
            )

        # Update status and timestamp
        now = datetime.utcnow()
        update_data = {
            "status": status_update.status,
            "updated_at": now,
        }
        doc_ref.update(update_data)

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.SESSION_STATUS_UPDATED,
            properties={
                "session_id": session_id,
                "new_status": status_update.status,
                "user_role": current_user.role,
                "is_student": is_student,
                "is_mentor": is_mentor,
            },
        )

        # Return updated session
        data["status"] = status_update.status
        data["updated_at"] = now

        return SessionResponse(
            id=data["id"],
            student_uid=data["student_uid"],
            student_name=data["student_name"],
            student_email=data["student_email"],
            mentor_id=data["mentor_id"],
            mentor_name=data["mentor_name"],
            mentor_email=data["mentor_email"],
            mentor_company=data["mentor_company"],
            message=data["message"],
            status=data["status"],
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            student_feedback_submitted=data.get("student_feedback_submitted", False),
            mentor_feedback_submitted=data.get("mentor_feedback_submitted", False),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update session status: {str(e)}",
        )


@router.post("/{session_id}/resend", response_model=dict)
async def resend_session_email(
    session_id: str,
    resend_data: SessionResendEmail,
    current_user: UserInDB = Depends(get_current_estudante),
):
    """
    Resend the session request email to the mentor.
    Only students can resend emails.
    """
    try:
        doc_ref = db.collection("sessions").document(session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Session not found",
            )

        data = doc.to_dict()

        # Verify the current user is the student who created this session
        if data["student_uid"] != current_user.uid:
            raise HTTPException(
                status_code=403,
                detail="Only the student who created this session can resend emails",
            )

        # Update message in Firestore
        now = datetime.utcnow()
        doc_ref.update({
            "message": resend_data.message,
            "updated_at": now,
        })

        # Resend email to mentor
        email_result = email_service.send_session_request_to_mentor(
            mentor_name=data["mentor_name"],
            mentor_email=data["mentor_email"],
            student_name=current_user.displayName,
            student_email=current_user.email,
            message=resend_data.message,
        )

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.SESSION_EMAIL_RESENT,
            properties={
                "session_id": session_id,
                "mentor_email": data["mentor_email"],
                "email_sent": email_result.get("success", False),
            },
        )

        return {
            "success": email_result.get("success", False),
            "message": "Email reenviado com sucesso" if email_result.get("success") else "Falha ao reenviar email",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resend email: {str(e)}",
        )


@router.post("/{session_id}/feedback", response_model=dict)
async def submit_session_feedback(
    session_id: str,
    feedback: SessionFeedback,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Submit feedback for a session.
    Both students and mentors can submit feedback individually.
    """
    try:
        doc_ref = db.collection("sessions").document(session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Session not found",
            )

        data = doc.to_dict()

        # Check access permission
        is_student = data["student_uid"] == current_user.uid
        is_mentor = data["mentor_email"] == current_user.email

        if not is_student and not is_mentor:
            raise HTTPException(
                status_code=403,
                detail="Access denied",
            )

        # Validate rating
        if feedback.rating < 1 or feedback.rating > 5:
            raise HTTPException(
                status_code=400,
                detail="Rating must be between 1 and 5",
            )

        # Store feedback in session_feedback collection
        now = datetime.utcnow()
        feedback_doc = {
            "session_id": session_id,
            "user_uid": current_user.uid,
            "user_email": current_user.email,
            "user_role": current_user.role,
            "rating": feedback.rating,
            "comments": feedback.comments,
            "created_at": now,
        }

        feedback_ref = db.collection("session_feedback")
        feedback_ref.add(feedback_doc)

        # Update feedback submitted flag in session document
        feedback_field = "student_feedback_submitted" if is_student else "mentor_feedback_submitted"
        doc_ref.update({
            feedback_field: True,
            "updated_at": now,
        })

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.SESSION_FEEDBACK_SUBMITTED,
            properties={
                "session_id": session_id,
                "rating": feedback.rating,
                "user_role": current_user.role,
                "is_student": is_student,
                "is_mentor": is_mentor,
                "has_comments": bool(feedback.comments),
            },
        )

        return {
            "success": True,
            "message": "Feedback enviado com sucesso",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit feedback: {str(e)}",
        )
