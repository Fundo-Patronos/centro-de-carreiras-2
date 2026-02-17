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

### Session 4 - 2026-02-05

**User Import Migration (IN PROGRESS)**

Migrating ~294 verified students from the previous Centro de Carreiras v1 (CSV export) to the new Firebase Auth + Firestore system. Users receive welcome emails with password setup links.

**Context:**
- Previous system stored users in a different database
- CSV export: `Users - Produção-Grid view.csv` (294 verified students)
- Resend email limit: 80/day → requires 4 batches over 4 days

#### Implementation Completed

**1. Import Script (`backend/scripts/import_users.py`)**

A standalone CLI script that:
- Parses the CSV file
- Creates Firebase Auth users (without password, `email_verified=True`)
- Creates Firestore user profiles with proper field mapping
- Generates password reset links via Firebase Admin SDK
- Sends welcome emails via Resend
- Tracks progress in Firestore `user_imports` collection (idempotent/resumable)

**CSV Field Mapping:**

| CSV Column | Firestore Field |
|------------|-----------------|
| `email` | `email` |
| `name` | `displayName` |
| `course` | `profile.course` |
| `graduation_year` | `profile.graduationYear` |
| `linkedin` | `profile.linkedIn` (normalized to full URL) |
| `role` (STUDENT) | `role` → "estudante" |

**Additional fields set automatically:**
- `status`: "active"
- `authProvider`: "imported"
- `emailNotifications`: true
- `language`: "pt-BR"

**Script Commands:**

```bash
cd backend
source venv/bin/activate

# Dry run (preview, no changes)
python scripts/import_users.py --dry-run --batch 1

# Process a batch (1-4)
python scripts/import_users.py --batch 1

# Check import status
python scripts/import_users.py --status

# Re-send emails only (skip auth/firestore creation)
python scripts/import_users.py --batch 1 --email-only

# Test with single email
python scripts/import_users.py --test-email "user@example.com" --test-name "Test User"
```

**2. Welcome Email Template (`backend/app/core/email.py`)**

Added `send_welcome_import_email()` method:
- **Subject:** "Bem-vindo ao Centro de Carreiras - Configure sua senha"
- **Content:** Explains platform update, lists new features, CTA button to set password
- **Styling:** Matches existing email templates (gradient header, clean design)

**3. Domain Configuration**

Migrated custom domains from old Cloud Run service to new frontend:

| Domain | Service | Region |
|--------|---------|--------|
| `centro.patronos.org` | centro-carreiras-web | us-east1 |
| `carreiras.patronos.org` | centro-carreiras-web | us-east1 |

**DNS Records (configured in Vercel):**
```
centro     CNAME  ghs.googlehosted.com.
carreiras  CNAME  ghs.googlehosted.com.
```

**Firebase Auth:** Both domains added to Authorized Domains.

**CAA Record (required for SSL):**
```
0 issue "pki.goog"
0 issue "letsencrypt.org"
```
Google Cloud Run uses `pki.goog` for certificates. Without this CAA record, SSL provisioning fails.

**4. CORS Configuration**

Updated `FRONTEND_URL` environment variable on `centro-carreiras-api` to include custom domains:
```
https://centro.patronos.org,https://carreiras.patronos.org,https://centro-carreiras-web-3qjayzhclq-ue.a.run.app
```

**5. Booking Message Template**

Simplified the default message template in `frontend/src/components/session/BookingModal.jsx`:
- Removed company-specific reference ("tirar algumas duvidas sobre a area de...")
- Streamlined career guidance text

**6. Admin Users**

Added admin privileges via `scripts/set_admin.py`:
- gabriel.aquino@patronos.org ✅

#### Current Status

| Task | Status |
|------|--------|
| Import script created | ✅ Done |
| Welcome email template | ✅ Done |
| Dry run batch 1 (80 users) | ✅ Done - 0 errors |
| Test email sent | ✅ Done (gustavo.beltrami@patronos.org) |
| Email content verified | ✅ Done |
| Domain mappings created | ✅ Done |
| SSL certificate provisioned | ✅ Done |
| CORS configured for custom domains | ✅ Done |
| Platform tested and working | ✅ Done |
| Batch 1 execution | ⏳ Pending |
| Batch 2 execution | ⏳ Pending |
| Batch 3 execution | ⏳ Pending |
| Batch 4 execution | ⏳ Pending |

#### Batch Schedule

| Batch | Users | Count | Status |
|-------|-------|-------|--------|
| 1 | 1-80 | 80 | Pending |
| 2 | 81-160 | 80 | Pending |
| 3 | 161-240 | 80 | Pending |
| 4 | 241-294 | 54 | Pending |

