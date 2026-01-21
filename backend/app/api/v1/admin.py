"""Admin endpoints for user management."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Literal
from datetime import datetime

from ..deps import get_current_admin
from ...core.firebase import db
from ...core.analytics import track_event, Events
from ...models.user import UserInDB

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
