"""
Email verification token management for Centro de Carreiras.

Handles generation, storage, and validation of email verification tokens.
"""

import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from google.cloud.firestore_v1 import FieldFilter
from .firebase import db
from .config import settings

logger = logging.getLogger(__name__)

# Token configuration
TOKEN_LENGTH = 32  # bytes (64 hex characters)
TOKEN_EXPIRY_HOURS = 24


def generate_verification_token() -> str:
    """Generate a secure random verification token."""
    return secrets.token_hex(TOKEN_LENGTH)


def get_verification_url(token: str) -> str:
    """Build the full verification URL for the frontend."""
    return f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"


async def create_verification_token(uid: str, email: str, role: str) -> str:
    """
    Create and store a new verification token for a user.

    Args:
        uid: User's Firebase UID
        email: User's email address
        role: User's role

    Returns:
        The generated token
    """
    token = generate_verification_token()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=TOKEN_EXPIRY_HOURS)

    # Store token in Firestore
    token_ref = db.collection("email_verifications").document(token)
    token_ref.set({
        "uid": uid,
        "email": email,
        "role": role,
        "createdAt": now,
        "expiresAt": expires_at,
        "used": False,
    })

    logger.info(f"Created verification token for user {uid}")
    return token


async def verify_token(token: str) -> Optional[dict]:
    """
    Validate a verification token and mark it as used.

    Args:
        token: The verification token to validate

    Returns:
        Dict with uid, email, role if valid, None otherwise
    """
    token_ref = db.collection("email_verifications").document(token)
    token_doc = token_ref.get()

    if not token_doc.exists:
        logger.warning(f"Verification token not found: {token[:8]}...")
        return None

    token_data = token_doc.to_dict()

    # Check if already used
    if token_data.get("used"):
        logger.warning(f"Verification token already used: {token[:8]}...")
        return None

    # Check expiration
    expires_at = token_data.get("expiresAt")
    if expires_at:
        # Handle both datetime and Firestore Timestamp
        if hasattr(expires_at, "timestamp"):
            expires_at = datetime.fromtimestamp(expires_at.timestamp(), tz=timezone.utc)
        elif expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            logger.warning(f"Verification token expired: {token[:8]}...")
            return None

    # Mark token as used
    token_ref.update({"used": True})
    logger.info(f"Verification token validated for user {token_data['uid']}")

    return {
        "uid": token_data["uid"],
        "email": token_data["email"],
        "role": token_data["role"],
    }


async def invalidate_user_tokens(uid: str) -> int:
    """
    Invalidate all unused verification tokens for a user.

    Used when resending verification email to prevent old tokens from working.

    Args:
        uid: User's Firebase UID

    Returns:
        Number of tokens invalidated
    """
    tokens_ref = db.collection("email_verifications")
    query = tokens_ref.where(filter=FieldFilter("uid", "==", uid)).where(
        filter=FieldFilter("used", "==", False)
    )

    count = 0
    for doc in query.stream():
        doc.reference.update({"used": True})
        count += 1

    if count > 0:
        logger.info(f"Invalidated {count} verification tokens for user {uid}")

    return count
