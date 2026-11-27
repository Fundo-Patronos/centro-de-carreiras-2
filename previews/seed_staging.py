#!/usr/bin/env python3
"""
Fill the preview project with fictional people, so a pull request's preview
has something to show.

    PREVIEW_PASSWORD=... python3 previews/seed_staging.py

Writes ONLY to `centro-carreiras-staging` — the project is a constant, not an
argument, and there is deliberately no way to point this at
`centro-carreiras-fire`. Every person here is invented and every address is
on `example.org`, a domain reserved so mail to it goes nowhere. Never copy a
real student or mentor into this project: a preview runs code nobody has
reviewed yet.

Idempotent: re-running resets these documents and passwords and leaves
anything else alone. Uses your own `gcloud` login (no key file); you need
owner or editor on the staging project. Standard library only.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

PROJECT = "centro-carreiras-staging"
FIRESTORE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
AUTH = f"https://identitytoolkit.googleapis.com/v1/projects/{PROJECT}"

NOW = datetime.now(timezone.utc).replace(microsecond=0)


def days_ago(n: int) -> datetime:
    return NOW - timedelta(days=n)


# People who can sign in: one per thing a reviewer wants to look at.
ACCOUNTS = [
    {
        "uid": "preview-estudante",
        "email": "estudante@example.org",
        "displayName": "Ana Souza (fictícia)",
        "role": "estudante",
        "status": "active",
        "isAdmin": False,
        "profile": {"course": "Engenharia de Computação", "graduationYear": 2027, "ra": "000001"},
    },
    {
        "uid": "preview-mentora",
        "email": "mentora@example.org",
        "displayName": "Beatriz Lima (fictícia)",
        "role": "mentor",
        "status": "active",
        "isAdmin": False,
        "profile": {"course": "Ciência da Computação"},
        "mentorProfile": {
            "title": "Engenheira de Dados",
            "company": "Empresa Exemplo",
            "bio": "Perfil fictício para prévias. Trabalho com dados há dez anos.",
            "tags": ["Dados", "Carreira em tecnologia"],
            "expertise": ["Engenharia de dados", "Entrevistas técnicas"],
            "course": "Ciência da Computação",
            "graduationYear": 2014,
            "isUnicampAlumni": True,
            "unicampDegreeLevel": "Graduação",
            "patronosRelation": "Mentora voluntária",
            "isActive": True,
            "isProfileComplete": True,
        },
    },
    {
        "uid": "preview-admin",
        "email": "admin@example.org",
        "displayName": "Carla Admin (fictícia)",
        "role": "estudante",
        "status": "active",
        "isAdmin": True,
        "profile": {"course": "Economia", "graduationYear": 2026},
    },
]

# Mentors with no login: they fill the list a student browses.
MENTORS = [
    ("preview-mentor-1", "Daniel Rocha (fictício)", "Gerente de Produto", "Startup Exemplo", ["Produto", "Empreendedorismo"], "https://cal.com/example"),
    ("preview-mentor-2", "Elisa Martins (fictícia)", "Pesquisadora", "Instituto Exemplo", ["Pesquisa", "Pós-graduação"], ""),
    ("preview-mentor-3", "Felipe Araújo (fictício)", "Analista Financeiro", "Banco Exemplo", ["Finanças", "Mercado financeiro"], ""),
    ("preview-mentor-4", "Gabriela Nunes (fictícia)", "Engenheira de Software", "Empresa Exemplo", ["Software", "Carreira internacional"], ""),
    ("preview-mentor-5", "Henrique Dias (fictício)", "Consultor", "Consultoria Exemplo", ["Consultoria", "Estratégia"], ""),
]

# Waiting for an admin, so the approvals screen is not empty.
PENDING = [
    ("preview-pendente-1", "Igor Pereira (fictício)", "mentor"),
    ("preview-pendente-2", "Júlia Costa (fictícia)", "estudante"),
]


def token() -> str:
    return subprocess.run(
        ["gcloud", "auth", "print-access-token"], check=True, capture_output=True, text=True
    ).stdout.strip()


def call(method: str, url: str, body: dict | None, bearer: str) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "Authorization": f"Bearer {bearer}",
            "x-goog-user-project": PROJECT,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read() or b"{}")
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")
        raise RuntimeError(f"{method} {url.split('?')[0]} -> {err.code}: {detail[:300]}") from None


def value(v):
    """A Python value as a Firestore REST `Value`."""
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if isinstance(v, datetime):
        return {"timestampValue": v.isoformat().replace("+00:00", "Z")}
    if isinstance(v, str):
        return {"stringValue": v}
    if isinstance(v, list):
        return {"arrayValue": {"values": [value(x) for x in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {k: value(x) for k, x in v.items()}}}
    raise TypeError(f"cannot store {type(v).__name__}")


def put(bearer: str, path: str, doc: dict) -> None:
    """Create or replace one document."""
    call("PATCH", f"{FIRESTORE}/{path}", {"fields": {k: value(x) for k, x in doc.items()}}, bearer)


def account(bearer: str, uid: str, email: str, name: str, password: str) -> None:
    """Create the sign-in, or reset its password if it already exists."""
    body = {"localId": uid, "email": email, "displayName": name, "password": password, "emailVerified": True}
    try:
        call("POST", f"{AUTH}/accounts", body, bearer)
    except RuntimeError as err:
        if "DUPLICATE_LOCAL_ID" not in str(err) and "EMAIL_EXISTS" not in str(err):
            raise
        call("POST", f"{AUTH}/accounts:update", body, bearer)


def user_doc(uid: str, email: str, name: str, role: str, status: str, **extra) -> dict:
    return {
        "uid": uid,
        "email": email,
        "displayName": name,
        "photoURL": None,
        "role": role,
        "status": status,
        "authProvider": "email",
        "emailNotifications": False,
        "language": "pt-BR",
        "isAdmin": False,
        "profile": {},
        "createdAt": days_ago(30),
        "updatedAt": days_ago(1),
        **extra,
    }


def main() -> int:
    password = os.environ.get("PREVIEW_PASSWORD", "")
    if len(password) < 10:
        print("Set PREVIEW_PASSWORD (10+ characters) — the password every fictional account gets.")
        return 2

    bearer = token()

    for a in ACCOUNTS:
        account(bearer, a["uid"], a["email"], a["displayName"], password)
        extra = {"profile": a["profile"], "isAdmin": a["isAdmin"]}
        if "mentorProfile" in a:
            extra["mentorProfile"] = a["mentorProfile"]
        put(bearer, f"users/{a['uid']}", user_doc(a["uid"], a["email"], a["displayName"], a["role"], a["status"], **extra))
        print(f"account  {a['email']}")

    for i, (uid, name, title, company, tags, link) in enumerate(MENTORS):
        email = f"{uid.removeprefix('preview-')}@example.org"
        put(bearer, f"users/{uid}", user_doc(
            uid, email, name, "mentor", "active",
            authProvider="imported",
            mentorProfile={
                "title": title,
                "company": company,
                "bio": f"Perfil fictício para prévias. {title} na {company}.",
                "tags": tags,
                "expertise": tags,
                "graduationYear": 2010 + i,
                "isUnicampAlumni": i % 2 == 0,
                "schedulingLink": link,
                "isActive": True,
                "isProfileComplete": True,
            },
        ))
        print(f"mentor   {name}")

    for uid, name, role in PENDING:
        email = f"{uid.removeprefix('preview-')}@example.org"
        put(bearer, f"users/{uid}", user_doc(uid, email, name, role, "pending", createdAt=days_ago(2)))
        print(f"pending  {name}")

    student = ACCOUNTS[0]
    sessions = [
        ("prvw0001", "preview-mentora", "Beatriz Lima (fictícia)", "mentora@example.org", "Empresa Exemplo", "pending", 1),
        ("prvw0002", "preview-mentor-1", "Daniel Rocha (fictício)", "mentor-1@example.org", "Startup Exemplo", "confirmed", 6),
        ("prvw0003", "preview-mentor-3", "Felipe Araújo (fictício)", "mentor-3@example.org", "Banco Exemplo", "completed", 20),
    ]
    for sid, mentor_id, mentor_name, mentor_email, company, status, age in sessions:
        put(bearer, f"sessions/{sid}", {
            "id": sid,
            "student_uid": student["uid"],
            "student_name": student["displayName"],
            "student_email": student["email"],
            "mentor_id": mentor_id,
            "mentor_name": mentor_name,
            "mentor_email": mentor_email,
            "mentor_company": company,
            "message": "Mensagem fictícia: gostaria de conversar sobre carreira.",
            "status": status,
            "booking_method": "email",
            "created_at": days_ago(age),
            "updated_at": days_ago(max(age - 1, 0)),
            "mentor_email_sent": False,
            "student_email_sent": False,
            "student_feedback_submitted": status == "completed",
            "mentor_feedback_submitted": False,
        })
        print(f"session  {sid} ({status})")

    print(f"\nDone. Sign in to any preview as estudante@, mentora@ or admin@example.org.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
