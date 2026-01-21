#!/bin/bash
set -e

# ============================================
# Centro de Carreiras - Cloud Run Deployment
# ============================================

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-southamerica-east1}"
BACKEND_SERVICE="centro-carreiras-api"
FRONTEND_SERVICE="centro-carreiras-web"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi

    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            print_error "No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi

    echo "  Project ID: $PROJECT_ID"
    echo "  Region: $REGION"
}

# Enable required APIs
enable_apis() {
    print_step "Enabling required GCP APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        secretmanager.googleapis.com \
        --project="$PROJECT_ID"
}

# Build and deploy backend
deploy_backend() {
    print_step "Building backend Docker image..."
    cd backend

    docker build -t "gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest" .

    print_step "Pushing backend image to Container Registry..."
    docker push "gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest"

    print_step "Deploying backend to Cloud Run..."

    # Check if secrets exist, otherwise prompt for env vars
    DEPLOY_ARGS=(
        "run" "deploy" "$BACKEND_SERVICE"
        "--image" "gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest"
        "--region" "$REGION"
        "--platform" "managed"
        "--allow-unauthenticated"
        "--memory" "512Mi"
        "--cpu" "1"
        "--min-instances" "0"
        "--max-instances" "10"
    )

    # Add environment variables from .env.production if it exists
    if [ -f ".env.production" ]; then
        print_step "Loading environment variables from .env.production..."
        ENV_VARS=""
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            [[ "$line" =~ ^#.*$ ]] && continue
            [[ -z "$line" ]] && continue
            if [ -n "$ENV_VARS" ]; then
                ENV_VARS="$ENV_VARS,$line"
            else
                ENV_VARS="$line"
            fi
        done < .env.production
        DEPLOY_ARGS+=("--set-env-vars" "$ENV_VARS")
    else
        print_warning ".env.production not found. You'll need to set environment variables manually."
    fi

    gcloud "${DEPLOY_ARGS[@]}"

    # Get backend URL
    BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --region="$REGION" --format='value(status.url)')
    echo -e "\n${GREEN}Backend deployed at:${NC} $BACKEND_URL"

    cd ..
    export BACKEND_URL
}

# Build and deploy frontend
deploy_frontend() {
    print_step "Building frontend Docker image..."
    cd frontend

    # Get backend URL if not set
    if [ -z "$BACKEND_URL" ]; then
        BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --region="$REGION" --format='value(status.url)' 2>/dev/null || echo "")
    fi

    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not found. Please deploy backend first or set BACKEND_URL."
        exit 1
    fi

    # Load Firebase config from .env.production
    if [ -f ".env.production" ]; then
        source .env.production
    fi

    docker build \
        --build-arg "VITE_API_URL=$BACKEND_URL/api/v1" \
        --build-arg "VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY:-}" \
        --build-arg "VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN:-}" \
        --build-arg "VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID:-}" \
        --build-arg "VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET:-}" \
        --build-arg "VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID:-}" \
        --build-arg "VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID:-}" \
        --build-arg "VITE_MIXPANEL_TOKEN=${VITE_MIXPANEL_TOKEN:-}" \
        -t "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest" .

    print_step "Pushing frontend image to Container Registry..."
    docker push "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest"

    print_step "Deploying frontend to Cloud Run..."
    gcloud run deploy "$FRONTEND_SERVICE" \
        --image "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated \
        --memory 256Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10

    FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --region="$REGION" --format='value(status.url)')
    echo -e "\n${GREEN}Frontend deployed at:${NC} $FRONTEND_URL"

    cd ..
    export FRONTEND_URL
}

# Update backend CORS with frontend URL
update_backend_cors() {
    print_step "Updating backend CORS configuration..."

    if [ -z "$FRONTEND_URL" ]; then
        FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --region="$REGION" --format='value(status.url)' 2>/dev/null || echo "")
    fi

    if [ -n "$FRONTEND_URL" ]; then
        gcloud run services update "$BACKEND_SERVICE" \
            --region "$REGION" \
            --update-env-vars "FRONTEND_URL=$FRONTEND_URL"
        echo "  CORS updated to allow: $FRONTEND_URL"
    fi
}

# Main deployment
main() {
    echo "============================================"
    echo " Centro de Carreiras - Cloud Run Deployment"
    echo "============================================"

    check_prerequisites

    case "${1:-all}" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            enable_apis
            deploy_backend
            deploy_frontend
            update_backend_cors
            ;;
        *)
            echo "Usage: $0 [backend|frontend|all]"
            exit 1
            ;;
    esac

    echo ""
    echo "============================================"
    echo -e "${GREEN}Deployment complete!${NC}"
    echo "============================================"
    echo ""
    echo "Services:"
    [ -n "$BACKEND_URL" ] && echo "  Backend API: $BACKEND_URL"
    [ -n "$FRONTEND_URL" ] && echo "  Frontend:    $FRONTEND_URL"
    echo ""
}

main "$@"
