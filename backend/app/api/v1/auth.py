"""Authentication endpoints."""

import logging
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from firebase_admin import auth as firebase_auth

from ..deps import get_current_user
from ...models.user import UserInDB
from ...core.firebase import verify_id_token, db
from ...core.config import settings
from ...core.verification import (
    create_verification_token,
    verify_token,
    invalidate_user_tokens,
    get_verification_url,
)
from ...core.email import email_service
from ...core.analytics import track_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


@router.get("/verify")
async def verify_token(current_user: UserInDB = Depends(get_current_user)):
    """
    Verify that the current token is valid.

    Returns basic user info if valid.
    Used by frontend to check authentication status.
    """
    return {
        "valid": True,
        "uid": current_user.uid,
        "email": current_user.email,
        "role": current_user.role,
        "displayName": current_user.displayName,
    }


@router.post("/logout")
async def logout():
    """
    Logout endpoint.

    Note: Firebase tokens are stateless, so actual logout is handled client-side.
    This endpoint exists for audit logging and future session invalidation.
    """
    return {"message": "Logout realizado com sucesso"}


class VerifyTokenRequest(BaseModel):
    """Request body for email token verification."""

    token: str


class PasswordResetRequest(BaseModel):
    """Request body for password reset."""

    email: EmailStr


@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """
    Request a password reset email.

    Public endpoint - no authentication required.
    Generates a Firebase password reset link and sends a custom email via Resend.
    """
    email = request.email.lower()

    try:
        # Check if user exists in Firebase Auth
        try:
            user = firebase_auth.get_user_by_email(email)
        except firebase_auth.UserNotFoundError:
            # Don't reveal if email exists or not for security
            logger.info(f"Password reset requested for non-existent email: {email}")
            return {"message": "Se o email estiver cadastrado, voce recebera um link para redefinir sua senha."}

        # Get user profile from Firestore for display name
        user_ref = db.collection("users").document(user.uid)
        user_doc = user_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_name = user_data.get("displayName", email.split("@")[0])
        else:
            user_name = email.split("@")[0]

        # Get the primary frontend URL (first one if multiple)
        frontend_url = settings.FRONTEND_URL.split(",")[0].strip()

        # Generate password reset link using Firebase Admin SDK
        action_code_settings = firebase_auth.ActionCodeSettings(
            url=f"{frontend_url}/auth/action",
            handle_code_in_app=True,
        )

        reset_link = firebase_auth.generate_password_reset_link(
            email,
            action_code_settings=action_code_settings,
        )

        # Send custom email via Resend
        result = email_service.send_password_reset_email(
            user_name=user_name,
            user_email=email,
            reset_url=reset_link,
        )

        if not result.get("success"):
            logger.error(f"Failed to send password reset email to {email}: {result.get('error')}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao enviar email de redefinicao de senha",
            )

        logger.info(f"Password reset email sent to {email}")
        return {"message": "Se o email estiver cadastrado, voce recebera um link para redefinir sua senha."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing password reset request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar solicitacao",
        )


@router.post("/send-verification-email")
async def send_verification_email(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Send or resend email verification link.

    Requires authentication. Only for users with pending_verification status.
    Invalidates any existing tokens before creating a new one.
    """
    token = credentials.credentials

    try:
        decoded_token = verify_id_token(token)
        uid = decoded_token["uid"]
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )

    # Get user profile
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuário não encontrado",
        )

    user_data = user_doc.to_dict()

    # Only allow for pending_verification users
    if user_data.get("status") != "pending_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verificação de email não necessária para este usuário",
        )

    # Invalidate any existing tokens
    await invalidate_user_tokens(uid)

    # Create new verification token
    verification_token = await create_verification_token(
        uid=uid,
        email=user_data["email"],
        role=user_data["role"],
    )

    # Send verification email
    verification_url = get_verification_url(verification_token)
    result = email_service.send_verification_email(
        user_name=user_data.get("displayName", user_data["email"].split("@")[0]),
        user_email=user_data["email"],
        verification_url=verification_url,
    )

    if not result.get("success"):
        logger.error(f"Failed to send verification email to {user_data['email']}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao enviar email de verificação",
        )

    logger.info(f"Verification email sent to {user_data['email']}")
    return {"message": "Email de verificação enviado com sucesso"}


@router.post("/verify-email-token")
async def verify_email_token(request: VerifyTokenRequest):
    """
    Verify email token and activate user account.

    Public endpoint - no authentication required.
    """
    result = await verify_token(request.token)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado",
        )

    # Update user status to active
    user_ref = db.collection("users").document(result["uid"])
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    user_data = user_doc.to_dict()

    # Only activate if still pending_verification
    if user_data.get("status") != "pending_verification":
        # Already verified or different status - just return success
        return {
            "message": "Email verificado com sucesso",
            "email": result["email"],
            "role": result["role"],
        }

    # Activate user
    user_ref.update({"status": "active"})
    logger.info(f"User {result['uid']} email verified and activated")

    return {
        "message": "Email verificado com sucesso",
        "email": result["email"],
        "role": result["role"],
    }


class NotifyAdminRequest(BaseModel):
    """Request body for admin notification about pending user."""

    uid: str
    email: EmailStr
    displayName: str
    role: Literal["estudante", "mentor"]
    company: Optional[str] = None
    title: Optional[str] = None


@router.post("/notify-pending-user")
async def notify_admin_pending_user(request: NotifyAdminRequest):
    """
    Notify admins about a new user registration that requires approval.

    This is called by the frontend after creating a user with "pending" status.
    Public endpoint - called during signup before user has a valid session.
    """
    try:
        # Get the primary frontend URL
        frontend_url = settings.FRONTEND_URL.split(",")[0].strip()
        admin_url = f"{frontend_url}/admin/aprovacoes"

        # Send notification email to admins
        result = email_service.send_admin_pending_user_notification(
            user_name=request.displayName,
            user_email=request.email,
            role=request.role,
            admin_url=admin_url,
            company=request.company,
            title=request.title,
        )

        if not result.get("success"):
            logger.error(f"Failed to send admin notification for {request.email}: {result.get('error')}")
            # Don't fail the signup - just log the error
            return {"success": False, "message": "Erro ao enviar notificacao"}

        logger.info(f"Admin notification sent for pending user: {request.email}")

        # Track analytics event
        track_event(
            request.uid,
            "Admin Notification: Pending User",
            {
                "user_email": request.email,
                "user_role": request.role,
            },
        )

        return {"success": True, "message": "Notificacao enviada aos administradores"}

    except Exception as e:
        logger.error(f"Error sending admin notification: {e}")
        # Don't fail the signup - just return error
        return {"success": False, "message": "Erro ao enviar notificacao"}
