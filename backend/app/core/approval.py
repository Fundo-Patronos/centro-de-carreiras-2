"""
Email domain-based approval system for user registration.

Auto-approve users with whitelisted domains, others require manual approval.
Email/password signups from approved domains require email verification first.
"""

from typing import Literal

# Approved domains by role
APPROVED_DOMAINS: dict[str, list[str]] = {
    "estudante": ["dac.unicamp.br", "patronos.org"],
    "mentor": ["patronos.org"],
}


def get_initial_status(
    email: str, role: str, auth_provider: str
) -> Literal["active", "pending", "pending_verification"]:
    """
    Determine the initial status for a new user based on email domain and auth provider.

    Logic:
    - Google/magic_link + auto-approved domain → "active" (email already verified by provider)
    - Email/password + auto-approved domain → "pending_verification" (need to verify email)
    - Non-approved domain → "pending" (requires manual admin approval)

    Args:
        email: User's email address
        role: User's role ('estudante' or 'mentor')
        auth_provider: Authentication method ('email', 'google', 'magic_link')

    Returns:
        'active', 'pending_verification', or 'pending'
    """
    try:
        domain = email.split("@")[1].lower()
    except IndexError:
        return "pending"

    approved_domains = APPROVED_DOMAINS.get(role, [])

    if domain not in approved_domains:
        return "pending"

    # Auto-approved domain - check auth provider
    if auth_provider in ("google", "magic_link"):
        return "active"

    # Email/password signup needs email verification
    return "pending_verification"


def is_auto_approved_domain(email: str, role: str) -> bool:
    """
    Check if an email domain is auto-approved for a given role.

    Args:
        email: User's email address
        role: User's role ('estudante' or 'mentor')

    Returns:
        True if domain is auto-approved, False otherwise
    """
    try:
        domain = email.split("@")[1].lower()
    except IndexError:
        return False

    approved_domains = APPROVED_DOMAINS.get(role, [])
    return domain in approved_domains
