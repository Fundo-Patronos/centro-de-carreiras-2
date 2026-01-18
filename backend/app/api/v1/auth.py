"""Authentication endpoints."""

from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ...models.user import UserInDB

router = APIRouter(prefix="/auth", tags=["auth"])


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
