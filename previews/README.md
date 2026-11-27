# Pull-request previews

Every pull request to `main` gets its own running copy of Centro de
Carreiras, built from the PR's latest commit, so a change can be seen before
it is merged:

```
https://pr-<number>---preview-web-mp4p4cay4a-rj.a.run.app
```

The check **`preview (centro-de-carreiras-v2)`** on the PR says when it is
ready (about five minutes after a push). Patronos Dev reads that check and
prints the link in its terminal.

## What a preview is, and is not

- **Separate project, fictional data.** Both services run in the GCP/Firebase
  project `centro-carreiras-staging`, with its own Firestore and its own
  Firebase Auth. Nothing there is a real student or mentor, and nothing a
  preview does reaches production (`centro-carreiras-fire`).
- **No production credentials.** A preview runs code nobody has reviewed yet,
  so it gets no service-account key, no Resend key and no Mixpanel token.
  It runs as `preview-api@centro-carreiras-staging`, which can read and write
  the staging Firestore, Auth and photo bucket and nothing else.
- **Sign in with email and password only**, using the fictional accounts:
  `estudante@example.org`, `mentora@example.org` (a mentor) and
  `admin@example.org` (an admin). The password is not in this public repo;
  Patronos Dev shows it next to the link, or ask a maintainer.
- **What does not work in a preview, on purpose:**
  - **Google sign-in and magic links.** Firebase only redirects to
    authorised domains, and every PR has a new one.
  - **Email.** No Resend key, so nothing is sent. Booking a session still
    works, and the backend logs that it skipped the message. A step that
    exists only to send an email reports a failure, such as "reenviar email"
    or verifying a new sign-up. Use the fictional accounts, which are
    already verified.
  - **Analytics.** Nothing goes to Mixpanel.
- A badge at the bottom of every page says it is a preview
  (`PreviewBadge.jsx`, shown only when the build sets `VITE_PREVIEW=1`).

## How it is built

The Cloud Build trigger `preview`, in project `centro-de-carreiras-v2`, runs
on every pull request to `main` as the service account
`ccc-preview-builder@centro-de-carreiras-v2`. That account's only
permissions are to push images to `centro-carreiras-staging` and deploy the
two preview services there. It cannot touch production.

The trigger carries an **inline copy** of [`cloudbuild.yaml`](cloudbuild.yaml)
rather than reading the file from the PR. Otherwise a PR could rewrite the
build that runs it. It also refuses PRs from forks: the repo is public, and
the trigger builds without waiting for a comment.

**Changing the build therefore takes two steps.** Merge the change to this
file, then re-apply it:

```bash
gcloud builds triggers update github preview \
  --project centro-de-carreiras-v2 \
  --inline-config previews/cloudbuild.yaml
```

Each PR leaves a tag (`pr-<number>`) on both services. The build keeps the
newest 30 and removes the rest, and images are deleted after 14 days.

## Fictional data

[`seed_staging.py`](seed_staging.py) creates the accounts, five more mentors,
two people waiting for approval and three sessions. It writes only to
`centro-carreiras-staging` (the project name is a constant, on purpose), and
re-running it resets those records:

```bash
PREVIEW_PASSWORD=... python3 previews/seed_staging.py
```

Never copy real people into the staging project, not even to reproduce a
bug. A preview runs unreviewed code against it.

Firestore rules and indexes are deployed to staging the same way as to
production, with `--project centro-carreiras-staging`:

```bash
firebase deploy --only firestore --project centro-carreiras-staging
```