**Total:** 294 verified students

---

## NEXT STEPS (For Future Sessions)

### Step 1: Run Import Batches

Execute **one batch per day** (Resend 80 emails/day limit):

```bash
cd backend
source venv/bin/activate

# Ensure RESEND_API_KEY is in .env (or fetch from Secret Manager)
# Already configured in current .env

# Day 1 - Batch 1
python scripts/import_users.py --batch 1

# Day 2 - Batch 2
python scripts/import_users.py --batch 2

# Day 3 - Batch 3
python scripts/import_users.py --batch 3

# Day 4 - Batch 4
python scripts/import_users.py --batch 4
```

### Step 3: Monitor Progress

After each batch:

```bash
python scripts/import_users.py --status
```

**Also check Firebase Console:**
- **Authentication** → Users should appear
- **Firestore** → `users` collection for profiles
- **Firestore** → `user_imports` collection for tracking

### Step 4: Handle Any Failures

If emails fail to send for some users:

```bash
# Re-send emails for a specific batch (skips auth/firestore)
python scripts/import_users.py --batch 1 --email-only
```

The script is **idempotent** - tracks each step per user in `user_imports` collection.

### Step 5: Post-Import Verification

After all batches complete:
1. Run `--status` to confirm all 294 users processed
2. Test login with an imported user (use password reset link)
3. Verify Firestore profiles have correct data (course, graduation year, etc.)

---

## Firestore Collections (Updated)

| Collection | Purpose |
|------------|---------|
| `users` | User profiles (document ID = Firebase UID) |
| `feedback_requests` | Feedback email tracking |
| `session_feedback` | Submitted feedback responses |
| `user_imports` | **NEW** - Import tracking (document ID = email with @ → _at_) |

