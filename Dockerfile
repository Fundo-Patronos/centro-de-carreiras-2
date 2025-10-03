# Build stage for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage - Python
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ ./backend

# Copy frontend build (to be served by backend if needed)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Environment
ENV ENVIRONMENT=production
ENV PORT=8080

EXPOSE 8080

# Start backend server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
