"""User endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud.firestore import SERVER_TIMESTAMP

from ..deps import get_current_user
from ...models.user import UserInDB, UserResponse, UserUpdate
from ...core.firebase import db
from ...core.analytics import track_event, Events

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserInDB = Depends(get_current_user),
):
    """Get current user's profile."""
    return UserResponse(
        uid=current_user.uid,
        email=current_user.email,
        displayName=current_user.displayName,
        photoURL=current_user.photoURL,
        role=current_user.role,
        status=current_user.status,
        profile=current_user.profile,
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    updates: UserUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    """Update current user's profile."""
    update_data = updates.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum campo para atualizar",
        )

    # Handle nested profile updates
    if "profile" in update_data and update_data["profile"]:
        profile_updates = update_data.pop("profile")
        # Merge with existing profile
        for key, value in profile_updates.items():
            if value is not None:
                update_data[f"profile.{key}"] = value

    # Add timestamp
    update_data["updatedAt"] = SERVER_TIMESTAMP

    # Update in Firestore
    user_ref = db.collection("users").document(current_user.uid)
    user_ref.update(update_data)

    # Fetch updated user
    updated_doc = user_ref.get()
    updated_data = updated_doc.to_dict()

    # Track analytics
    track_event(
        user_id=current_user.uid,
        event_name=Events.PROFILE_UPDATED,
        properties={
            "fields_updated": list(update_data.keys()),
        },
    )

    return UserResponse(
        uid=current_user.uid,
        email=updated_data.get("email", current_user.email),
        displayName=updated_data.get("displayName", current_user.displayName),
        photoURL=updated_data.get("photoURL"),
        role=updated_data.get("role", current_user.role),
        status=updated_data.get("status", "active"),
        profile=updated_data.get("profile", {}),
    )
