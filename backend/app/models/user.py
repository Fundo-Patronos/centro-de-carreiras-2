"""User Pydantic models."""

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional, Literal, Union
from datetime import datetime

from .mentor import MentorProfile


class UserProfile(BaseModel):
    """User profile data (nested in user document)."""

    model_config = ConfigDict(extra='ignore')

    phone: Optional[str] = None
    linkedIn: Optional[str] = None
    bio: Optional[str] = None

    # Shared field (both estudante and mentor)
    course: Optional[str] = None

    # Estudante-specific fields
    graduationYear: Optional[Union[int, str]] = None

    @field_validator('graduationYear', mode='before')
    @classmethod
    def coerce_graduation_year(cls, v):
        """Convert string graduation year to int if possible."""
        if v is None:
            return None
        if isinstance(v, int):
            return v
        if isinstance(v, str) and v.isdigit():
            return int(v)
        return v  # Return as-is if can't convert

    # Mentor-specific fields
    company: Optional[str] = None
    position: Optional[str] = None
    expertise: list[str] = []


class UserBase(BaseModel):
    """Base user data."""

    email: EmailStr
    displayName: str
    photoURL: Optional[str] = None
    role: Literal["estudante", "mentor"]


class UserInDB(UserBase):
    """User data as stored in Firestore."""

    model_config = ConfigDict(extra='ignore')

    uid: str
    status: Literal["active", "pending", "pending_verification", "suspended"] = "active"
    authProvider: Literal["email", "google", "magic_link", "imported"]
    profile: UserProfile = UserProfile()
    mentorProfile: Optional[MentorProfile] = None  # Only for mentors
    emailNotifications: bool = True
    language: str = "pt-BR"
    isAdmin: bool = False  # Users can be estudante/mentor AND admin simultaneously
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    lastLoginAt: Optional[datetime] = None


class UserResponse(BaseModel):
    """User data returned in API responses."""

    uid: str
    email: EmailStr
    displayName: str
    photoURL: Optional[str] = None
    role: Literal["estudante", "mentor"]
    status: str
    isAdmin: bool = False
    profile: UserProfile
    mentorProfile: Optional[MentorProfile] = None


class UserUpdate(BaseModel):
    """User data for update operations."""

    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    profile: Optional[UserProfile] = None
    emailNotifications: Optional[bool] = None
