#!/usr/bin/env python3
"""
Import users from CSV to Firebase Auth + Firestore.

Migrates ~293 users from the previous Centro de Carreiras version.
Creates Firebase Auth users (without password), Firestore profiles,
and sends welcome emails with password reset links.

Usage:
    # Dry run (no changes)
    python scripts/import_users.py --dry-run --batch 1

    # Process batch 1 (users 1-80)
    python scripts/import_users.py --batch 1

    # Check status
    python scripts/import_users.py --status

    # Re-send emails only for a batch
    python scripts/import_users.py --batch 1 --email-only
"""

import argparse
import csv
import sys
import os
from datetime import datetime, timezone

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from firebase_admin import auth
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

from app.core.firebase import db
from app.core.email import email_service
from app.core.config import settings

# Batch configuration
BATCH_SIZE = 80

# CSV file path (relative to script)
CSV_FILE = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "Users - Produção-Grid view.csv"
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
    if not "/" in linkedin:
        return f"https://www.linkedin.com/in/{linkedin}"

    return linkedin


def parse_csv(csv_path: str) -> list[dict]:
    """Parse CSV file and return list of user dicts."""
    users = []

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip empty rows
            if not row.get("email"):
                continue

            # Only import verified students
            if row.get("role") != "STUDENT":
                continue
            if row.get("is_verified") != "checked":
                continue

            users.append({
                "email": row["email"].strip().lower(),
                "name": row["name"].strip(),
                "course": row.get("course", "").strip(),
                "graduation_year": row.get("graduation_year", "").strip(),
                "linkedin": normalize_linkedin(row.get("linkedin", "")),
            })

    return users


def get_batch_users(users: list[dict], batch_number: int) -> list[dict]:
    """Get users for a specific batch (1-indexed)."""
    start_idx = (batch_number - 1) * BATCH_SIZE
    end_idx = start_idx + BATCH_SIZE
    return users[start_idx:end_idx]


def get_import_status(email: str) -> dict | None:
    """Get import status for a user from Firestore."""
    doc_ref = db.collection("user_imports").document(email.replace("@", "_at_"))
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None


def update_import_status(email: str, data: dict):
    """Update import status for a user in Firestore."""
    doc_ref = db.collection("user_imports").document(email.replace("@", "_at_"))
    doc_ref.set(data, merge=True)


def create_firebase_auth_user(email: str, name: str, dry_run: bool = False) -> tuple[str | None, str | None]:
    """
    Create Firebase Auth user without password.

    Returns:
        Tuple of (uid, error_message)
    """
    if dry_run:
        print(f"  [DRY RUN] Would create Firebase Auth user: {email}")
        return "dry-run-uid", None

    try:
        # Check if user already exists
        try:
            existing_user = auth.get_user_by_email(email)
            print(f"  User already exists in Firebase Auth: {email} (uid: {existing_user.uid})")
            return existing_user.uid, None
        except auth.UserNotFoundError:
            pass

        # Create user without password (email_verified=True since they were verified before)
        user = auth.create_user(
            email=email,
            display_name=name,
            email_verified=True,
        )
        print(f"  Created Firebase Auth user: {email} (uid: {user.uid})")
        return user.uid, None

    except Exception as e:
        print(f"  ERROR creating Firebase Auth user {email}: {e}")
        return None, str(e)


