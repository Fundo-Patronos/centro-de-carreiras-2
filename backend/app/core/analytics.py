"""
Mixpanel Analytics Module for Centro de Carreiras API.

Provides server-side event tracking for API endpoints.
"""

import logging
from datetime import datetime
from typing import Any, Optional

from .config import settings

logger = logging.getLogger(__name__)

# Try to import mixpanel, gracefully handle if not available
try:
    from mixpanel import Mixpanel
    MIXPANEL_AVAILABLE = True
except ImportError:
    MIXPANEL_AVAILABLE = False
    logger.warning("Mixpanel package not installed. Analytics will be disabled.")


# Event name constants
class Events:
    # ============================================
    # AUTH API EVENTS
    # ============================================
    AUTH_VERIFIED = "API: Auth Verified"
    AUTH_LOGOUT = "API: User Logout"

    # ============================================
    # USER API EVENTS
    # ============================================
    USER_PROFILE_FETCHED = "API: User Profile Fetched"
    PROFILE_UPDATED = "API: Profile Updated"

    # ============================================
    # MENTOR API EVENTS
    # ============================================
    MENTORS_FETCHED = "API: Mentors Fetched"
    MENTOR_DETAIL_FETCHED = "API: Mentor Detail Fetched"
    MENTOR_PROFILE_VIEWED = "API: Mentor Profile Viewed"
    MENTOR_PROFILE_UPDATED = "API: Mentor Profile Updated"
    MENTOR_PHOTO_UPLOADED = "API: Mentor Photo Uploaded"

    # ============================================
    # SESSION API EVENTS
    # ============================================
    SESSION_REQUESTED = "API: Session Requested"
    SESSION_CREATED = "API: Session Created"
    SESSIONS_LISTED = "API: Sessions Listed"
    SESSION_DETAIL_FETCHED = "API: Session Detail Fetched"
    SESSION_STATUS_UPDATED = "API: Session Status Updated"
    SESSION_EMAIL_RESENT = "API: Session Email Resent"
    SESSION_FEEDBACK_SUBMITTED = "API: Session Feedback Submitted"

    # ============================================
    # EMAIL EVENTS
    # ============================================
    EMAIL_MENTOR_REQUEST_SENT = "API: Mentor Session Request Email Sent"
    EMAIL_MENTOR_REQUEST_FAILED = "API: Mentor Session Request Email Failed"
    EMAIL_STUDENT_CONFIRMATION_SENT = "API: Student Confirmation Email Sent"
    EMAIL_STUDENT_CONFIRMATION_FAILED = "API: Student Confirmation Email Failed"
    EMAIL_APPROVAL_CONFIRMATION_SENT = "API: Approval Confirmation Email Sent"
    EMAIL_APPROVAL_CONFIRMATION_FAILED = "API: Approval Confirmation Email Failed"

    # ============================================
    # ADMIN API EVENTS
    # ============================================
    ADMIN_PENDING_USERS_LISTED = "API: Pending Users Listed"
    ADMIN_USER_APPROVED = "API: User Approved"
    ADMIN_USER_REJECTED = "API: User Rejected"

    # ============================================
    # ERROR EVENTS
    # ============================================
    API_ERROR = "API: Error"
    SESSION_CREATION_FAILED = "API: Session Creation Failed"


# Initialize Mixpanel client
_mp: Optional[Any] = None

if MIXPANEL_AVAILABLE and settings.MIXPANEL_TOKEN:
    try:
        _mp = Mixpanel(settings.MIXPANEL_TOKEN)
        logger.info("Mixpanel analytics initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Mixpanel: {e}")
        _mp = None
else:
    if not settings.MIXPANEL_TOKEN:
        logger.warning("Mixpanel token not configured. Analytics will be disabled.")


def track_event(
    user_id: str,
    event_name: str,
    properties: Optional[dict] = None,
) -> None:
    """
    Track an event in Mixpanel.

    Args:
        user_id: The user's unique identifier (Firebase UID)
        event_name: Name of the event (use Events constants)
        properties: Additional event properties
    """
    if not _mp:
        return

    try:
        event_properties = {
            "timestamp": datetime.utcnow().isoformat(),
            "source": "api",
            **(properties or {}),
        }
        _mp.track(user_id, event_name, event_properties)
        logger.debug(f"Tracked event: {event_name} for user {user_id}")
    except Exception as e:
        # Don't let analytics errors affect API functionality
        logger.error(f"Failed to track event {event_name}: {e}")


def set_user_properties(
    user_id: str,
    properties: dict,
) -> None:
    """
    Set user profile properties in Mixpanel.

    Args:
        user_id: The user's unique identifier
        properties: User properties to set
    """
    if not _mp:
        return

    try:
        _mp.people_set(user_id, properties)
        logger.debug(f"Set user properties for {user_id}")
    except Exception as e:
        logger.error(f"Failed to set user properties: {e}")


# Convenience instance for importing
analytics = {
    "track": track_event,
    "set_user": set_user_properties,
    "Events": Events,
}
