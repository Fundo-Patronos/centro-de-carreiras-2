"""Firebase Admin SDK initialization and utilities."""

import json
import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from .config import get_settings

settings = get_settings()


def _get_credentials():
    """
    Get Firebase credentials from various sources.

    Priority:
    1. FIREBASE_SERVICE_ACCOUNT_JSON env var (JSON string - for Cloud Run)
    2. FIREBASE_SERVICE_ACCOUNT_PATH file path (for local development)
    3. Application Default Credentials (for GCP environments)
    """
    # Option 1: JSON string from environment variable
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        try:
            sa_dict = json.loads(sa_json)
            return credentials.Certificate(sa_dict)
        except json.JSONDecodeError:
            pass

    # Option 2: File path
    if settings.FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(
        settings.FIREBASE_SERVICE_ACCOUNT_PATH
    ):
        return credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)

    # Option 3: Application Default Credentials (GCP environments)
    return credentials.ApplicationDefault()


# Initialize Firebase Admin SDK
_cred = _get_credentials()
_app = firebase_admin.initialize_app(_cred, {
    "projectId": settings.FIREBASE_PROJECT_ID,
    "storageBucket": f"{settings.FIREBASE_PROJECT_ID}.appspot.com",
})

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
