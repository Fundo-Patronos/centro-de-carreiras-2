# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Centro de Carreiras da Unicamp v2.0 - Digital platform connecting Unicamp students with professional mentors. Built for Fundo Patronos (Unicamp's endowment fund).

## Development Commands

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                              # Development server
npm run build                            # Production build
npm run lint                             # ESLint
npm run test                             # Vitest (watch mode)
npm run test:run                         # Vitest (single run, all files)
npm run test:run -- path/to/file.test.js # Run a single test file
npm run test:coverage                    # Vitest with coverage report
```

### Backend (FastAPI + Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # Development server (port 8000)
python -m scripts.import_users         # Run a script (must use module form from backend/)
python -m scripts.set_admin            # Scripts import from `app.*`, so cwd matters
```

### Deployment

Merging to `main` deploys: Cloud Build triggers `deploy-backend` and
`deploy-frontend` (project `centro-de-carreiras-v2`) rebuild whichever half
the merge touched. There is no manual deploy step. See `DEPLOYMENT.md`.

**Every pull request gets a preview** — its own copy of the app at
`https://pr-<number>---preview-web-mp4p4cay4a-rj.a.run.app`, in the separate
project `centro-carreiras-staging` with fictional data and its own Firebase
Auth. See `previews/README.md`. Never point a preview at
`centro-carreiras-fire` or give it a production secret: it runs code nobody
has reviewed yet.

## Architecture

```
Users → Cloud Run (Frontend: nginx + React SPA)
             ↓
        Cloud Run (Backend: FastAPI)
             ↓
     ┌───────┴───────┐
     ↓               ↓
Firebase          Resend
Auth +            (Email)
Firestore
```

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7
- **Backend**: FastAPI, Firebase Admin SDK, Pydantic
- **Auth**: Firebase Authentication (email/password, Google, magic link)
- **Database**: Firestore (user profiles, sessions, feedback)
- **Analytics**: Mixpanel (frontend + backend)
- **Email**: Resend

### User Roles
- `estudante` - Unicamp students seeking mentorship
- `mentor` - Professionals offering career guidance

### Single Domain Policy
**Use `centro.patronos.org` only.** Traffic to `carreiras.patronos.org` is redirected via `main.jsx`.

## Key Files & Structure

```
frontend/
├── src/
│   ├── contexts/AuthContext.jsx    # Auth state, Firestore profile sync
│   ├── services/
│   │   ├── api.js                  # Axios instance with token interceptor
│   │   ├── analytics.js            # Mixpanel tracking (EVENTS constant)
│   │   └── *Service.js             # API service modules
│   ├── components/
│   │   ├── auth/                   # Login, Signup, RoleModal, etc.
│   │   ├── layout/AppLayout.jsx    # Sidebar navigation
│   │   └── session/                # SessionCard, BookingModal, etc.
│   └── pages/
│       ├── auth/                   # Public auth pages
│       ├── estudante/              # Student pages
│       ├── mentor/                 # Mentor pages
│       └── admin/                  # Admin panel pages

backend/
├── app/
│   ├── main.py                     # FastAPI app, CORS config
│   ├── api/
│   │   ├── deps.py                 # Auth dependencies (get_current_user, etc.)
│   │   └── v1/                     # API endpoints
│   │       ├── router.py           # Route registration
│   │       ├── auth.py             # /auth/* endpoints
│   │       ├── users.py            # /users/* endpoints
│   │       ├── mentors.py          # /mentors/* endpoints
│   │       ├── sessions.py         # /sessions/* endpoints
│   │       ├── admin.py            # /admin/* endpoints
│   │       └── feedback.py         # /feedback/* endpoints
│   ├── core/
│   │   ├── config.py               # Settings from env vars
│   │   ├── firebase.py             # Firebase Admin SDK init
│   │   ├── email.py                # Resend email templates
│   │   └── analytics.py            # Mixpanel backend tracking
│   └── models/                     # Pydantic models
└── scripts/
    ├── import_users.py             # Batch user import from CSV
    └── set_admin.py                # Grant admin privileges
```

## API Patterns

**Authentication**: Bearer token in Authorization header
```python
# Backend dependency
from ..api.deps import get_current_user, get_current_estudante, get_current_mentor
```

**API Base URL**: `/api/v1`
- Docs: `/api/docs`
- Health: `/health`

## Analytics Requirement

**All new features must include Mixpanel tracking.**

Frontend:
```javascript
import analytics, { EVENTS } from '../../services/analytics';
analytics.track(EVENTS.YOUR_EVENT, { property: 'value' });
```

Backend:
```python
from ...core.analytics import track_event, Events
track_event(user_id=current_user.uid, event_name=Events.YOUR_EVENT, properties={...})
```

The canonical event lexicon lives in `docs/MIXPANEL_EVENTS.md`. Reuse existing event names and property shapes from that file before defining new ones.

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles (doc ID = Firebase UID) |
| `sessions` | Mentorship session bookings |
| `feedback_requests` | Feedback email tracking |
| `session_feedback` | Submitted feedback responses |
| `user_imports` | Import tracking (for batch migrations) |

### Security rules constraints

`firestore.rules` enforces immutability of `role`, `uid`, and `email` on `users` document updates. When patching a user profile from the client, omit those fields from the payload — including them (even unchanged) will be rejected by the rule's `affectedKeys()` check. Server-side updates via Firebase Admin SDK bypass these rules.

## Design System

- **Gradient**: `linear-gradient(135deg, #ff9700, #ff6253, #fc4696, #c964e2)`
- **Accent**: `#c964e2` (purple)
- **Tailwind class**: `bg-patronos-gradient`
- **Font**: Inter

## Environment Variables

Backend secrets are stored in Google Cloud Secret Manager and mounted at deploy time. Local development uses `.env` files (see `.env.production.example`).

Key backend vars: `FRONTEND_URL`, `FIREBASE_PROJECT_ID`, `RESEND_API_KEY`, `MIXPANEL_TOKEN`

Key frontend vars: `VITE_API_URL`, `VITE_FIREBASE_*`, `VITE_MIXPANEL_TOKEN`, `VITE_PREVIEW` (previews only)

## Auto-Approval Rules

Users with `@dac.unicamp.br` or `@patronos.org` email domains are auto-approved. Others require manual admin approval.

## Student Signup Fields

Students are required to provide additional information at signup:
- **RA** (Registro Academico) - University ID, stored in `profile.ra`
- **WhatsApp** - Phone number, stored in `profile.phone`
- **Email alternativo** (optional) - Secondary email, stored in `profile.emailAlternativo`
