# ---------- Stage 1: Install frontend dependencies ----------
FROM node:23-alpine AS deps-app
WORKDIR /app

COPY app/package.json app/package-lock.json* ./
RUN npm ci

# ---------- Stage 2: Build the frontend ----------
FROM deps-app AS build-app
COPY app/ ./
RUN npm run build

# ---------- Stage 3: Install backend dependencies and build ----------
FROM node:23-alpine AS build-api
WORKDIR /api

COPY api/package.json api/package-lock.json* ./
RUN npm ci

# Copy backend source code
COPY api/ ./

# Build the TypeScript code
RUN npm run build

# ---------- Stage 4: Final runtime image ----------
FROM node:23-alpine AS runner

RUN apk add --no-cache tini && npm install -g pm2

WORKDIR /workspace

# Copy built frontend
COPY --from=build-app /app ./app

# Copy compiled backend and production dependencies
COPY --from=build-api /api/dist ./api/dist
COPY --from=build-api /api/node_modules ./api/node_modules
COPY --from=build-api /api/package.json ./api/package.json

# Add PM2 ecosystem config
COPY ecosystem.config.js ./

EXPOSE 3000 5000

ENTRYPOINT ["/sbin/tini", "--"]

# Run the compiled backend using PM2
CMD ["pm2-runtime", "ecosystem.config.js"]