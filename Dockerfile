#######################################################################################################
# Dockerfile for Multi-Stage Build: Frontend & Backend Node.js Application
#
# This Dockerfile builds and packages a full-stack application consisting of:
#   - A frontend (React/Vue/Angular/etc.) located in the `app` directory
#   - A backend (Node.js/Express/etc.) located in the `api` directory
#
# Build Stages:
#   1. deps-app:    Installs frontend dependencies using npm ci for reproducible builds.
#   2. build-app:   Builds the frontend application for production.
#   3. deps-api:    Installs backend dependencies using npm ci for reproducible builds.
#   4. runner:      Prepares the final runtime image:
#                     - Installs tini (init system) for proper signal handling.
#                     - Installs PM2 globally for process management.
#                     - Copies built frontend and backend code with dependencies.
#                     - Adds PM2 ecosystem configuration.
#
# Ports:
#   - 3000: Typical frontend port (customize as needed)
#   - 5000: Typical backend port (customize as needed)
#
# Entrypoint:
#   Uses tini for signal handling and launches PM2 with the provided ecosystem config.
#
# Usage:
#   docker build -t your-app-name .
#   docker run -p 3000:3000 -p 5000:5000 your-app-name
#
# Note:
#   - Ensure `app` and `api` directories contain valid Node.js projects with lock files.
#   - Adjust ports and PM2 configuration as required for your environment.

#######################################################################################################

# ---------- Stage 1: Install frontend dependencies ----------
FROM node:23-alpine AS deps-app
WORKDIR /app

COPY app/package.json app/package-lock.json* ./
RUN npm ci

# ---------- Stage 2: Build the frontend ----------
FROM deps-app AS build-app
COPY app/ ./
RUN npm run build

# ---------- Stage 3: Install backend dependencies ----------
FROM node:23-alpine AS deps-api
WORKDIR /api

COPY api/package.json api/package-lock.json* ./
RUN npm ci

# Copy backend source code
COPY api/ ./

# ---------- Stage 4: Final runtime image ----------
FROM node:23-alpine AS runner

RUN apk add --no-cache tini && npm install -g pm2

WORKDIR /workspace

# Copy built frontend
COPY --from=build-app /app ./app
# Copy backend source and node_modules
COPY --from=deps-api /api ./api

# Add PM2 ecosystem config
COPY ecosystem.config.js ./

EXPOSE 3000 5000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["pm2-runtime", "ecosystem.config.js"]