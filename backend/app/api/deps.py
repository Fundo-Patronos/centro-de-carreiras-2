"""FastAPI dependencies for authentication and authorization."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth

from ..core.firebase import verify_id_token, db
from ..models.user import UserInDB, UserProfile

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

    try:
        # Verify token with Firebase Admin
        decoded_token = verify_id_token(token)
        uid = decoded_token["uid"]
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erro de autenticação",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user profile from Firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuário não encontrado",
        )

    user_data = user_doc.to_dict()

    # Handle nested profile object
    profile_data = user_data.pop("profile", {})
    profile = UserProfile(**profile_data)

    # Remove uid from user_data if it exists (we pass it explicitly)
    user_data.pop("uid", None)

    user = UserInDB(uid=uid, profile=profile, **user_data)

    # Check user status - only active users can access protected endpoints
    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta está pendente de aprovação",
        )
    elif user.status == "pending_verification":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Por favor, verifique seu email",
        )
    elif user.status == "suspended":
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