**`user_imports` document structure:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "uid": "firebase-uid",
  "auth_created": true,
  "firestore_created": true,
  "email_sent": true,
  "reset_link": "https://...",
  "error": null,
  "batch_number": 1,
  "created_at": "2026-02-05T...",
  "updated_at": "2026-02-05T..."
}
```

---

### Session 5 - 2026-02-06

**Major UI Refresh, Auth Flow Fixes, and CI/CD Automation**

This session focused on fixing authentication issues, implementing a new UI design, and setting up proper CI/CD automation.

#### 1. Authentication Flow Fixes

**Problem:** Magic links and password reset links were not working - users were redirected to the login page instead of being authenticated.

**Root Cause:** Firebase sends auth action emails to `/__/auth/action` which is handled by Firebase Hosting. Since we use Cloud Run (not Firebase Hosting), this path wasn't handled.

**Solution:** Created `FirebaseActionHandler.jsx` to intercept and route Firebase action URLs:

| Mode | Action |
|------|--------|
| `signIn` | Redirect to `/auth/verify` (magic link) |
| `resetPassword` | Redirect to `/auth/action` (password reset) |
| `verifyEmail` | Redirect to `/auth/verify-email` |

**Files Created:**

| File | Description |
|------|-------------|
| `frontend/src/pages/auth/FirebaseActionHandler.jsx` | Routes Firebase action URLs |
| `frontend/src/pages/auth/ResetPassword.jsx` | Password reset form |

**Files Modified:**

| File | Changes |
|------|---------|
| `frontend/src/App.jsx` | Added `/__/auth/action` route |
| `frontend/src/services/authService.js` | Added `sendPasswordReset()` method |
| `frontend/src/components/auth/LoginForm.jsx` | Added "Esqueceu a senha?" feature |
| `backend/scripts/import_users.py` | Updated to generate correct password reset URLs with `ActionCodeSettings` |

#### 2. UI Refresh - White Sidebar Design

Replaced the dark sidebar with a clean white design matching Patronos branding.

**Changes:**
- White background sidebar with light gray border
- Patronos logo + "Centro de Carreiras" text in header
- Orange accent color (`patronos-accent`) for active states
- Mobile responsive slide-out drawer with backdrop
- Top bar with user profile dropdown
- Role badges with colored backgrounds (blue for Estudante, green for Mentor)

**Files Modified:**

| File | Changes |
|------|---------|
| `frontend/src/components/layout/AppLayout.jsx` | Complete rewrite with new design |
| `frontend/index.html` | Updated title and favicon |

**Assets Added:**
- `frontend/public/patronos-logo.svg` - Logo for sidebar
- `frontend/public/patronos-favicon.svg` - Browser favicon

**Branding Updates:**
- Tab title: "Carreiras - Fundo Patronos"
- HTML lang: `pt-BR`
- Favicon: Patronos symbol

#### 3. CI/CD Pipeline Fixed

**Problem:** Cloud Build triggers were pointing to the wrong repository (`centro-de-carreiras` instead of `centro-de-carreiras-2`).

**Solution:**
1. Connected `centro-de-carreiras-2` repo to Cloud Build
2. Deleted old triggers
3. Created new triggers pointing to correct repo

**Triggers Created:**

| Trigger | Repository | Branch | Watches | Config |
|---------|------------|--------|---------|--------|
| `deploy-frontend` | `centro-de-carreiras-2` | `main` | `frontend/**` | `frontend/cloudbuild.yaml` |
| `deploy-backend` | `centro-de-carreiras-2` | `main` | `backend/**` | `backend/cloudbuild.yaml` |

**Backend cloudbuild.yaml Updated:**
- Now uses Cloud Run secrets instead of plain env vars
- Secrets: `firebase-service-account`, `airtable-api-token`, `airtable-base-id`, `resend-api-key`, `mixpanel-token`
- FRONTEND_URL includes all domains for CORS

#### 4. Analytics Documentation

Created comprehensive Mixpanel events documentation for the team.

**File Created:** `docs/MIXPANEL_EVENTS.md`

Contains:
- All 50+ tracked events organized by category
- Trigger descriptions for each event
- Properties sent with each event
- User identification details
- Implementation notes

#### 5. Batch 1 Import Completed

Successfully imported the first batch of 80 users from the v1 system.

**Status:**
- Batch 1: ✅ Completed (80 users, 0 errors)
- Batches 2-4: Pending (one per day due to Resend limit)

---

#### Files Changed Summary

| Category | Files |
|----------|-------|
| **New Files** | `FirebaseActionHandler.jsx`, `ResetPassword.jsx`, `patronos-logo.svg`, `patronos-favicon.svg`, `MIXPANEL_EVENTS.md` |
| **Frontend** | `App.jsx`, `AppLayout.jsx`, `LoginForm.jsx`, `authService.js`, `analytics.js`, `index.html` |
| **Backend** | `cloudbuild.yaml`, `import_users.py` |

#### Deployment

All changes deployed to production via CI/CD:
- Frontend: https://centro.patronos.org
- Backend: https://centro-carreiras-api-129179710207.southamerica-east1.run.app

---

### Session 6 - 2026-02-15

**Mentor Profile System & Improved Signup Flow**

This session focused on implementing a complete mentor profile management system, migrating data from Airtable to Firestore, and improving the mentor signup experience.

#### 1. Mentor Profile Feature ("Meu Perfil")

Created a full profile management page for mentors to view and edit their information.

**Backend Implementation:**

| File | Type | Description |
|------|------|-------------|
| `app/models/mentor.py` | NEW | MentorProfile, MentorProfileUpdate, MentorPublicResponse models |
| `app/api/v1/mentors.py` | REWRITE | Switched from Airtable to Firestore, added /me endpoints |
| `app/api/v1/admin.py` | EDIT | Added mentor visibility management endpoints |

**New API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mentors/me` | Get own mentor profile |
| PUT | `/mentors/me` | Update own mentor profile |
| POST | `/mentors/me/photo` | Upload profile photo to Firebase Storage |
| GET | `/admin/mentors` | List all mentors with admin controls |
| PATCH | `/admin/mentors/{uid}/visibility` | Toggle mentor visibility |

**Frontend Implementation:**

| File | Type | Description |
|------|------|-------------|
| `pages/mentor/MeuPerfil.jsx` | NEW | Profile editing page with 5 sections |
| `components/mentor/TagInput.jsx` | NEW | Multi-tag input with suggestions |
| `components/mentor/PhotoUpload.jsx` | NEW | Drag & drop photo upload |
| `pages/admin/MentorManagement.jsx` | NEW | Admin page for mentor visibility |
| `services/mentorService.js` | EDIT | Added profile management methods |
| `services/adminService.js` | EDIT | Added mentor admin methods |
| `components/layout/AppLayout.jsx` | EDIT | Added "Meu Perfil" to mentor nav |

**Profile Fields:**
- Basic: title, company, bio, linkedin, photoURL
- Career: tags (areas), expertise (what they help with)
- Education: course, graduationYear, isUnicampAlumni, unicampDegreeLevel
- Patronos: patronosRelation

#### 2. Data Migration (Airtable → Firestore)

Migrated all mentor data from Airtable to Firestore as single source of truth.

**Scripts Created:**

| Script | Purpose |
|--------|---------|
| `scripts/migrate_mentors.py` | Migrate mentor profiles to Firestore |
| `scripts/migrate_mentor_photos.py` | Download photos from Airtable, upload to Firebase Storage |

**Migration Results:**
- 25 mentors migrated (23 created, 2 updated)
- 25 photos migrated to Firebase Storage
- No production dependency on Airtable for mentor data

**Firebase Storage Configuration:**
- Bucket: `centro-carreiras-fire.firebasestorage.app`
- Path: `mentor-photos/{uid}/{filename}`
- CORS configured for production domains

#### 3. Mentor Visibility Controls

Implemented automatic and manual visibility controls.

**Automatic:**
- New mentors hidden by default (`isActive: false`)
- Auto-show when profile becomes complete
- Profile completeness requires: title, company, bio, tags, expertise

**Manual (Admin):**
- Admin panel at `/admin/mentors`
- Toggle visibility with confirmation
- Search/filter mentors

#### 4. Improved Mentor Signup Flow

Enhanced the signup form for better mentor onboarding.

**Two-Step Signup Process:**

| Step | Content |
|------|---------|
| Step 1 | Role selection only ("Estudante" or "Mentor") |
| Step 2 | Form fields based on selected role |

**New Mentor Fields at Signup:**
- Company (required)
- Title/Cargo (required)
- LinkedIn (optional)

**Data Flow:**
- Fields saved to both `profile` and `mentorProfile` objects
- `mentorProfile.isActive = false` until profile is complete
- `mentorProfile.isProfileComplete = false` initially

**Updated Approval Email:**
- Changed first action to "Completar seu perfil de mentor"
- Added orange callout box explaining profile completion requirement
- Message: "Para aparecer na lista de mentores e receber solicitacoes de estudantes, complete seu perfil com sua biografia, areas de expertise e foto."

#### Files Changed Summary

| Category | Files |
|----------|-------|
| **New Backend** | `models/mentor.py`, `scripts/migrate_mentors.py`, `scripts/migrate_mentor_photos.py` |
| **New Frontend** | `MeuPerfil.jsx`, `TagInput.jsx`, `PhotoUpload.jsx`, `MentorManagement.jsx` |
| **Modified Backend** | `mentors.py`, `admin.py`, `firebase.py`, `email.py`, `analytics.py` |
| **Modified Frontend** | `SignupForm.jsx`, `userService.js`, `mentorService.js`, `adminService.js`, `AppLayout.jsx` |

#### Key Technical Decisions

1. **Firestore over Airtable** for mentor profiles - single database, native Firebase integration
2. **Two-step signup** - less overwhelming, role-specific fields
3. **Auto-hide incomplete profiles** - ensures quality mentor directory
4. **Firebase Storage for photos** - permanent URLs, no expiration

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

### Session 7 - 2026-02-17

**CORS Fix & Signup UX Improvements**

This session fixed a critical CORS issue blocking the platform and added informational callouts to the signup flow.

#### 1. CORS Configuration Fix

**Problem:** Admin pages showing "Erro ao carregar mentores" with CORS errors. Requests from `https://carreiras.patronos.org` were being blocked.

**Root Cause:** The `FRONTEND_URL` environment variable on Cloud Run was only set to `https://centro.patronos.org`, missing the other allowed origins.

**Solution:** Updated Cloud Run service with all CORS origins:
```bash
gcloud run services update centro-carreiras-api \
  --region=southamerica-east1 \
  --set-env-vars='^@^FRONTEND_URL=https://centro.patronos.org,https://carreiras.patronos.org,https://centro-carreiras-web-3qjayzhclq-ue.a.run.app'
```

**Note:** The `cloudbuild.yaml` already had the correct substitution variable, but it wasn't being applied. Future deployments via CI/CD should maintain the correct configuration.

#### 2. Signup Flow Callouts

Added informational callouts to guide users during registration.

**Student Callout (blue):**
> **Dica:** Use seu email Unicamp (`@dac.unicamp.br`) para ter acesso imediato à plataforma. Cadastros com outros emails precisam ser aprovados pela equipe Patronos.

**Mentor Callout (amber):**
> **Importante:** Seu cadastro será revisado e aprovado pela equipe Patronos. Após a aprovação, você poderá completar seu perfil dentro da plataforma para ser exibido aos estudantes.

**Files Modified:**
- `frontend/src/components/auth/SignupForm.jsx` - Added role-specific callouts

#### Summary

| Task | Status |
|------|--------|
| CORS fix for carreiras.patronos.org | ✅ Done |
| Student signup callout (@dac.unicamp.br) | ✅ Done |
| Mentor signup callout (approval process) | ✅ Done |

---
