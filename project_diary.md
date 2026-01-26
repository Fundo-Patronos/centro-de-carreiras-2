# Centro de Carreiras v2.0 - Project Diary

## Project Overview

**Name:** Centro de Carreiras da Unicamp v2.0
**Organization:** Fundo Patronos (Unicamp's endowment fund)
**Goal:** Digital platform connecting Unicamp students with professional mentors

## Technical Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **UI Components:** Headless UI, Heroicons

### Backend
- **Framework:** FastAPI (Python)
- **Authentication:** Firebase Admin SDK
- **Database:** Firestore (for user profiles)
- **Data Source:** Airtable (for mentor directory - unchanged from v1)

### Authentication
- **Provider:** Firebase Authentication
- **Methods:**
  - Email/Password
  - Google OAuth
  - Magic Link (passwordless email)
- **Token:** Firebase ID tokens (Bearer)
- **Session:** Stateless (tokens verified on each request)

### Design System
- **Primary Gradient:** `linear-gradient(135deg, #ff9700, #ff6253, #fc4696, #c964e2)`
- **Accent Color:** `#c964e2` (purple)
- **Font:** Inter (Google Fonts)

## User Roles

| Role | Description |
|------|-------------|
| `estudante` | Unicamp students seeking mentorship |
| `mentor` | Professionals offering career guidance |

Users select their role during signup.

## Data Architecture

| Data | Storage | Reason |
|------|---------|--------|
| User auth & profiles | Firestore | Native Firebase integration |
| Mentor directory | Airtable | Non-technical team management |
| Mentor expertise/tags | Airtable | Same as above |

## Project Structure

```
centro-carreiras-v2.0/
├── frontend/
│   ├── src/
│   │   ├── config/firebase.js
│   │   ├── contexts/AuthContext.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── estudante/
│   │   │   └── mentor/
│   │   └── App.jsx
│   ├── .env
│   └── tailwind.config.js
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── firebase.py
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── v1/
│   │   ├── models/
│   │   └── main.py
│   ├── firebase-service-account.json
│   └── requirements.txt
├── firestore.rules
└── .gitignore
```

---

## Development Sessions

### Session 1 - 2026-01-17

**Initial Setup - Firebase Auth Migration**

Migrated from WorkOS AuthKit (v1) to Firebase Authentication.

**Decisions Made:**
1. Firebase Auth for authentication (supports email, Google, magic links)
2. Firestore for user profile storage
3. Airtable continues for mentor directory (non-technical team access)
4. Bearer tokens (Authorization header) instead of cookies
5. User selects role during signup (estudante/mentor)

**Frontend Implementation:**
- Created Vite + React project with Tailwind CSS
- Firebase SDK configuration
- AuthContext with auth state listener and Firestore profile sync
- Auth services: authService.js (all 3 auth methods), userService.js
- API service with token interceptor

**Auth Components Created (PT-BR):**
- `RoleSelector.jsx` - "Sou Estudante" / "Sou Mentor" selection
- `LoginForm.jsx` - Email/password login
- `SignupForm.jsx` - Email/password signup with role
- `GoogleButton.jsx` - Google OAuth with new user detection
- `MagicLinkForm.jsx` - Passwordless email flow
- `RoleModal.jsx` - Post-Google role selection for new users
- `AuthPage.jsx` - Combined auth page with all methods
- `VerifyEmail.jsx` - Magic link landing page

**Backend Implementation:**
- FastAPI project with Firebase Admin SDK
- Token verification dependency (get_current_user)
- Role-based access control (get_current_estudante, get_current_mentor)
- User endpoints (/users/me)
- Auth verification endpoint (/auth/verify)

**Protected Routes:**
- `ProtectedRoute.jsx` - Route guard with role checking
- Estudante dashboard (/estudante/dashboard)
- Mentor dashboard (/mentor/dashboard)

**Files Created:**
- Frontend: 15+ components and pages
- Backend: Complete FastAPI structure
- Config: .gitignore, firestore.rules, project_diary.md

**Firebase Project:**
- Project ID: `centro-carreiras-fire`
- Auth methods enabled: Email/Password, Google, Email Link
- Firestore database created

**Pending for Next Session:**
- Test the complete auth flow
- Deploy Firestore security rules
- Enable magic link in Firebase Console (if not done)
- Connect to Airtable for mentor browsing
- Build out mentor listing page
- Implement booking system

---

### Session 2 - 2026-01-19

**Mixpanel Analytics Implementation**

Implemented Mixpanel analytics on both frontend and backend to track user authentication, mentor browsing, and session booking events.

**Frontend Analytics:**
- Created `frontend/src/services/analytics.js` - Analytics service with `identify()`, `track()`, `reset()` functions
- Added `VITE_MIXPANEL_TOKEN` environment variable

**Events Tracked (Frontend):**

| Event | Component | Trigger |
|-------|-----------|---------|
| `Sign Up Started` | SignupForm | Form submit |
| `Sign Up Completed` | SignupForm, RoleModal | After profile creation |
| `Login Started` | LoginForm | Form submit |
| `Login Completed` | AuthContext | Auth state change with profile |
| `Google Auth Started` | GoogleButton | Button click |
| `Role Selected` | RoleModal | Form submit |
| `Magic Link Sent` | MagicLinkForm | After sendMagicLink |
| `Magic Link Verified` | VerifyEmail | After verification |
| `Logout` | Sidebar | Logout click |
| `Mentors Viewed` | MentorList | On page load/fetch success |
| `Mentor Search` | MentorList | Search input (debounced) |
| `Mentor Profile Viewed` | MentorList | handleMentorClick |
| `LinkedIn Clicked` | MentorDrawer | LinkedIn link click |
| `Book Session Clicked` | MentorDrawer | Agendar button click |

**Backend Analytics:**
- Created `backend/app/core/analytics.py` - Analytics module with `track_event()` function
- Added `MIXPANEL_TOKEN` to config.py and .env
- Added `mixpanel==4.10.1` to requirements.txt

**Events Tracked (Backend):**

| Event | Endpoint | Trigger |
|-------|----------|---------|
| `API: Mentors Fetched` | GET /mentors | list_mentors |
| `API: Mentor Detail Fetched` | GET /mentors/{id} | get_mentor |
| `API: Profile Updated` | PATCH /users/me | update_current_user_profile |

**User Identification:**
- Users are identified in Mixpanel on login via `analytics.identify(uid)`
- User properties set: email, role, authProvider, displayName
- Identity reset on logout via `analytics.reset()`

**Files Modified:**
- Frontend: AuthContext.jsx, LoginForm.jsx, SignupForm.jsx, GoogleButton.jsx, MagicLinkForm.jsx, RoleModal.jsx, VerifyEmail.jsx, MentorList.jsx, MentorDrawer.jsx, Sidebar.jsx
- Backend: config.py, mentors.py, users.py, requirements.txt

**Files Created:**
- `frontend/src/services/analytics.js`
- `backend/app/core/analytics.py`

---

## Development Guidelines

### Analytics Requirement

**All new features must include Mixpanel event tracking.**

When building new functionality:
1. Define meaningful events that capture user actions
2. Add events to `EVENTS` constant in `frontend/src/services/analytics.js`
3. Add events to `Events` class in `backend/app/core/analytics.py`
4. Include relevant properties (IDs, names, counts, etc.)
5. Track both user-initiated actions (frontend) and API calls (backend)

Example pattern:
```javascript
// Frontend
import analytics, { EVENTS } from '../../services/analytics';
analytics.track(EVENTS.YOUR_EVENT, { property: 'value' });
```

```python
# Backend
from ...core.analytics import track_event, Events
track_event(user_id=current_user.uid, event_name=Events.YOUR_EVENT, properties={...})
```

---

### Session 3 - 2026-01-25

**Post-Session Feedback Collection System**

Implemented a complete feedback system that collects feedback from both students and mentors 5 days after a mentorship session. The system includes automated email sending via Cloud Scheduler and a public form for responses.

**Features:**
- Automated feedback request emails 5 days after session creation
- Public feedback form (token-based, no login required)
- Admin dashboard to view all feedback and manually trigger emails
- Star rating system (1-5) for sessions that happened
- Reason collection for sessions that didn't happen

**Backend Implementation:**

| File | Type | Description |
|------|------|-------------|
| `app/models/feedback.py` | NEW | Pydantic models for feedback system |
| `app/core/email.py` | EDIT | Added student/mentor email templates |
| `app/api/v1/feedback.py` | NEW | Public endpoints for feedback submission |
| `app/api/v1/admin.py` | EDIT | Admin endpoints for feedback management |
| `app/api/v1/router.py` | EDIT | Registered feedback router |

**Frontend Implementation:**

| File | Type | Description |
|------|------|-------------|
| `services/feedbackService.js` | NEW | API service with lazy Firebase loading |
| `pages/public/FeedbackForm.jsx` | NEW | Public form (no auth) |
| `pages/admin/SessionFeedback.jsx` | NEW | Admin dashboard |
| `App.jsx` | EDIT | Routes outside AuthProvider |
| `components/layout/Sidebar.jsx` | EDIT | Admin nav item |

**Key Technical Decision:**
- `/feedback` route placed **outside** `<AuthProvider>` in App.jsx to avoid Firebase initialization
- `feedbackService.js` uses dynamic import (`import()`) to lazy-load Firebase API module
- This ensures public feedback forms work without requiring any Firebase credentials

**Firestore Collections:**
- `feedback_requests` - Tracks sent email requests with unique tokens
- `session_feedback` - Stores submitted feedback responses

**Cloud Scheduler Setup:**
- Job name: `feedback-requests-daily`
- Schedule: `0 9 * * *` (9am daily, America/Sao_Paulo timezone)
- Target: `POST https://centro-carreiras-api-3qjayzhclq-ue.a.run.app/api/v1/feedback/process-pending`
- Auth: OIDC token with service account `cloud-scheduler-invoker@centro-carreiras-fire.iam.gserviceaccount.com`

---

## Google Cloud Secret Manager

**All sensitive credentials are stored in Google Cloud Secret Manager.**

| Secret Name | Description |
|-------------|-------------|
| `airtable-api-token` | Airtable API token for mentor directory |
| `airtable-base-id` | Airtable base ID |
| `resend-api-key` | Resend API key for transactional emails |
| `mixpanel-token` | Mixpanel analytics token |

**Accessing Secrets:**

Cloud Run services reference secrets directly (not as env vars):
```bash
# View current secret bindings
gcloud run services describe centro-carreiras-api --region=us-east1 --format="yaml(spec.template.spec.containers[0].env)"
```

**Service Account with Access:**
- `129179710207-compute@developer.gserviceaccount.com` (Cloud Run default)

**Adding New Secrets:**
```bash
# Create secret
echo -n "secret-value" | gcloud secrets create secret-name --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding secret-name \
  --member="serviceAccount:129179710207-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Mount in Cloud Run
gcloud run services update centro-carreiras-api \
  --update-secrets="ENV_VAR_NAME=secret-name:latest"
```

---
