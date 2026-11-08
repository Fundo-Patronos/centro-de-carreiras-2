"""Mentors endpoints must tolerate missing/null optional profile fields."""

import asyncio
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.api.v1 import mentors

MISSING = object()


def _doc(doc_id, profile_overrides, remove=()):
    profile = {
        "title": "Eng",
        "company": "ACME",
        "bio": "Bio",
        "tags": ["a"],
        "expertise": ["b"],
        "course": "CC",
        "schedulingLink": "https://cal.example/x",
        "isActive": True,
    }
    profile.update(profile_overrides)
    for key in remove:
        profile.pop(key, None)
    doc = MagicMock()
    doc.id = doc_id
    doc.exists = True
    doc.to_dict.return_value = {
        "role": "mentor",
        "status": "active",
        "displayName": f"Mentor {doc_id}",
        "email": f"{doc_id}@example.com",
        "mentorProfile": profile,
    }
    return doc


@pytest.fixture(autouse=True)
def _patch(monkeypatch):
    monkeypatch.setattr(mentors, "track_event", lambda **kwargs: None)
    return monkeypatch


def _user():
    return SimpleNamespace(uid="student")


LINKEDIN_CASES = [
    pytest.param({}, ("linkedin",), id="absent"),
    pytest.param({"linkedin": ""}, (), id="empty"),
    pytest.param({"linkedin": None}, (), id="none"),
]

NULL_FIELDS = ["title", "company", "bio", "course", "schedulingLink", "tags", "expertise"]


@pytest.mark.parametrize("overrides,remove", LINKEDIN_CASES)
def test_list_mentors_linkedin_optional(_patch, overrides, remove):
    good = _doc("good", {"linkedin": "https://linkedin.com/in/x"})
    bad = _doc("bad", overrides, remove)
    db = MagicMock()
    db.collection.return_value.where.return_value.where.return_value.stream.return_value = [bad, good]
    _patch.setattr(mentors, "db", db)

    result = asyncio.run(mentors.list_mentors(current_user=_user()))

    assert result.total == 2
    by_id = {m.id: m for m in result.mentors}
    assert by_id["bad"].linkedin == ""
    assert by_id["good"].linkedin == "https://linkedin.com/in/x"


@pytest.mark.parametrize("overrides,remove", LINKEDIN_CASES)
def test_get_mentor_linkedin_optional(_patch, overrides, remove):
    db = MagicMock()
    db.collection.return_value.document.return_value.get.return_value = _doc("bad", overrides, remove)
    _patch.setattr(mentors, "db", db)

    result = asyncio.run(mentors.get_mentor("bad", current_user=_user()))

    assert result.linkedin == ""


@pytest.mark.parametrize("field", NULL_FIELDS)
def test_null_optional_fields_do_not_break_endpoints(_patch, field):
    bad = _doc("bad", {field: None})
    good = _doc("good", {})
    db = MagicMock()
    db.collection.return_value.where.return_value.where.return_value.stream.return_value = [bad, good]
    db.collection.return_value.document.return_value.get.return_value = bad
    _patch.setattr(mentors, "db", db)

    listed = asyncio.run(mentors.list_mentors(current_user=_user()))
    single = asyncio.run(mentors.get_mentor("bad", current_user=_user()))

    assert listed.total == 2
    assert getattr(single, field) in ("", [])


def test_profile_completeness_does_not_require_linkedin():
    profile = {"title": "t", "company": "c", "bio": "b", "tags": ["a"], "expertise": ["e"]}
    assert mentors._check_profile_completeness(profile) is True
