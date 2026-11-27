#!/usr/bin/env bash
# Re-creates the Cloud Build trigger `preview` from previews/cloudbuild.yaml.
#
# Run this after merging a change to cloudbuild.yaml: the trigger carries an
# inline copy, so the file in the repo is not what runs until this does.
# `gcloud builds triggers update github --inline-config` is rejected with
# INVALID_ARGUMENT, so the trigger is deleted and created again under the
# same name, which keeps the check on pull requests named the same.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT=centro-de-carreiras-v2
BUILDER="ccc-preview-builder@${PROJECT}.iam.gserviceaccount.com"

gcloud builds triggers delete preview --project "$PROJECT" --quiet 2>/dev/null || true
gcloud builds triggers create github \
  --project "$PROJECT" \
  --name=preview \
  --description="PR previews into centro-carreiras-staging (inline config: previews/cloudbuild.yaml)" \
  --repo-owner=Fundo-Patronos \
  --repo-name=centro-de-carreiras-2 \
  --pull-request-pattern='^main$' \
  --comment-control=COMMENTS_DISABLED \
  --inline-config=previews/cloudbuild.yaml \
  --service-account="projects/${PROJECT}/serviceAccounts/${BUILDER}"
