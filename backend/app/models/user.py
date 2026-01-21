"""User Pydantic models."""

from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class UserProfile(BaseModel):
    """User profile data (nested in user document)."""

    phone: Optional[str] = None
    linkedIn: Optional[str] = None
    bio: Optional[str] = None

    # Estudante-specific fields
    course: Optional[str] = None
    graduationYear: Optional[int] = None

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

    uid: str
    status: Literal["active", "pending", "suspended"] = "active"
    authProvider: Literal["email", "google", "magic_link"]
    profile: UserProfile = UserProfile()
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


class UserUpdate(BaseModel):
    """User data for update operations."""

    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    profile: Optional[UserProfile] = None
    emailNotifications: Optional[bool] = None
