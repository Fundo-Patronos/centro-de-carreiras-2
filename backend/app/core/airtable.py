"""Airtable service for fetching mentor data."""

import httpx
from typing import Optional
from .config import settings


class AirtableService:
    """Service for interacting with Airtable API."""

    BASE_URL = "https://api.airtable.com/v0"

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.AIRTABLE_API_TOKEN}",
            "Content-Type": "application/json",
        }
        self.base_id = settings.AIRTABLE_BASE_ID

    async def get_mentors(self, view: Optional[str] = None) -> list[dict]:
        """
        Fetch all mentors from Airtable.

        Args:
            view: Optional view name to filter records

        Returns:
            List of mentor records with transformed data
        """
        url = f"{self.BASE_URL}/{self.base_id}/{settings.AIRTABLE_MENTORS_TABLE}"
        params = {}
        if view:
            params["view"] = view

        all_records = []
        offset = None

        async with httpx.AsyncClient() as client:
            while True:
                if offset:
                    params["offset"] = offset

                response = await client.get(
                    url,
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()

                records = data.get("records", [])
                all_records.extend(records)

                # Check for pagination
                offset = data.get("offset")
                if not offset:
                    break

        # Transform records to our format
        return [self._transform_mentor(record) for record in all_records]

    async def get_mentor_by_id(self, record_id: str) -> Optional[dict]:
        """
        Fetch a single mentor by Airtable record ID.

        Args:
            record_id: Airtable record ID

        Returns:
            Mentor data or None if not found
        """
        url = f"{self.BASE_URL}/{self.base_id}/{settings.AIRTABLE_MENTORS_TABLE}/{record_id}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                timeout=30.0,
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            record = response.json()

        return self._transform_mentor(record)

    def _transform_mentor(self, record: dict) -> dict:
        """
        Transform Airtable record to our mentor format.

        Airtable field mapping:
        - Name -> name
        - Título -> title
        - Companhia -> company
        - Bio -> bio
        - Foto -> photoURL (attachment)
        - Tags -> tags
        - Pode ajudar com -> expertise
        - Linkedin -> linkedin
        - Curso -> course
        """
        fields = record.get("fields", {})

        # Extract photo URL from attachment field
        photo_attachments = fields.get("Foto", [])
        photo_url = None
        if photo_attachments and len(photo_attachments) > 0:
            photo_url = photo_attachments[0].get("url")

        # Handle tags - could be string or array
        tags = fields.get("Tags", [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        # Handle expertise - could be string or array
        expertise = fields.get("Pode ajudar com", [])
        if isinstance(expertise, str):
            expertise = [e.strip() for e in expertise.split(",") if e.strip()]

        return {
            "id": record.get("id"),
            "name": fields.get("Name", ""),
            "title": fields.get("Título", ""),
            "company": fields.get("Companhia", ""),
            "bio": fields.get("Bio", ""),
            "photoURL": photo_url,
            "tags": tags,
            "expertise": expertise,
            "linkedin": fields.get("Linkedin", ""),
            "course": fields.get("Curso", ""),
        }


# Singleton instance
airtable_service = AirtableService()
