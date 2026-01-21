"""
Email domain-based approval system for user registration.

Auto-approve users with whitelisted domains, others require manual approval.
"""

from typing import Literal

# Approved domains by role
APPROVED_DOMAINS: dict[str, list[str]] = {
    "estudante": ["dac.unicamp.br", "patronos.org"],
    "mentor": ["patronos.org"],
}


def get_initial_status(email: str, role: str) -> Literal["active", "pending"]:
    """
    Determine the initial status for a new user based on email domain.

    Args:
        email: User's email address
        role: User's role ('estudante' or 'mentor')

    Returns:
        'active' if email domain is auto-approved, 'pending' otherwise
    """
    try:
        domain = email.split("@")[1].lower()
    except IndexError:
        return "pending"

    approved_domains = APPROVED_DOMAINS.get(role, [])
    return "active" if domain in approved_domains else "pending"


def is_auto_approved_domain(email: str, role: str) -> bool:
    """
    Check if an email domain is auto-approved for a given role.

    Args:
        email: User's email address
        role: User's role ('estudante' or 'mentor')

    Returns:
        True if domain is auto-approved, False otherwise
    """
    return get_initial_status(email, role) == "active"
