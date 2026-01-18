"""Mentors API endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel

from ...core.airtable import airtable_service
from ..deps import get_current_user


class MentorResponse(BaseModel):
    """Mentor data response model."""
    id: str
    name: str
    title: str
    company: str
    bio: str
    photoURL: Optional[str] = None
    tags: list[str] = []
    expertise: list[str] = []
    linkedin: str = ""
    course: str = ""


class MentorListResponse(BaseModel):
    """Response model for mentor list."""
    mentors: list[MentorResponse]
    total: int


router = APIRouter(prefix="/mentors", tags=["mentors"])


@router.get("", response_model=MentorListResponse)
async def list_mentors(
    current_user: dict = Depends(get_current_user),
):
    """
    Get list of all mentors from Airtable.
    Requires authentication.
    """
    try:
        mentors = await airtable_service.get_mentors()
        return MentorListResponse(
            mentors=mentors,
            total=len(mentors),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch mentors: {str(e)}",
        )


@router.get("/{mentor_id}", response_model=MentorResponse)
async def get_mentor(
    mentor_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a single mentor by ID.
    Requires authentication.
    """
    try:
        mentor = await airtable_service.get_mentor_by_id(mentor_id)
        if not mentor:
            raise HTTPException(
                status_code=404,
                detail="Mentor not found",
            )
        return mentor
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch mentor: {str(e)}",
        )