def create_firestore_profile(
    uid: str,
    email: str,
    name: str,
    course: str,
    graduation_year: str,
    linkedin: str,
    dry_run: bool = False
) -> tuple[bool, str | None]:
    """
    Create Firestore user profile.

    Returns:
        Tuple of (success, error_message)
    """
    if dry_run:
        print(f"  [DRY RUN] Would create Firestore profile for: {email}")
        return True, None

    try:
        doc_ref = db.collection("users").document(uid)

        # Check if profile already exists
        if doc_ref.get().exists:
            print(f"  Firestore profile already exists for: {email}")
            return True, None

        # Create profile
        profile_data = {
            "email": email,
            "displayName": name,
            "role": "estudante",
            "status": "active",
            "authProvider": "imported",
            "emailNotifications": True,
            "language": "pt-BR",
            "profile": {
                "course": course,
                "graduationYear": graduation_year,
                "linkedIn": linkedin,
            },
            "createdAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        }

        doc_ref.set(profile_data)
        print(f"  Created Firestore profile for: {email}")
        return True, None

    except Exception as e:
        print(f"  ERROR creating Firestore profile for {email}: {e}")
        return False, str(e)


def generate_password_reset_link(email: str, dry_run: bool = False) -> tuple[str | None, str | None]:
    """
    Generate password reset link using Firebase Admin SDK.

    Returns:
        Tuple of (link, error_message)
    """
    if dry_run:
        print(f"  [DRY RUN] Would generate password reset link for: {email}")
        return "https://example.com/reset-dry-run", None

    try:
        # ActionCodeSettings to redirect to our custom domain
        action_code_settings = auth.ActionCodeSettings(
            url="https://centro.patronos.org/auth/action",
            handle_code_in_app=True,
        )

        # Generate password reset link with custom redirect
        link = auth.generate_password_reset_link(email, action_code_settings)
        print(f"  Generated password reset link for: {email}")
        return link, None

    except Exception as e:
        print(f"  ERROR generating password reset link for {email}: {e}")
        return None, str(e)


def send_welcome_email(email: str, name: str, reset_link: str, dry_run: bool = False) -> tuple[bool, str | None]:
    """
    Send welcome email with password setup link.

    Returns:
        Tuple of (success, error_message)
    """
    if dry_run:
        print(f"  [DRY RUN] Would send welcome email to: {email}")
        return True, None

    try:
        result = email_service.send_welcome_import_email(
            user_name=name,
            user_email=email,
            password_reset_url=reset_link,
        )

        if result["success"]:
            print(f"  Sent welcome email to: {email}")
            return True, None
        else:
            print(f"  ERROR sending welcome email to {email}: {result.get('error')}")
            return False, result.get("error")

    except Exception as e:
        print(f"  ERROR sending welcome email to {email}: {e}")
        return False, str(e)


def process_user(user: dict, batch_number: int, dry_run: bool = False, email_only: bool = False) -> bool:
    """
    Process a single user import.

    Returns:
        True if successful, False if any step failed
    """
    email = user["email"]
    name = user["name"]

    print(f"\nProcessing: {name} <{email}>")

    # Get existing status
    status = get_import_status(email) or {}

    # Initialize status if new
    if not status:
        status = {
            "email": email,
            "name": name,
            "batch_number": batch_number,
            "auth_created": False,
            "firestore_created": False,
            "email_sent": False,
            "reset_link": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    success = True

    # Step 1: Create Firebase Auth user (skip if email_only)
    if not email_only:
        if not status.get("auth_created"):
            uid, error = create_firebase_auth_user(email, name, dry_run)
            if uid:
                status["uid"] = uid
                status["auth_created"] = True
                status["error"] = None
            else:
                status["error"] = error
                success = False
        else:
            print(f"  Auth already created, skipping...")

    uid = status.get("uid")

    # Step 2: Create Firestore profile (skip if email_only)
    if not email_only and uid and uid != "dry-run-uid":
        if not status.get("firestore_created"):
            created, error = create_firestore_profile(
                uid=uid,
                email=email,
                name=name,
                course=user["course"],
                graduation_year=user["graduation_year"],
                linkedin=user["linkedin"],
                dry_run=dry_run,
            )
            if created:
                status["firestore_created"] = True
                status["error"] = None
            else:
                status["error"] = error
                success = False
        else:
            print(f"  Firestore profile already created, skipping...")

    # Step 3: Generate password reset link (if not already generated or if email_only needs fresh link)
    if uid and (not status.get("reset_link") or email_only):
        link, error = generate_password_reset_link(email, dry_run)
        if link:
            status["reset_link"] = link
            status["error"] = None
        else:
            status["error"] = error
            success = False

    # Step 4: Send welcome email
    if status.get("reset_link") and (not status.get("email_sent") or email_only):
        sent, error = send_welcome_email(
            email=email,
            name=name,
            reset_link=status["reset_link"],
            dry_run=dry_run,
        )
        if sent:
            status["email_sent"] = True
            status["email_sent_at"] = datetime.now(timezone.utc).isoformat()
            status["error"] = None
        else:
            status["error"] = error
            success = False
    elif status.get("email_sent") and not email_only:
        print(f"  Email already sent, skipping...")

    # Update status in Firestore
    if not dry_run:
        status["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_import_status(email, status)

    return success


def process_batch(batch_number: int, dry_run: bool = False, email_only: bool = False):
    """Process all users in a batch."""
    print(f"\n{'='*60}")
    print(f"Processing Batch {batch_number}")
    print(f"{'='*60}")

    # Parse CSV
    all_users = parse_csv(CSV_FILE)
    print(f"Total verified students in CSV: {len(all_users)}")

    # Get batch
    batch_users = get_batch_users(all_users, batch_number)

    if not batch_users:
        print(f"No users in batch {batch_number}")
        return

    start_idx = (batch_number - 1) * BATCH_SIZE + 1
    end_idx = start_idx + len(batch_users) - 1
    print(f"Batch {batch_number}: Users {start_idx}-{end_idx} ({len(batch_users)} users)")

    if dry_run:
        print("\n*** DRY RUN MODE - No changes will be made ***\n")

    if email_only:
        print("\n*** EMAIL ONLY MODE - Only sending emails ***\n")

    # Process each user
    success_count = 0
    error_count = 0

    for i, user in enumerate(batch_users, 1):
        print(f"\n[{i}/{len(batch_users)}]", end="")
        if process_user(user, batch_number, dry_run, email_only):
            success_count += 1
        else:
            error_count += 1

    # Summary
    print(f"\n\n{'='*60}")
    print(f"Batch {batch_number} Summary")
    print(f"{'='*60}")
    print(f"Processed: {len(batch_users)}")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")


def show_status():
    """Show import status summary."""
    print(f"\n{'='*60}")
    print("Import Status")
    print(f"{'='*60}")

    # Get all import records
    imports_ref = db.collection("user_imports")
    docs = imports_ref.stream()

    stats = {
        "total": 0,
        "auth_created": 0,
        "firestore_created": 0,
        "email_sent": 0,
        "errors": 0,
    }

    batch_stats = {}
    errors = []

    for doc in docs:
        data = doc.to_dict()
        stats["total"] += 1

        batch_num = data.get("batch_number", 0)
        if batch_num not in batch_stats:
            batch_stats[batch_num] = {"total": 0, "complete": 0, "errors": 0}
        batch_stats[batch_num]["total"] += 1

        if data.get("auth_created"):
            stats["auth_created"] += 1
        if data.get("firestore_created"):
            stats["firestore_created"] += 1
        if data.get("email_sent"):
            stats["email_sent"] += 1
            batch_stats[batch_num]["complete"] += 1
        if data.get("error"):
            stats["errors"] += 1
            batch_stats[batch_num]["errors"] += 1
            errors.append({
                "email": data.get("email"),
                "error": data.get("error"),
                "batch": batch_num,
            })

    print(f"\nTotal imported: {stats['total']}")
    print(f"Auth created: {stats['auth_created']}")
    print(f"Firestore created: {stats['firestore_created']}")
    print(f"Emails sent: {stats['email_sent']}")
    print(f"Errors: {stats['errors']}")

    if batch_stats:
        print(f"\nBy Batch:")
        for batch_num in sorted(batch_stats.keys()):
            bs = batch_stats[batch_num]
            print(f"  Batch {batch_num}: {bs['complete']}/{bs['total']} complete, {bs['errors']} errors")

    if errors:
        print(f"\nRecent Errors:")
        for err in errors[:10]:
            print(f"  - {err['email']} (batch {err['batch']}): {err['error']}")


def test_single_email(email: str, name: str, dry_run: bool = False):
    """Test the import flow with a single email."""
    print(f"\n{'='*60}")
    print(f"Testing Import Flow")
    print(f"{'='*60}")
    print(f"Email: {email}")
    print(f"Name: {name}")

    if dry_run:
        print("\n*** DRY RUN MODE - No changes will be made ***\n")

    test_user = {
        "email": email,
        "name": name,
        "course": "Test Course",
        "graduation_year": "2025",
        "linkedin": "",
    }

    success = process_user(test_user, batch_number=0, dry_run=dry_run, email_only=False)

    print(f"\n{'='*60}")
    print(f"Test {'PASSED' if success else 'FAILED'}")
    print(f"{'='*60}")

    if success and not dry_run:
        print("\nNext steps:")
        print("1. Check your email for the welcome message")
        print("2. Click the password reset link")
        print("3. Set a password and login to verify")


def main():
    parser = argparse.ArgumentParser(description="Import users from CSV to Firebase")
    parser.add_argument("--batch", type=int, help="Batch number to process (1-4)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without making them")
    parser.add_argument("--email-only", action="store_true", help="Only send emails (skip auth/firestore)")
    parser.add_argument("--status", action="store_true", help="Show import status")
    parser.add_argument("--test-email", type=str, help="Test with a single email address")
    parser.add_argument("--test-name", type=str, default="Test User", help="Name for test user")

    args = parser.parse_args()

    if args.status:
        show_status()
        return

    if args.test_email:
        test_single_email(args.test_email, args.test_name, args.dry_run)
        return

    if not args.batch:
        print("Error: --batch is required (unless using --status or --test-email)")
        print("Usage: python scripts/import_users.py --batch 1 [--dry-run] [--email-only]")
        print("       python scripts/import_users.py --test-email user@example.com --test-name 'John Doe'")
        sys.exit(1)

    if args.batch < 1 or args.batch > 4:
        print("Error: --batch must be between 1 and 4")
        sys.exit(1)

    process_batch(args.batch, args.dry_run, args.email_only)


if __name__ == "__main__":
    main()
