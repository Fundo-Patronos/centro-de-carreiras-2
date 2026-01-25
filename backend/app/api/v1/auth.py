"""Authentication endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth

from ..deps import get_current_user
from ...models.user import UserInDB
from ...core.firebase import verify_id_token, db
from ...core.verification import (
    create_verification_token,
    verify_token,
    invalidate_user_tokens,
    get_verification_url,
)
from ...core.email import email_service

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
