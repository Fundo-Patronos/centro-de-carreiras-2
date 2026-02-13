#!/usr/bin/env python3
"""
Migration script to import mentor data from Airtable to Firestore.

This script:
1. Fetches all mentors from Airtable
2. For each mentor, finds or creates a matching user in Firestore
3. Populates the mentorProfile field with Airtable data

Usage:
    python scripts/migrate_mentors.py --dry-run    # Preview changes
    python scripts/migrate_mentors.py              # Execute migration
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load .env file BEFORE importing app modules
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import asyncio
import argparse
from datetime import datetime

from app.core.firebase import db
from app.core.airtable import AirtableService

# Create fresh instance with env vars loaded, manually set headers
airtable_service = AirtableService()
airtable_service.headers = {
    "Authorization": f"Bearer {os.environ.get('AIRTABLE_API_TOKEN', '')}",
    "Content-Type": "application/json",
}
airtable_service.base_id = os.environ.get('AIRTABLE_BASE_ID', '')


async def migrate_mentors(dry_run: bool = True):
    """
    Migrate mentor data from Airtable to Firestore.

    Args:
        dry_run: If True, only preview changes without executing
    """
    print("=" * 60)
    print("MENTOR DATA MIGRATION: Airtable -> Firestore")
    print("=" * 60)
    print(f"Mode: {'DRY RUN (no changes will be made)' if dry_run else 'EXECUTE'}")
    print()

    # Fetch all mentors from Airtable
    print("Fetching mentors from Airtable...")
    airtable_mentors = await airtable_service.get_mentors()
    print(f"Found {len(airtable_mentors)} mentors in Airtable")
    print()

    # Stats
    matched = 0
    created = 0
    skipped = 0
    errors = []

    for mentor in airtable_mentors:
        email = mentor.get("email", "").lower().strip()
        name = mentor.get("name", "")

        if not email:
            print(f"  SKIP: '{name}' - No email address")
            skipped += 1
            continue

        print(f"Processing: {name} ({email})")

        # Build mentor profile data
        is_profile_complete = bool(
            mentor.get("title")
            and mentor.get("company")
            and mentor.get("bio")
            and mentor.get("tags")
            and mentor.get("expertise")
        )

        mentor_profile = {
            "title": mentor.get("title", ""),
            "company": mentor.get("company", ""),
            "bio": mentor.get("bio", ""),
            "linkedin": mentor.get("linkedin", ""),
            "tags": mentor.get("tags", []),
            "expertise": mentor.get("expertise", []),
            "course": mentor.get("course", ""),
            "graduationYear": None,
            "isUnicampAlumni": None,
            "unicampDegreeLevel": None,
            "alternativeUniversity": None,
            "patronosRelation": None,
            "photoURL": mentor.get("photoURL"),
            "isActive": is_profile_complete,  # Hidden by default if profile incomplete
            "isProfileComplete": is_profile_complete,
        }

        try:
            # Search for existing user by email
            users_ref = db.collection("users")
            query = users_ref.where("email", "==", email).limit(1)
            docs = list(query.stream())

            if docs:
                # Found existing user - update with mentor profile
                user_doc = docs[0]
                user_data = user_doc.to_dict()
                print(f"  MATCH: Found existing user (uid: {user_doc.id})")

                if not dry_run:
                    user_doc.reference.update({
                        "mentorProfile": mentor_profile,
                        "updatedAt": datetime.utcnow(),
                    })
                    print(f"  UPDATE: Added mentorProfile to user")

                matched += 1
            else:
                # No existing user - create new mentor user
                print(f"  CREATE: No existing user found, creating new mentor")

                new_user_data = {
                    "email": email,
                    "displayName": name,
                    "photoURL": mentor.get("photoURL"),
                    "role": "mentor",
                    "status": "active",
                    "authProvider": "email",
                    "profile": {
                        "phone": None,
                        "linkedIn": mentor.get("linkedin", ""),
                        "bio": mentor.get("bio", ""),
                        "course": mentor.get("course", ""),
                        "graduationYear": None,
                        "company": mentor.get("company", ""),
                        "position": mentor.get("title", ""),
                        "expertise": mentor.get("expertise", []),
                    },
                    "mentorProfile": mentor_profile,
                    "emailNotifications": True,
                    "language": "pt-BR",
                    "isAdmin": False,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }

                if not dry_run:
                    # Create user document with auto-generated ID
                    new_doc_ref = users_ref.document()
                    new_doc_ref.set(new_user_data)
                    print(f"  CREATED: New user with uid: {new_doc_ref.id}")

                created += 1

        except Exception as e:
            print(f"  ERROR: {str(e)}")
            errors.append({"mentor": name, "email": email, "error": str(e)})

        print()

    # Summary
    print("=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Total mentors in Airtable: {len(airtable_mentors)}")
    print(f"Matched existing users:    {matched}")
    print(f"Created new users:         {created}")
    print(f"Skipped (no email):        {skipped}")
    print(f"Errors:                    {len(errors)}")
    print()

    if errors:
        print("ERRORS:")
        for err in errors:
            print(f"  - {err['mentor']} ({err['email']}): {err['error']}")
        print()

    if dry_run:
        print("This was a DRY RUN. No changes were made.")
        print("Run without --dry-run to execute the migration.")
    else:
        print("Migration complete!")


def main():
    parser = argparse.ArgumentParser(
        description="Migrate mentor data from Airtable to Firestore"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without executing",
    )
    args = parser.parse_args()

    asyncio.run(migrate_mentors(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
