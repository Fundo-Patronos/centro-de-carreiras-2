# Build stage for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy backend files
COPY --from=backend-build /app/backend ./backend

# Copy frontend build (to be served by backend if needed)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start backend server
CMD ["node", "backend/src/server.js"]
