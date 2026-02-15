#!/usr/bin/env python3
"""
Script to migrate mentor photos from Airtable to Firebase Storage.

This script:
1. Fetches fresh photo URLs from Airtable (they expire after a few hours)
2. Downloads each photo
3. Uploads to Firebase Storage
4. Updates Firestore with the permanent Firebase Storage URL

Usage:
    python scripts/migrate_mentor_photos.py --dry-run    # Preview
    python scripts/migrate_mentor_photos.py              # Execute
"""

import sys
import os
import asyncio
import argparse
import uuid
import httpx
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load .env file BEFORE importing app modules
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from firebase_admin import storage
from app.core.firebase import db
from app.core.airtable import AirtableService

# Create fresh Airtable service instance with env vars loaded
airtable_service = AirtableService()
airtable_service.headers = {
    "Authorization": f"Bearer {os.environ.get('AIRTABLE_API_TOKEN', '')}",
    "Content-Type": "application/json",
}
airtable_service.base_id = os.environ.get('AIRTABLE_BASE_ID', '')


async def download_image(url: str) -> tuple[bytes, str]:
    """Download image from URL and return bytes and content type."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        content_type = response.headers.get('content-type', 'image/jpeg')
        return response.content, content_type


def upload_to_storage(image_bytes: bytes, content_type: str, user_id: str) -> str:
    """Upload image to Firebase Storage and return public URL."""
    # Determine file extension
    ext_map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
    }
    ext = ext_map.get(content_type, 'jpg')

    filename = f"{uuid.uuid4()}.{ext}"
    blob_path = f"mentor-photos/{user_id}/{filename}"

    bucket = storage.bucket()
    blob = bucket.blob(blob_path)
    blob.upload_from_string(image_bytes, content_type=content_type)
    blob.make_public()

    return blob.public_url


async def migrate_photos(dry_run: bool = True):
    """Migrate mentor photos from Airtable to Firebase Storage."""
    print("=" * 60)
    print("MENTOR PHOTO MIGRATION: Airtable -> Firebase Storage")
    print("=" * 60)
    print(f"Mode: {'DRY RUN (no changes will be made)' if dry_run else 'EXECUTE'}")
    print()

    # Fetch fresh data from Airtable
    print("Fetching mentors from Airtable...")
    airtable_mentors = await airtable_service.get_mentors()
    print(f"Found {len(airtable_mentors)} mentors in Airtable")
    print()

    # Build email -> photo URL mapping from Airtable
    airtable_photos = {}
    for mentor in airtable_mentors:
        email = mentor.get("email", "").lower().strip()
        photo_url = mentor.get("photoURL")
        if email and photo_url:
            airtable_photos[email] = photo_url

    print(f"Found {len(airtable_photos)} mentors with photos in Airtable")
    print()

    # Get all mentors from Firestore
    users_ref = db.collection("users")
    query = users_ref.where("role", "==", "mentor")

    migrated = 0
    skipped = 0
    errors = []

    for doc in query.stream():
        user_data = doc.to_dict()
        email = user_data.get("email", "").lower().strip()
        name = user_data.get("displayName", "Unknown")
        mentor_profile = user_data.get("mentorProfile", {}) or {}
        current_photo = mentor_profile.get("photoURL")

        # Check if photo is already a Firebase Storage URL
        if current_photo and "firebasestorage" in current_photo:
            print(f"SKIP: {name} - Already has Firebase Storage photo")
            skipped += 1
            continue

        # Check if we have a photo in Airtable
        airtable_photo_url = airtable_photos.get(email)
        if not airtable_photo_url:
            print(f"SKIP: {name} - No photo in Airtable")
            skipped += 1
            continue

        print(f"Processing: {name} ({email})")

        if dry_run:
            print(f"  Would download from: {airtable_photo_url[:60]}...")
            print(f"  Would upload to Firebase Storage")
            migrated += 1
            continue

        try:
            # Download image
            print(f"  Downloading...")
            image_bytes, content_type = await download_image(airtable_photo_url)
            print(f"  Downloaded {len(image_bytes)} bytes ({content_type})")

            # Upload to Firebase Storage
            print(f"  Uploading to Firebase Storage...")
            firebase_url = upload_to_storage(image_bytes, content_type, doc.id)
            print(f"  Uploaded: {firebase_url[:60]}...")

            # Update Firestore
            mentor_profile["photoURL"] = firebase_url
            doc.reference.update({
                "mentorProfile": mentor_profile,
                "updatedAt": datetime.utcnow(),
            })
            print(f"  Updated Firestore")

            migrated += 1

        except Exception as e:
            print(f"  ERROR: {str(e)}")
            errors.append({"name": name, "email": email, "error": str(e)})

        print()

    # Summary
    print("=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Migrated:  {migrated}")
    print(f"Skipped:   {skipped}")
    print(f"Errors:    {len(errors)}")
    print()

    if errors:
        print("ERRORS:")
        for err in errors:
            print(f"  - {err['name']} ({err['email']}): {err['error']}")
        print()

    if dry_run:
        print("This was a DRY RUN. No changes were made.")
        print("Run without --dry-run to execute the migration.")
    else:
        print("Migration complete!")


def main():
    parser = argparse.ArgumentParser(
        description="Migrate mentor photos from Airtable to Firebase Storage"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without executing",
    )
    args = parser.parse_args()

    asyncio.run(migrate_photos(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
