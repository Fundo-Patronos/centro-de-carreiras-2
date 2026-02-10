"""Mentors API endpoints."""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
from datetime import datetime
import uuid

from firebase_admin import storage

from ...core.firebase import db
from ...core.analytics import track_event, Events
from ...models.mentor import (
    MentorProfile,
    MentorProfileUpdate,
    MentorPublicResponse,
    MentorListResponse,
)
from ..deps import get_current_user


router = APIRouter(prefix="/mentors", tags=["mentors"])


def _check_profile_completeness(profile: dict) -> bool:
    """Check if mentor profile has all required fields filled."""
    required_fields = ["title", "company", "bio", "tags", "expertise"]
    for field in required_fields:
        value = profile.get(field)
        if not value:
            return False
        if isinstance(value, list) and len(value) == 0:
            return False
    return True


@router.get("/me")
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current mentor's own profile.
    Requires authentication and mentor role.
    """
    if current_user.role != "mentor":
        raise HTTPException(
            status_code=403,
            detail="Only mentors can access this endpoint",
        )

    # Track analytics
    track_event(
        user_id=current_user.uid,
        event_name=Events.MENTOR_PROFILE_VIEWED,
    )

    # Return mentor profile from user document
    mentor_profile = current_user.mentorProfile or MentorProfile()

    return {
        "uid": current_user.uid,
        "email": current_user.email,
        "displayName": current_user.displayName,
        "mentorProfile": mentor_profile.model_dump() if hasattr(mentor_profile, 'model_dump') else mentor_profile,
    }


@router.put("/me")
async def update_my_profile(
    update_data: MentorProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the current mentor's profile.
    Requires authentication and mentor role.
    """
    if current_user.role != "mentor":
        raise HTTPException(
            status_code=403,
            detail="Only mentors can access this endpoint",
        )

    # Get current mentor profile
    user_ref = db.collection("users").document(current_user.uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    current_profile = user_data.get("mentorProfile", {}) or {}

    # Merge updates (only non-None fields)
    update_dict = update_data.model_dump(exclude_none=True)
    merged_profile = {**current_profile, **update_dict}

    # Check profile completeness
    merged_profile["isProfileComplete"] = _check_profile_completeness(merged_profile)

    # Update Firestore
    user_ref.update({
        "mentorProfile": merged_profile,
        "updatedAt": datetime.utcnow(),
    })

    # Track analytics
    track_event(
        user_id=current_user.uid,
        event_name=Events.MENTOR_PROFILE_UPDATED,
        properties={
            "fields_updated": list(update_dict.keys()),
            "is_profile_complete": merged_profile["isProfileComplete"],
        },
    )

    return {
        "success": True,
        "mentorProfile": merged_profile,
    }


@router.post("/me/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a profile photo for the current mentor.
    Stores in Firebase Storage and updates Firestore.
    """
    if current_user.role != "mentor":
        raise HTTPException(
            status_code=403,
            detail="Only mentors can access this endpoint",
        )

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}",
        )

    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 5MB.",
        )

    try:
        # Generate unique filename
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        blob_path = f"mentor-photos/{current_user.uid}/{filename}"

        # Upload to Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(blob_path)
        blob.upload_from_string(
            contents,
            content_type=file.content_type,
        )

        # Make the blob publicly accessible
        blob.make_public()
        photo_url = blob.public_url

        # Update Firestore with new photo URL
        user_ref = db.collection("users").document(current_user.uid)
        user_doc = user_ref.get()
        current_profile = user_doc.to_dict().get("mentorProfile", {}) or {}

        current_profile["photoURL"] = photo_url
        current_profile["isProfileComplete"] = _check_profile_completeness(current_profile)

        user_ref.update({
            "mentorProfile": current_profile,
            "updatedAt": datetime.utcnow(),
        })

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.MENTOR_PHOTO_UPLOADED,
            properties={
                "file_size": len(contents),
                "file_type": file.content_type,
            },
        )

        return {
            "success": True,
            "photoURL": photo_url,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload photo: {str(e)}",
        )


@router.get("", response_model=MentorListResponse)
async def list_mentors(
    current_user: dict = Depends(get_current_user),
):
    """
    Get list of all active mentors from Firestore.
    Requires authentication.
    """
    try:
        # Query Firestore for active mentors
        users_ref = db.collection("users")
        query = users_ref.where("role", "==", "mentor").where("status", "==", "active")

        mentors = []
        for doc in query.stream():
            user_data = doc.to_dict()
            mentor_profile = user_data.get("mentorProfile", {}) or {}

            # Skip mentors who are not active or don't have a profile
            if not mentor_profile.get("isActive", True):
                continue

            mentors.append(MentorPublicResponse(
                id=doc.id,
                name=user_data.get("displayName", ""),
                title=mentor_profile.get("title", ""),
                company=mentor_profile.get("company", ""),
                bio=mentor_profile.get("bio", ""),
                photoURL=mentor_profile.get("photoURL"),
                tags=mentor_profile.get("tags", []),
                expertise=mentor_profile.get("expertise", []),
                linkedin=mentor_profile.get("linkedin", ""),
                course=mentor_profile.get("course", ""),
            ))

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.MENTORS_FETCHED,
            properties={"results_count": len(mentors)},
        )

        return MentorListResponse(
            mentors=mentors,
            total=len(mentors),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch mentors: {str(e)}",
        )


@router.get("/{mentor_id}", response_model=MentorPublicResponse)
async def get_mentor(
    mentor_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a single mentor by ID (Firestore user ID).
    Requires authentication.
    """
    try:
        user_ref = db.collection("users").document(mentor_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="Mentor not found")

        user_data = user_doc.to_dict()

        # Verify it's a mentor
        if user_data.get("role") != "mentor":
            raise HTTPException(status_code=404, detail="Mentor not found")

        mentor_profile = user_data.get("mentorProfile", {}) or {}

        # Track analytics
        track_event(
            user_id=current_user.uid,
            event_name=Events.MENTOR_DETAIL_FETCHED,
            properties={
                "mentor_id": mentor_id,
                "mentor_name": user_data.get("displayName"),
            },
        )

        return MentorPublicResponse(
            id=user_doc.id,
            name=user_data.get("displayName", ""),
            title=mentor_profile.get("title", ""),
            company=mentor_profile.get("company", ""),
            bio=mentor_profile.get("bio", ""),
            photoURL=mentor_profile.get("photoURL"),
            tags=mentor_profile.get("tags", []),
            expertise=mentor_profile.get("expertise", []),
            linkedin=mentor_profile.get("linkedin", ""),
            course=mentor_profile.get("course", ""),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch mentor: {str(e)}",
        )
