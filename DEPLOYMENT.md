# Centro de Carreiras - GCP Cloud Run Deployment Guide

This guide covers deploying the Centro de Carreiras application to Google Cloud Run.

## Architecture

```
                    ┌─────────────────┐
                    │   Cloud Run     │
                    │   (Frontend)    │
   Users ──────────►│   nginx + SPA   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Cloud Run     │
                    │   (Backend)     │
                    │   FastAPI       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Firebase │  │ Airtable │  │  Resend  │
        │ Auth +   │  │  (Data)  │  │ (Email)  │
        │ Firestore│  └──────────┘  └──────────┘
        └──────────┘
```

## Prerequisites

1. **Google Cloud CLI** installed and authenticated
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Docker** installed and running

3. **Firebase Project** with:
   - Authentication enabled (Email/Password, Google)
   - Firestore database created
   - Service account key (for backend)

4. **Airtable** base with mentors table configured

## Quick Start

### 1. Configure Environment Variables

**Backend** (`backend/.env.production`):
```bash
cp backend/.env.production.example backend/.env.production
# Edit with your values
```

**Frontend** (`frontend/.env.production`):
```bash
cp frontend/.env.production.example frontend/.env.production
# Edit with your values
```

### 2. Deploy

```bash
# Deploy everything
./deploy.sh all

# Or deploy individually
./deploy.sh backend
./deploy.sh frontend
```

## Manual Deployment

### Backend Deployment

1. **Build the Docker image:**
   ```bash
   cd backend
   docker build -t gcr.io/YOUR_PROJECT_ID/centro-carreiras-api:latest .
   ```

2. **Push to Container Registry:**
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/centro-carreiras-api:latest
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy centro-carreiras-api \
     --image gcr.io/YOUR_PROJECT_ID/centro-carreiras-api:latest \
     --region southamerica-east1 \
     --platform managed \
     --allow-unauthenticated \
     --memory 512Mi \
     --set-env-vars "FRONTEND_URL=https://your-frontend-url.run.app" \
     --set-env-vars "FIREBASE_PROJECT_ID=your-project-id" \
     --set-env-vars "AIRTABLE_API_TOKEN=pat_xxx" \
     --set-env-vars "AIRTABLE_BASE_ID=appXXX"
   ```

### Frontend Deployment

1. **Build the Docker image:**
   ```bash
   cd frontend
   docker build \
     --build-arg VITE_API_URL=https://centro-carreiras-api-xxx.run.app/api/v1 \
     --build-arg VITE_FIREBASE_API_KEY=xxx \
     --build-arg VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com \
     --build-arg VITE_FIREBASE_PROJECT_ID=xxx \
     -t gcr.io/YOUR_PROJECT_ID/centro-carreiras-web:latest .
   ```

2. **Push to Container Registry:**
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/centro-carreiras-web:latest
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy centro-carreiras-web \
     --image gcr.io/YOUR_PROJECT_ID/centro-carreiras-web:latest \
     --region southamerica-east1 \
     --platform managed \
     --allow-unauthenticated \
     --memory 256Mi
   ```

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `FRONTEND_URL` | Yes | Frontend URL for CORS (comma-separated for multiple) |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes* | Service account JSON string |
| `AIRTABLE_API_TOKEN` | Yes | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID |
| `AIRTABLE_MENTORS_TABLE` | No | Table name (default: mentores_residentes_prod) |
| `MIXPANEL_TOKEN` | No | Mixpanel analytics token |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_FROM_ADDRESS` | No | Sender email address |
| `EMAIL_ADMIN_CC` | No | Admin CC email address |

*On GCP, you can use Application Default Credentials instead.

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_MIXPANEL_TOKEN` | No | Mixpanel analytics token |

## Using Secret Manager (Recommended for Production)

For sensitive values like API keys, use Google Cloud Secret Manager:

1. **Create secrets:**
   ```bash
   # Create secret
   echo -n "your-api-key" | gcloud secrets create AIRTABLE_API_TOKEN --data-file=-

   # For Firebase service account (JSON file)
   gcloud secrets create FIREBASE_SERVICE_ACCOUNT \
     --data-file=firebase-service-account.json
   ```

2. **Grant Cloud Run access:**
   ```bash
   gcloud secrets add-iam-policy-binding AIRTABLE_API_TOKEN \
     --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. **Use secrets in Cloud Run:**
   ```bash
   gcloud run deploy centro-carreiras-api \
     --set-secrets="AIRTABLE_API_TOKEN=AIRTABLE_API_TOKEN:latest"
   ```

## CI/CD with Cloud Build

The project includes a `cloudbuild.yaml` for automated deployments:

1. **Connect your repository** to Cloud Build in the GCP Console.

2. **Set substitution variables** in Cloud Build trigger:
   - `_FRONTEND_URL`: Frontend Cloud Run URL
   - `_BACKEND_URL`: Backend Cloud Run URL
   - `_FIREBASE_API_KEY`: Firebase API key
   - `_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
   - `_FIREBASE_PROJECT_ID`: Firebase project ID
   - etc.

3. **Trigger deployment** on push to main branch.

## Custom Domain (Optional)

1. **Map custom domain in Cloud Run:**
   ```bash
   gcloud run domain-mappings create \
     --service centro-carreiras-web \
     --domain carreiras.patronos.org \
     --region southamerica-east1
   ```

2. **Update DNS** with the provided records.

3. **Update CORS** in backend:
   ```bash
   gcloud run services update centro-carreiras-api \
     --update-env-vars "FRONTEND_URL=https://carreiras.patronos.org"
   ```

## Monitoring

- **Cloud Run Console**: View logs, metrics, and revisions
- **Cloud Logging**: Detailed application logs
- **Cloud Monitoring**: Set up alerts for errors/latency

## Costs

Cloud Run pricing (pay-per-use):
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: $0.40 per million requests

With min-instances=0, you only pay when the service is in use.

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in backend includes the exact frontend URL
- Check for trailing slashes

### Firebase Auth Errors
- Ensure the Cloud Run service URL is added to Firebase authorized domains
- Verify Firebase config variables in frontend

### 502/503 Errors
- Check Cloud Run logs for startup errors
- Verify all required environment variables are set
- Increase memory if needed

### Cold Start Latency
- Set `min-instances=1` for faster response times (increases cost)
