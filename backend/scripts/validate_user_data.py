#!/usr/bin/env python3
"""
User Data Validation Script

Scans all Firestore user records and validates them against Pydantic models.
Reports any validation errors with details for debugging.

Usage:
    python scripts/validate_user_data.py              # Report only
    python scripts/validate_user_data.py --fix       # Auto-fix common issues
    python scripts/validate_user_data.py --email X   # Check specific user
"""

import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load .env file BEFORE importing app modules
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import firebase_admin
from firebase_admin import credentials, firestore
from pydantic import ValidationError

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(
        os.path.join(os.path.dirname(__file__), "..", "firebase-service-account.json")
    )
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Import models after Firebase is initialized
from app.models.user import UserInDB, UserProfile
from app.models.mentor import MentorProfile


def validate_user(doc_id: str, user_data: dict) -> tuple[bool, list[dict], dict]:
    """
    Validate a user document against Pydantic models.

    Returns:
        (is_valid, errors, fixes)
        - is_valid: True if validation passed
        - errors: List of error dictionaries
        - fixes: Dictionary of auto-fixable changes
    """
    errors = []
    fixes = {}

    # Make a copy to avoid modifying original
    data = user_data.copy()
    email = data.get("email", "unknown")

    # Extract nested objects
    profile_data = data.pop("profile", {}) or {}
    mentor_profile_data = data.get("mentorProfile", {}) or {}

    # Remove uid if present (we pass it separately)
    data.pop("uid", None)

    # Check for common fixable issues before validation

    # Fix 1: graduationYear as string instead of int
    if "graduationYear" in profile_data:
        grad_year = profile_data["graduationYear"]
        if isinstance(grad_year, str) and grad_year.isdigit():
            fixes["profile.graduationYear"] = {
                "old": grad_year,
                "new": int(grad_year),
                "reason": "Convert string to int",
            }

    # Fix 2: authProvider not in allowed list
    auth_provider = data.get("authProvider")
    allowed_providers = ["email", "google", "magic_link", "imported"]
    if auth_provider and auth_provider not in allowed_providers:
        errors.append({
            "field": "authProvider",
            "type": "invalid_value",
            "message": f"'{auth_provider}' not in {allowed_providers}",
            "value": auth_provider,
            "fixable": False,
        })

    # Fix 3: Missing required fields with sensible defaults
    if "emailNotifications" not in data:
        fixes["emailNotifications"] = {
            "old": None,
            "new": True,
            "reason": "Add missing field with default",
        }

    if "language" not in data:
        fixes["language"] = {
            "old": None,
            "new": "pt-BR",
            "reason": "Add missing field with default",
        }

    # Try to validate with Pydantic
    try:
        profile = UserProfile(**profile_data)
    except ValidationError as e:
        for err in e.errors():
            errors.append({
                "field": f"profile.{'.'.join(str(loc) for loc in err['loc'])}",
                "type": err["type"],
                "message": err["msg"],
                "value": str(err.get("input", ""))[:50],
                "fixable": False,
            })

    try:
        user = UserInDB(uid=doc_id, profile=UserProfile(), **data)
    except ValidationError as e:
        for err in e.errors():
            field = ".".join(str(loc) for loc in err["loc"])
            errors.append({
                "field": field,
                "type": err["type"],
                "message": err["msg"],
                "value": str(err.get("input", ""))[:50],
                "fixable": False,
            })

    # Validate mentor profile if present
    if mentor_profile_data and data.get("role") == "mentor":
        try:
            mentor_profile = MentorProfile(**mentor_profile_data)
        except ValidationError as e:
            for err in e.errors():
                errors.append({
                    "field": f"mentorProfile.{'.'.join(str(loc) for loc in err['loc'])}",
                    "type": err["type"],
                    "message": err["msg"],
                    "value": str(err.get("input", ""))[:50],
                    "fixable": False,
                })

    is_valid = len(errors) == 0
    return is_valid, errors, fixes


def apply_fixes(doc_ref, fixes: dict) -> bool:
    """Apply auto-fixes to a Firestore document."""
    if not fixes:
        return False

    update_data = {}
    for field_path, fix in fixes.items():
        # Handle nested fields like "profile.graduationYear"
        if "." in field_path:
            parts = field_path.split(".")
            if parts[0] == "profile":
                # Need to update the nested profile object
                doc = doc_ref.get()
                current_profile = doc.to_dict().get("profile", {}) or {}
                current_profile[parts[1]] = fix["new"]
                update_data["profile"] = current_profile
            elif parts[0] == "mentorProfile":
                doc = doc_ref.get()
                current_profile = doc.to_dict().get("mentorProfile", {}) or {}
                current_profile[parts[1]] = fix["new"]
                update_data["mentorProfile"] = current_profile
        else:
            update_data[field_path] = fix["new"]

    if update_data:
        update_data["updatedAt"] = datetime.utcnow()
        doc_ref.update(update_data)
        return True
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Validate Firestore user data against Pydantic models"
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Auto-fix common issues (like string-to-int conversion)",
    )
    parser.add_argument(
        "--email",
        type=str,
        help="Check a specific user by email",
    )
    parser.add_argument(
        "--role",
        type=str,
        choices=["estudante", "mentor"],
        help="Filter by role",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("USER DATA VALIDATION REPORT")
    print("=" * 70)
    print(f"Mode: {'FIX' if args.fix else 'REPORT ONLY'}")
    print(f"Filter: {args.email or args.role or 'All users'}")
    print()

    # Build query
    users_ref = db.collection("users")
    if args.email:
        query = users_ref.where("email", "==", args.email)
    elif args.role:
        query = users_ref.where("role", "==", args.role)
    else:
        query = users_ref

    # Process users
    total = 0
    valid = 0
    invalid = 0
    fixed = 0
    all_errors = []

    for doc in query.stream():
        total += 1
        user_data = doc.to_dict()
        email = user_data.get("email", "unknown")
        role = user_data.get("role", "unknown")

        is_valid, errors, fixes = validate_user(doc.id, user_data)

        if is_valid and not fixes:
            valid += 1
            continue

        # Report issues
        if errors:
            invalid += 1
            print(f"\n❌ INVALID: {email} ({role})")
            print(f"   UID: {doc.id}")
            for err in errors:
                print(f"   - {err['field']}: {err['message']}")
                print(f"     Type: {err['type']}, Value: {err['value']}")
                all_errors.append({
                    "email": email,
                    "uid": doc.id,
                    **err,
                })

        if fixes:
            print(f"\n🔧 FIXABLE: {email} ({role})")
            print(f"   UID: {doc.id}")
            for field, fix in fixes.items():
                print(f"   - {field}: {fix['old']} → {fix['new']} ({fix['reason']})")

            if args.fix:
                if apply_fixes(doc.reference, fixes):
                    fixed += 1
                    print(f"   ✅ Fixed!")

    # Summary
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total users scanned:  {total}")
    print(f"Valid:                {valid}")
    print(f"Invalid:              {invalid}")
    if args.fix:
        print(f"Fixed:                {fixed}")
    print()

    if all_errors:
        print("ERROR BREAKDOWN BY TYPE:")
        error_types = {}
        for err in all_errors:
            key = f"{err['field']} ({err['type']})"
            error_types[key] = error_types.get(key, 0) + 1
        for key, count in sorted(error_types.items(), key=lambda x: -x[1]):
            print(f"  {count}x {key}")

    if invalid > 0 and not args.fix:
        print()
        print("Run with --fix to auto-fix common issues.")


if __name__ == "__main__":
    main()
