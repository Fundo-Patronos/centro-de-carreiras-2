"""Admin endpoints for user management and feedback viewing."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime
from firebase_admin import firestore

from ..deps import get_current_admin
from ...core.firebase import db
from ...core.analytics import track_event, Events
from ...models.user import UserInDB
from ...models.feedback import (
    FeedbackResponse,
    SessionFeedbackSummary,
    SessionFeedbackListResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class PendingUserResponse(BaseModel):
    """Response model for pending user data."""

    uid: str
    email: str
    displayName: str
    photoURL: str | None = None
    role: Literal["estudante", "mentor"]
    status: str
    createdAt: datetime | None = None


class UserListResponse(BaseModel):
    """Response model for list of pending users."""

    users: list[PendingUserResponse]
    total: int


class ApprovalResponse(BaseModel):
    """Response model for approval/rejection actions."""

    success: bool
    message: str
    uid: str
    new_status: str


# Add new event constants for admin actions
class AdminEvents:
    USER_APPROVED = "Admin: User Approved"
    USER_REJECTED = "Admin: User Rejected"


@router.get("/users/pending", response_model=UserListResponse)
async def get_pending_users(
    admin: UserInDB = Depends(get_current_admin),
):
    """
    List all users with pending status.

    Requires admin privileges.
    """
    try:
        # Query Firestore for pending users
        users_ref = db.collection("users")
        pending_query = users_ref.where("status", "==", "pending")
        docs = pending_query.stream()

        pending_users = []
        for doc in docs:
            data = doc.to_dict()
            pending_users.append(
                PendingUserResponse(
                    uid=doc.id,
                    email=data.get("email", ""),
                    displayName=data.get("displayName", ""),
                    photoURL=data.get("photoURL"),
                    role=data.get("role", "estudante"),
                    status=data.get("status", "pending"),
                    createdAt=data.get("createdAt"),
                )
            )

        # Sort by creation date (newest first)
        pending_users.sort(
            key=lambda u: u.createdAt or datetime.min,
            reverse=True,
        )

        return UserListResponse(users=pending_users, total=len(pending_users))

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar usuários pendentes: {str(e)}",
        )


@router.patch("/users/{uid}/approve", response_model=ApprovalResponse)
async def approve_user(
    uid: str,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Approve a pending user, setting their status to 'active'.

    Requires admin privileges.
    """
    try:
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        user_data = user_doc.to_dict()

        if user_data.get("status") != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Usuário não está pendente (status atual: {user_data.get('status')})",
            )

        # Update status to active
        user_ref.update({"status": "active"})

        # Track event in Mixpanel
        track_event(
            admin.uid,
            AdminEvents.USER_APPROVED,
            {
                "approved_user_uid": uid,
                "approved_user_email": user_data.get("email"),
                "approved_user_role": user_data.get("role"),
            },
        )

        return ApprovalResponse(
            success=True,
            message="Usuário aprovado com sucesso",
            uid=uid,
            new_status="active",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao aprovar usuário: {str(e)}",
        )


