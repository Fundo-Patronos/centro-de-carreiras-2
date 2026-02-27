"""Mentor profile Pydantic models."""

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional


class MentorProfile(BaseModel):
    """Mentor profile data (nested in user document)."""

    model_config = ConfigDict(extra='ignore')

    title: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    tags: list[str] = []
    expertise: list[str] = []
    course: Optional[str] = None
    graduationYear: Optional[int] = None
    isUnicampAlumni: Optional[bool] = None
    unicampDegreeLevel: Optional[str] = None
    alternativeUniversity: Optional[str] = None
    patronosRelation: Optional[str] = None
    photoURL: Optional[str] = None
    isActive: bool = True
    isProfileComplete: bool = False


class MentorProfileUpdate(BaseModel):
    """Mentor profile update request - all fields optional for partial updates."""

    title: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    tags: Optional[list[str]] = None
    expertise: Optional[list[str]] = None
    course: Optional[str] = None
    graduationYear: Optional[int] = None
    isUnicampAlumni: Optional[bool] = None
    unicampDegreeLevel: Optional[str] = None
    alternativeUniversity: Optional[str] = None
    patronosRelation: Optional[str] = None
    photoURL: Optional[str] = None
    isActive: Optional[bool] = None


class MentorPublicResponse(BaseModel):
    """Mentor data visible to students when browsing mentors."""

    id: str
    name: str
    email: str = ""
    title: str = ""
    company: str = ""
    bio: str = ""
    photoURL: Optional[str] = None
    tags: list[str] = []
    expertise: list[str] = []
    linkedin: str = ""
    course: str = ""


class MentorListResponse(BaseModel):
    """Response model for mentor list."""

    mentors: list[MentorPublicResponse]
    total: int
