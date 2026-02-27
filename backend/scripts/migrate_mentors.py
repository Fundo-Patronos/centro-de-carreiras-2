#!/usr/bin/env python3
"""
Migration script to import mentor data from CSV to Firebase.

This script:
1. Reads mentors from CSV file (exported from Airtable)
2. Creates Firebase Auth accounts (if not existing)
3. Creates/updates Firestore profiles with mentorProfile data
4. Generates password reset links
5. Sends welcome emails with password setup links

Usage:
    python scripts/migrate_mentors.py --dry-run    # Preview changes
    python scripts/migrate_mentors.py              # Execute migration
    python scripts/migrate_mentors.py --status     # Check migration status
    python scripts/migrate_mentors.py --email-only # Resend emails only
"""

import sys
import os
import csv
import re

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load .env file BEFORE importing app modules
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import argparse
from datetime import datetime, timezone

from firebase_admin import auth
from app.core.firebase import db
from app.core.email import email_service

# CSV file path (relative to script)
CSV_FILE = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "mentores_residentes_prod-Grid view.csv"
)


def normalize_linkedin(linkedin: str) -> str:
    """Normalize LinkedIn URL to full format."""
    if not linkedin:
        return ""

    linkedin = linkedin.strip()

    # Already a full URL
    if linkedin.startswith("http"):
        return linkedin

    # Handle linkedin.com/in/username format
    if linkedin.startswith("linkedin.com"):
        return f"https://www.{linkedin}"

    # Handle /in/username format
    if linkedin.startswith("/in/"):
        return f"https://www.linkedin.com{linkedin}"

    # Handle just username
    if "/" not in linkedin:
        return f"https://www.linkedin.com/in/{linkedin}"

    return linkedin


def extract_photo_url(photo_field: str) -> str | None:
    """Extract photo URL from Airtable attachment field format."""
    if not photo_field:
        return None

    # Format is usually "filename.jpg (https://...)"
    match = re.search(r'\(([^)]+)\)', photo_field)
    if match:
        return match.group(1)

    # If it's already a URL
    if photo_field.startswith("http"):
        return photo_field

    return None


def parse_csv(csv_path: str) -> list[dict]:
    """Parse CSV file and return list of mentor dicts."""
    mentors = []

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip mentors without email
            email = row.get("Email", "") or row.get("E-mail de contato", "")
            if not email:
                continue

            # Only import active mentors
            if row.get("Ativo") != "checked":
                continue

            # Handle tags - comma-separated
            tags = row.get("Tags", "")
            if tags:
                tags = [t.strip() for t in tags.split(",") if t.strip()]
            else:
                tags = []

            # Handle expertise - comma-separated
            expertise = row.get("Pode ajudar com", "")
            if expertise:
                expertise = [e.strip() for e in expertise.split(",") if e.strip()]
            else:
                expertise = []

            mentors.append({
                "email": email.strip().lower(),
                "name": row.get("Name", "").strip(),
                "company": row.get("Companhia", "").strip(),
                "title": row.get("Título", "").strip(),
                "course": row.get("Curso", "").strip(),
                "bio": row.get("Bio", "").strip(),
                "linkedin": normalize_linkedin(row.get("LinkedIn", "") or row.get("Linkedin URL", "")),
                "tags": tags,
                "expertise": expertise,
                "photoURL": extract_photo_url(row.get("Foto", "")),
            })

    return mentors


def get_import_status(email: str) -> dict | None:
    """Get import status for a mentor from Firestore."""
    doc_ref = db.collection("mentor_imports").document(email.replace("@", "_at_"))
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None


def update_import_status(email: str, data: dict):
    """Update import status for a mentor in Firestore."""
    doc_ref = db.collection("mentor_imports").document(email.replace("@", "_at_"))
    doc_ref.set(data, merge=True)