@router.patch("/users/{uid}/reject", response_model=ApprovalResponse)
async def reject_user(
    uid: str,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Reject a pending user, setting their status to 'suspended'.

    Requires admin privileges.
    """
    try:
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        user_data = user_doc.to_dict()

        if user_data.get("status") != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Usuário não está pendente (status atual: {user_data.get('status')})",
            )

        # Update status to suspended
        user_ref.update({"status": "suspended"})

        # Track event in Mixpanel
        track_event(
            admin.uid,
            AdminEvents.USER_REJECTED,
            {
                "rejected_user_uid": uid,
                "rejected_user_email": user_data.get("email"),
                "rejected_user_role": user_data.get("role"),
            },
        )

        return ApprovalResponse(
            success=True,
            message="Usuário rejeitado",
            uid=uid,
            new_status="suspended",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao rejeitar usuário: {str(e)}",
        )


# ==================== Feedback Endpoints ====================


@router.get("/feedback", response_model=SessionFeedbackListResponse)
async def list_sessions_with_feedback(
    admin: UserInDB = Depends(get_current_admin),
):
    """
    List all sessions with their feedback status.
    Requires admin privileges.
    """
    try:
        # Get all sessions ordered by creation date
        sessions_ref = db.collection("sessions")
        sessions_query = sessions_ref.order_by("created_at", direction=firestore.Query.DESCENDING)
        session_docs = list(sessions_query.stream())

        results = []
        for session_doc in session_docs:
            session_data = session_doc.to_dict()
            session_id = session_data["id"]

            # Get feedback requests for this session
            student_request = db.collection("feedback_requests").document(f"{session_id}_student").get()
            mentor_request = db.collection("feedback_requests").document(f"{session_id}_mentor").get()

            student_feedback_sent = False
            mentor_feedback_sent = False

            if student_request.exists:
                student_feedback_sent = student_request.to_dict().get("email_sent", False)
            if mentor_request.exists:
                mentor_feedback_sent = mentor_request.to_dict().get("email_sent", False)

            # Get actual feedback responses
            student_feedback = None
            mentor_feedback = None

            student_feedback_doc = db.collection("session_feedback").document(f"{session_id}_student").get()
            mentor_feedback_doc = db.collection("session_feedback").document(f"{session_id}_mentor").get()

            if student_feedback_doc.exists:
                sf_data = student_feedback_doc.to_dict()
                student_feedback = FeedbackResponse(
                    id=sf_data["id"],
                    session_id=sf_data["session_id"],
                    respondent_type=sf_data["respondent_type"],
                    respondent_name=sf_data["respondent_name"],
                    meeting_status=sf_data["meeting_status"],
                    no_meeting_reason=sf_data.get("no_meeting_reason"),
                    rating=sf_data.get("rating"),
                    additional_feedback=sf_data.get("additional_feedback"),
                    submitted_at=sf_data.get("submitted_at"),
                )

            if mentor_feedback_doc.exists:
                mf_data = mentor_feedback_doc.to_dict()
                mentor_feedback = FeedbackResponse(
                    id=mf_data["id"],
                    session_id=mf_data["session_id"],
                    respondent_type=mf_data["respondent_type"],
                    respondent_name=mf_data["respondent_name"],
                    meeting_status=mf_data["meeting_status"],
                    no_meeting_reason=mf_data.get("no_meeting_reason"),
                    rating=mf_data.get("rating"),
                    additional_feedback=mf_data.get("additional_feedback"),
                    submitted_at=mf_data.get("submitted_at"),
                )

            results.append(
                SessionFeedbackSummary(
                    session_id=session_id,
                    student_name=session_data["student_name"],
                    student_email=session_data["student_email"],
                    mentor_name=session_data["mentor_name"],
                    mentor_email=session_data["mentor_email"],
                    session_created_at=session_data.get("created_at"),
                    student_feedback_sent=student_feedback_sent,
                    mentor_feedback_sent=mentor_feedback_sent,
                    student_feedback=student_feedback,
                    mentor_feedback=mentor_feedback,
                )
            )

        return SessionFeedbackListResponse(sessions=results, total=len(results))

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar sessoes com feedback: {str(e)}",
        )


@router.get("/feedback/{session_id}", response_model=SessionFeedbackSummary)
async def get_session_feedback(
    session_id: str,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Get feedback details for a specific session.
    Requires admin privileges.
    """
    try:
        # Get session data
        session_doc = db.collection("sessions").document(session_id).get()
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sessao nao encontrada",
            )

        session_data = session_doc.to_dict()

        # Get feedback requests
        student_request = db.collection("feedback_requests").document(f"{session_id}_student").get()
        mentor_request = db.collection("feedback_requests").document(f"{session_id}_mentor").get()

        student_feedback_sent = False
        mentor_feedback_sent = False

        if student_request.exists:
            student_feedback_sent = student_request.to_dict().get("email_sent", False)
        if mentor_request.exists:
            mentor_feedback_sent = mentor_request.to_dict().get("email_sent", False)

        # Get actual feedback responses
        student_feedback = None
        mentor_feedback = None

        student_feedback_doc = db.collection("session_feedback").document(f"{session_id}_student").get()
        mentor_feedback_doc = db.collection("session_feedback").document(f"{session_id}_mentor").get()

        if student_feedback_doc.exists:
            sf_data = student_feedback_doc.to_dict()
            student_feedback = FeedbackResponse(
                id=sf_data["id"],
                session_id=sf_data["session_id"],
                respondent_type=sf_data["respondent_type"],
                respondent_name=sf_data["respondent_name"],
                meeting_status=sf_data["meeting_status"],
                no_meeting_reason=sf_data.get("no_meeting_reason"),
                rating=sf_data.get("rating"),
                additional_feedback=sf_data.get("additional_feedback"),
                submitted_at=sf_data.get("submitted_at"),
            )

        if mentor_feedback_doc.exists:
            mf_data = mentor_feedback_doc.to_dict()
            mentor_feedback = FeedbackResponse(
                id=mf_data["id"],
                session_id=mf_data["session_id"],
                respondent_type=mf_data["respondent_type"],
                respondent_name=mf_data["respondent_name"],
                meeting_status=mf_data["meeting_status"],
                no_meeting_reason=mf_data.get("no_meeting_reason"),
                rating=mf_data.get("rating"),
                additional_feedback=mf_data.get("additional_feedback"),
                submitted_at=mf_data.get("submitted_at"),
            )

        return SessionFeedbackSummary(
            session_id=session_id,
            student_name=session_data["student_name"],
            student_email=session_data["student_email"],
            mentor_name=session_data["mentor_name"],
            mentor_email=session_data["mentor_email"],
            session_created_at=session_data.get("created_at"),
            student_feedback_sent=student_feedback_sent,
            mentor_feedback_sent=mentor_feedback_sent,
            student_feedback=student_feedback,
            mentor_feedback=mentor_feedback,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar feedback da sessao: {str(e)}",
        )
