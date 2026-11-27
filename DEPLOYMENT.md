# Centro de Carreiras: how it is deployed

## Production deploys itself on merge

Two Cloud Build triggers in project **`centro-de-carreiras-v2`** watch `main`:

| Trigger | Runs when a push to `main` touches | Build config | Deploys |
|---|---|---|---|
| `deploy-backend` | `backend/**` | `backend/cloudbuild.yaml` | Cloud Run `centro-carreiras-api` (southamerica-east1) |
| `deploy-frontend` | `frontend/**` | `frontend/cloudbuild.yaml` | Cloud Run `centro-carreiras-web` (us-east1) |

Merging is deploying: there is no manual step. Each trigger reports a check
on the merge commit, `deploy-backend (centro-de-carreiras-v2)` and
`deploy-frontend (centro-de-carreiras-v2)`. A check is **neutral** when the
commit did not touch that half, which means "nothing to deploy", not "still
running".

```
Users → centro.patronos.org → Cloud Run centro-carreiras-web (nginx + React SPA)
                                   │
                                   ▼
                              Cloud Run centro-carreiras-api (FastAPI)
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
     Firebase Auth + Firestore   Resend (email)   Mixpanel
     project centro-carreiras-fire
```

The backend's secrets come from Secret Manager in `centro-de-carreiras-v2`
(`firebase-service-account`, `resend-api-key`, `mixpanel-token`), wired in
`backend/cloudbuild.yaml`. The frontend's Firebase values are public client
identifiers, passed as build arguments by the trigger.

## Before the merge: a preview of every pull request

Each pull request gets its own copy of the app, running against a separate
project with fictional data. See [`previews/README.md`](previews/README.md).

## Firestore rules and indexes

`firestore.rules` and `firestore.indexes.json` are **not** deployed by Cloud
Build or anything else in this repo. They ship only when someone runs the
Firebase CLI by hand, so merging a change to either file leaves production
untouched until this runs:

```bash
npm i -g firebase-tools          # once
firebase login                   # once
firebase deploy --only firestore:rules      # rules
firebase deploy --only firestore:indexes    # indexes
```

The project is `centro-carreiras-fire`, set as the default in `.firebaserc`,
so `--project` is not needed from inside the repo. Deploy the same files to
the preview project too, with `--project centro-carreiras-staging`, or
previews will run against stale rules.

**Why this matters.** The rules are the only thing standing between a
signed-in user and fields the backend trusts. `isAdmin` on a user document
grants every endpoint behind `get_current_admin`. A rules change that is
merged but not deployed looks finished and is not. Deploy it in the same
sitting as the merge.

## Environment variables

### Backend

| Variable | Description |
|----------|-------------|
| `FRONTEND_URL` | Origins allowed by CORS, comma-separated |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON; without it the SDK uses the runtime's own identity |
| `RESEND_API_KEY` | Resend key; unset means no email is sent |
| `EMAIL_FROM_ADDRESS` | Sender address |
| `EMAIL_ADMIN_CC` / `EMAIL_ADMIN_BCC` | Copies of admin notifications |
| `MIXPANEL_TOKEN` | Mixpanel token; unset means no analytics |

### Frontend (build arguments)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL, ending in `/api/v1` |
| `VITE_FIREBASE_*` | Firebase web config (public identifiers) |
| `VITE_MIXPANEL_TOKEN` | Mixpanel token |
| `VITE_PREVIEW` | `1` only in pull-request previews |

## Troubleshooting

- **CORS errors:** `FRONTEND_URL` must contain the exact origin, with no
  trailing slash.
- **Firebase Auth errors:** the domain must be in Firebase Auth's authorised
  domains. This is why Google sign-in does not work in previews.
- **502/503:** check the Cloud Run logs for startup errors.