def create_firebase_auth_user(email: str, name: str, photo_url: str = None, dry_run: bool = False) -> tuple[str | None, bool, str | None]:
    """
    Create Firebase Auth user without password.

    Returns:
        Tuple of (uid, was_existing, error_message)
    """
    if dry_run:
        print(f"    [DRY RUN] Would create Firebase Auth user: {email}")
        return "dry-run-uid", False, None

    try:
        # Check if user already exists in Firebase Auth
        try:
            existing_user = auth.get_user_by_email(email)
            print(f"    Auth user already exists (uid: {existing_user.uid})")
            return existing_user.uid, True, None
        except auth.UserNotFoundError:
            pass

        # Create user without password (email_verified=True since they're imported)
        user_kwargs = {
            "email": email,
            "display_name": name,
            "email_verified": True,
        }
        if photo_url:
            user_kwargs["photo_url"] = photo_url

        user = auth.create_user(**user_kwargs)
        print(f"    Created Firebase Auth user (uid: {user.uid})")
        return user.uid, False, None

    except Exception as e:
        print(f"    ERROR creating Firebase Auth user: {e}")
        return None, False, str(e)


def generate_password_reset_link(email: str, dry_run: bool = False) -> tuple[str | None, str | None]:
    """
    Generate password reset link using Firebase Admin SDK.

    Returns:
        Tuple of (link, error_message)
    """
    if dry_run:
        print(f"    [DRY RUN] Would generate password reset link")
        return "https://example.com/reset-dry-run", None

    try:
        # ActionCodeSettings to redirect to our custom domain
        action_code_settings = auth.ActionCodeSettings(
            url="https://centro.patronos.org/auth/action",
            handle_code_in_app=True,
        )

        # Generate password reset link with custom redirect
        link = auth.generate_password_reset_link(email, action_code_settings)
        print(f"    Generated password reset link")
        return link, None

    except Exception as e:
        print(f"    ERROR generating password reset link: {e}")
        return None, str(e)


def send_welcome_email(
    email: str,
    name: str,
    reset_link: str,
    dry_run: bool = False,
    cc: list[str] = None,
    bcc: list[str] = None,
) -> tuple[bool, str | None]:
    """
    Send welcome email with password setup link.

    Returns:
        Tuple of (success, error_message)
    """
    if dry_run:
        print(f"    [DRY RUN] Would send welcome email")
        if cc:
            print(f"    [DRY RUN] CC: {', '.join(cc)}")
        if bcc:
            print(f"    [DRY RUN] BCC: {', '.join(bcc)}")
        return True, None

    try:
        result = email_service.send_welcome_import_email(
            user_name=name,
            user_email=email,
            password_reset_url=reset_link,
            cc=cc,
            bcc=bcc,
        )

        if result["success"]:
            print(f"    Sent welcome email")
            return True, None
        else:
            print(f"    ERROR sending welcome email: {result.get('error')}")
            return False, result.get("error")

    except Exception as e:
        print(f"    ERROR sending welcome email: {e}")
        return False, str(e)


def check_firebase_auth_exists(email: str) -> tuple[str | None, bool]:
    """
    Check if user exists in Firebase Auth.

    Returns:
        Tuple of (uid if exists, exists_bool)
    """
    try:
        existing_user = auth.get_user_by_email(email)
        return existing_user.uid, True
    except auth.UserNotFoundError:
        return None, False


