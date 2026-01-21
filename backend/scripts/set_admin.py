#!/usr/bin/env python3
"""One-time script to set a user as admin in Firestore."""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.firebase import db


def set_admin(email: str) -> bool:
    """Set isAdmin=True for user with given email."""

    # Find user by email
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email).limit(1)
    docs = list(query.stream())

    if not docs:
        print(f"User with email '{email}' not found in Firestore.")
        return False

    user_doc = docs[0]
    user_data = user_doc.to_dict()

    print(f"Found user: {user_data.get('displayName')} ({user_data.get('email')})")
    print(f"Current isAdmin: {user_data.get('isAdmin', False)}")

    # Update isAdmin field
    user_doc.reference.update({"isAdmin": True})

    print(f"Successfully set isAdmin=True for {email}")
    return True


if __name__ == "__main__":
    email = "gustavo.beltrami@patronos.org"

    if len(sys.argv) > 1:
        email = sys.argv[1]

    print(f"Setting admin for: {email}")
    set_admin(email)
