"""FastAPI dependencies for authentication and authorization."""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from pydantic import ValidationError

from ..core.firebase import verify_id_token, db
from ..core.analytics import track_event, Events
from ..models.user import UserInDB, UserProfile

logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserInDB:
    """
    Verify Firebase ID token and return user with profile.

    Use as dependency:
        current_user: UserInDB = Depends(get_current_user)

    Raises:
        HTTPException 401: If token is invalid or expired.
        HTTPException 404: If user profile not found in Firestore.
    """
    token = credentials.credentials
    uid = None
    email = None

    # Phase 1: Token verification
    try:
        decoded_token = verify_id_token(token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
    except firebase_auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid token attempted: {str(e)}")
        track_event(
            user_id="anonymous",
            event_name=Events.AUTH_TOKEN_ERROR,
            properties={
                "error_type": "invalid_token",
                "error_message": str(e),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.ExpiredIdTokenError as e:
        logger.warning(f"Expired token attempted: {str(e)}")
        track_event(
            user_id="anonymous",
            event_name=Events.AUTH_TOKEN_ERROR,
            properties={
                "error_type": "expired_token",
                "error_message": str(e),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        track_event(
            user_id="anonymous",
            event_name=Events.AUTH_TOKEN_ERROR,
            properties={
                "error_type": "unknown",
                "error_message": str(e),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erro de autenticação",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Phase 2: Fetch user from Firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        logger.warning(f"User profile not found in Firestore: uid={uid}, email={email}")
        track_event(
            user_id=uid,
            event_name=Events.AUTH_USER_NOT_FOUND,
            properties={"email": email},
            email=email,
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuário não encontrado",
        )

    user_data = user_doc.to_dict()
    email = user_data.get("email", email)  # Update email from Firestore if available

    # Phase 3: Parse user data with Pydantic (with validation error handling)
    try:
        # Handle nested profile object
        profile_data = user_data.pop("profile", {}) or {}
        profile = UserProfile(**profile_data)

        # Remove uid from user_data if it exists (we pass it explicitly)
        user_data.pop("uid", None)

        user = UserInDB(uid=uid, profile=profile, **user_data)
    except ValidationError as e:
        # Log detailed validation errors for debugging
        error_details = []
        for error in e.errors():
            error_details.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "type": error["type"],
                "message": error["msg"],
                "input": str(error.get("input", ""))[:100],  # Truncate long values
            })

        logger.error(
            f"User data validation failed: uid={uid}, email={email}, errors={error_details}"
        )
        track_event(
            user_id=uid,
            event_name=Events.USER_VALIDATION_ERROR,
            properties={
                "email": email,
                "error_count": len(error_details),
                "errors": error_details,
                "raw_fields": list(user_data.keys()),
            },
            email=email,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro nos dados do usuário. Por favor, contate o suporte.",
        )

    # Phase 4: Check user status
    if user.status == "pending":
        track_event(
            user_id=uid,
            event_name=Events.AUTH_USER_STATUS_BLOCKED,
            properties={"status": "pending", "email": email},
            email=email,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta está pendente de aprovação",
        )
    elif user.status == "pending_verification":
        track_event(
            user_id=uid,
            event_name=Events.AUTH_USER_STATUS_BLOCKED,
            properties={"status": "pending_verification", "email": email},
            email=email,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Por favor, verifique seu email",
        )
    elif user.status == "suspended":
        track_event(
            user_id=uid,
            event_name=Events.AUTH_USER_STATUS_BLOCKED,
            properties={"status": "suspended", "email": email},
            email=email,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta foi suspensa",
        )

    return user


async def get_current_admin(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    Require admin privileges.

    Use as dependency:
        admin: UserInDB = Depends(get_current_admin)
    """
    if not current_user.isAdmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores",
        )
    return current_user


async def get_current_estudante(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    Require estudante role.

    Use as dependency:
        estudante: UserInDB = Depends(get_current_estudante)
    """
    if current_user.role != "estudante":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a estudantes",
        )
    return current_user


async def get_current_mentor(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    Require mentor role.

    Use as dependency:
        mentor: UserInDB = Depends(get_current_mentor)
    """
    if current_user.role != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a mentores",
        )
    return current_user