def migrate_mentors(
    dry_run: bool = True,
    email_only: bool = False,
    skip_existing: bool = False,
    test_email: str = None,
    email_cc: list[str] = None,
    email_bcc: list[str] = None,
):
    """
    Migrate mentor data from CSV to Firebase.

    Args:
        dry_run: If True, only preview changes without executing
        email_only: If True, only send emails (skip auth/firestore creation)
        skip_existing: If True, skip users who already have Firebase Auth accounts
        test_email: If set, only process this single email (for testing)
        email_cc: List of CC recipients for welcome emails
        email_bcc: List of BCC recipients for welcome emails
    """
    print("=" * 60)
    print("MENTOR MIGRATION: CSV -> Firebase Auth + Firestore")
    print("=" * 60)
    print(f"Mode: {'DRY RUN (no changes will be made)' if dry_run else 'EXECUTE'}")
    if email_only:
        print("Email only mode: Only sending welcome emails")
    if skip_existing:
        print("Skip existing: Will skip users who already have Firebase Auth accounts")
    if test_email:
        print(f"Test mode: Only processing {test_email}")
    if email_cc:
        print(f"Email CC: {', '.join(email_cc)}")
    if email_bcc:
        print(f"Email BCC: {', '.join(email_bcc)}")
    print()

    # Parse CSV
    print(f"Reading mentors from: {CSV_FILE}")
    mentors = parse_csv(CSV_FILE)
    print(f"Found {len(mentors)} active mentors with email addresses")

    # Filter to single email if testing
    if test_email:
        mentors = [m for m in mentors if m["email"] == test_email.lower()]
        if not mentors:
            print(f"\nERROR: Test email '{test_email}' not found in CSV")
            return
        print(f"Filtered to 1 mentor for testing")

    print()

    # Stats
    stats = {
        "total": len(mentors),
        "auth_created": 0,
        "auth_existed": 0,
        "firestore_created": 0,
        "firestore_updated": 0,
        "emails_sent": 0,
        "skipped": 0,
        "errors": 0,
    }
    errors = []

    for i, mentor in enumerate(mentors, 1):
        email = mentor["email"]
        name = mentor["name"]

        print(f"[{i}/{len(mentors)}] {name} ({email})")

        # Check if user already exists in Firebase Auth (if skip_existing is enabled)
        if skip_existing and not dry_run:
            existing_uid, exists = check_firebase_auth_exists(email)
            if exists:
                print(f"    SKIPPED: User already exists in Firebase Auth (uid: {existing_uid})")
                stats["skipped"] += 1
                print()
                continue

        # Get existing import status
        status = get_import_status(email) or {
            "email": email,
            "name": name,
            "auth_created": False,
            "firestore_created": False,
            "email_sent": False,
            "uid": None,
            "reset_link": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

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
            "isActive": is_profile_complete,
            "isProfileComplete": is_profile_complete,
        }

        try:
            # Step 1: Create Firebase Auth user (skip if email_only)
            if not email_only:
                if not status.get("auth_created"):
                    uid, was_existing, error = create_firebase_auth_user(
                        email=email,
                        name=name,
                        photo_url=mentor.get("photoURL"),
                        dry_run=dry_run,
                    )
                    if uid:
                        status["uid"] = uid
                        status["auth_created"] = True
                        status["error"] = None
                        if was_existing:
                            stats["auth_existed"] += 1
                        else:
                            stats["auth_created"] += 1
                    else:
                        status["error"] = error
                        stats["errors"] += 1
                        errors.append({"mentor": name, "email": email, "error": error})
                        if not dry_run:
                            status["updated_at"] = datetime.now(timezone.utc).isoformat()
                            update_import_status(email, status)
                        print()
                        continue
                else:
                    print(f"    Auth already created, skipping...")
                    stats["auth_existed"] += 1

            uid = status.get("uid")

            # Step 2: Create/Update Firestore profile (skip if email_only)
            if not email_only and uid and uid != "dry-run-uid":
                users_ref = db.collection("users")

                # Check if user doc exists with this UID
                user_doc_ref = users_ref.document(uid)
                user_doc = user_doc_ref.get()

                if user_doc.exists:
                    # Update existing profile with mentorProfile
                    print(f"    Updating existing Firestore profile")
                    if not dry_run:
                        user_doc_ref.update({
                            "mentorProfile": mentor_profile,
                            "role": "mentor",
                            "updatedAt": datetime.utcnow(),
                        })
                    status["firestore_created"] = True
                    stats["firestore_updated"] += 1
                else:
                    # Create new Firestore profile
                    print(f"    Creating new Firestore profile")
                    new_user_data = {
                        "email": email,
                        "displayName": name,
                        "photoURL": mentor.get("photoURL"),
                        "role": "mentor",
                        "status": "active",
                        "authProvider": "imported",
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
                        user_doc_ref.set(new_user_data)
                    status["firestore_created"] = True
                    stats["firestore_created"] += 1

            # Step 3: Generate password reset link (if not already or if email_only needs fresh)
            if uid and (not status.get("reset_link") or email_only):
                link, error = generate_password_reset_link(email, dry_run)
                if link:
                    status["reset_link"] = link
                    status["error"] = None
                else:
                    status["error"] = error
                    stats["errors"] += 1
                    errors.append({"mentor": name, "email": email, "error": error})
                    if not dry_run:
                        status["updated_at"] = datetime.now(timezone.utc).isoformat()
                        update_import_status(email, status)
                    print()
                    continue

            # Step 4: Send welcome email
            if status.get("reset_link") and (not status.get("email_sent") or email_only):
                sent, error = send_welcome_email(
                    email=email,
                    name=name,
                    reset_link=status["reset_link"],
                    dry_run=dry_run,
                    cc=email_cc,
                    bcc=email_bcc,
                )
                if sent:
                    status["email_sent"] = True
                    status["email_sent_at"] = datetime.now(timezone.utc).isoformat()
                    status["error"] = None
                    stats["emails_sent"] += 1
                else:
                    status["error"] = error
                    stats["errors"] += 1
                    errors.append({"mentor": name, "email": email, "error": error})
            elif status.get("email_sent") and not email_only:
                print(f"    Email already sent, skipping...")

            # Update import status
            if not dry_run:
                status["updated_at"] = datetime.now(timezone.utc).isoformat()
                update_import_status(email, status)

        except Exception as e:
            print(f"    ERROR: {str(e)}")
            stats["errors"] += 1
            errors.append({"mentor": name, "email": email, "error": str(e)})

        print()

    # Summary
    print("=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Total active mentors in CSV: {stats['total']}")
    print(f"Skipped (already exist):     {stats['skipped']}")
    print(f"Auth accounts created:       {stats['auth_created']}")
    print(f"Auth accounts existed:       {stats['auth_existed']}")
    print(f"Firestore profiles created:  {stats['firestore_created']}")
    print(f"Firestore profiles updated:  {stats['firestore_updated']}")
    print(f"Welcome emails sent:         {stats['emails_sent']}")
    print(f"Errors:                      {stats['errors']}")
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


def show_status():
    """Show mentor import status summary."""
    print("=" * 60)
    print("Mentor Import Status")
    print("=" * 60)

    # Get all import records
    imports_ref = db.collection("mentor_imports")
    docs = imports_ref.stream()

    stats = {
        "total": 0,
        "auth_created": 0,
        "firestore_created": 0,
        "email_sent": 0,
        "errors": 0,
    }

    errors = []
    incomplete = []

    for doc in docs:
        data = doc.to_dict()
        stats["total"] += 1

        if data.get("auth_created"):
            stats["auth_created"] += 1
        if data.get("firestore_created"):
            stats["firestore_created"] += 1
        if data.get("email_sent"):
            stats["email_sent"] += 1
        if data.get("error"):
            stats["errors"] += 1
            errors.append({
                "email": data.get("email"),
                "name": data.get("name"),
                "error": data.get("error"),
            })

        # Track incomplete imports
        if not data.get("email_sent") and not data.get("error"):
            incomplete.append({
                "email": data.get("email"),
                "name": data.get("name"),
                "auth": data.get("auth_created"),
                "firestore": data.get("firestore_created"),
            })

    print(f"\nTotal tracked: {stats['total']}")
    print(f"Auth created: {stats['auth_created']}")
    print(f"Firestore created: {stats['firestore_created']}")
    print(f"Emails sent: {stats['email_sent']}")
    print(f"Errors: {stats['errors']}")

    if incomplete:
        print(f"\nIncomplete imports ({len(incomplete)}):")
        for item in incomplete[:10]:
            print(f"  - {item['name']} ({item['email']}): auth={item['auth']}, firestore={item['firestore']}")
        if len(incomplete) > 10:
            print(f"  ... and {len(incomplete) - 10} more")

    if errors:
        print(f"\nRecent Errors:")
        for err in errors[:10]:
            print(f"  - {err['name']} ({err['email']}): {err['error']}")


def main():
    parser = argparse.ArgumentParser(
        description="Migrate mentor data from CSV to Firebase"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without executing",
    )
    parser.add_argument(
        "--email-only",
        action="store_true",
        help="Only send welcome emails (skip auth/firestore creation)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip users who already have Firebase Auth accounts",
    )
    parser.add_argument(
        "--test-email",
        type=str,
        help="Only process this single email (for testing)",
    )
    parser.add_argument(
        "--cc",
        type=str,
        action="append",
        help="CC recipient for welcome emails (can be used multiple times)",
    )
    parser.add_argument(
        "--bcc",
        type=str,
        action="append",
        help="BCC recipient for welcome emails (can be used multiple times)",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Show import status",
    )
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    migrate_mentors(
        dry_run=args.dry_run,
        email_only=args.email_only,
        skip_existing=args.skip_existing,
        test_email=args.test_email,
        email_cc=args.cc,
        email_bcc=args.bcc,
    )


if __name__ == "__main__":
    main()
