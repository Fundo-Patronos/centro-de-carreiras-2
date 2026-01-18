"""Firebase Admin SDK initialization and utilities."""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from .config import get_settings

settings = get_settings()

# Initialize Firebase Admin SDK
_cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
_app = firebase_admin.initialize_app(_cred)

# Firestore client
db = firestore.client()


def verify_id_token(token: str) -> dict:
    """
    Verify Firebase ID token and return decoded claims.

    Args:
        token: The Firebase ID token to verify.

    Returns:
        Decoded token claims including uid, email, etc.

    Raises:
        firebase_admin.auth.InvalidIdTokenError: If the token is invalid.
        firebase_admin.auth.ExpiredIdTokenError: If the token has expired.
    """
    return auth.verify_id_token(token)


def get_user(uid: str):
    """
    Get Firebase Auth user record by UID.

    Args:
        uid: The user's Firebase UID.

    Returns:
        UserRecord object from Firebase Auth.
    """
    return auth.get_user(uid)


def get_user_by_email(email: str):
    """
    Get Firebase Auth user record by email.

    Args:
        email: The user's email address.

    Returns:
        UserRecord object from Firebase Auth.
    """
    return auth.get_user_by_email(email)
