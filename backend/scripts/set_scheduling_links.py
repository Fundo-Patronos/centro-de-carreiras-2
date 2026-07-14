#!/usr/bin/env python3
"""One-time script to set mentorProfile.schedulingLink for specific mentors.

Matches mentors by displayName (normalized, case-insensitive). By default runs
in dry-run mode and only reports what it would do. Pass --apply to write.

Usage (from backend/):
    python -m scripts.set_scheduling_links           # dry-run
    python -m scripts.set_scheduling_links --apply    # write to Firestore
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.firebase import db

# Target mentors -> scheduling link.
# Keys are the exact (full) displayName of the active mentor profile. The user
# referred to them as Pedro Mota / Renata Junqueira / Mathias Strauss /
# Matheus Pires; resolved to the stored names below. Renata has a duplicate
# hidden account (isActive=False) — the link goes on the active profile only.
LINKS = {
    "Pedro Mota": "https://calendar.app.google/WECbPpvYDg1oyoDy7",
    "Renata Diniz Junqueira Santos": "https://calendar.app.google/hWPQFscuRaA2mgS86",
    "Mathias Strauss": "https://calendar.app.google/NWgFGjrXrNBhs3zo9",
    "Matheus Henrique Pires Gomes": "https://calendar.app.google/uDVdzQez1kiM8mzg9",
}


def _normalize(name: str) -> str:
    return " ".join((name or "").split()).strip().lower()


def main(apply: bool) -> None:
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"=== set_scheduling_links ({mode}) ===\n")

    # Load all mentors once
    mentors = []
    for doc in db.collection("users").where("role", "==", "mentor").stream():
        data = doc.to_dict()
        mentors.append((doc, data.get("displayName", ""), data))

    updated, skipped = 0, 0

    for target_name, link in LINKS.items():
        target_norm = _normalize(target_name)

        exact = [m for m in mentors if _normalize(m[1]) == target_norm]
        contains = [
            m for m in mentors
            if target_norm in _normalize(m[1]) and m not in exact
        ]
        candidates = exact if exact else contains

        if len(candidates) == 0:
            print(f"[SKIP] '{target_name}': no mentor found")
            skipped += 1
            continue
        if len(candidates) > 1:
            names = ", ".join(f"{m[1]} <{m[2].get('email')}>" for m in candidates)
            print(f"[SKIP] '{target_name}': ambiguous, {len(candidates)} matches -> {names}")
            skipped += 1
            continue

        doc, display_name, data = candidates[0]
        match_kind = "exact" if exact else "partial"
        current = (data.get("mentorProfile") or {}).get("schedulingLink")
        print(
            f"[OK]   '{target_name}' -> {display_name} <{data.get('email')}> "
            f"({match_kind} match)"
        )
        print(f"        current: {current!r}")
        print(f"        new:     {link!r}")

        if apply:
            doc.reference.update({"mentorProfile.schedulingLink": link})
            print("        >> updated")
        updated += 1
        print()

    print(f"\nSummary: {updated} to update, {skipped} skipped.")
    if not apply:
        print("Dry-run only. Re-run with --apply to write.")


if __name__ == "__main__":
    main(apply="--apply" in sys.argv)
