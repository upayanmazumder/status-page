# Status Page Platform

A production-grade SaaS status page platform built with microservices architecture.

## Architecture

### Services
| Service | Port | Description |
|---------|------|-------------|
| Gateway | 4000 | API Gateway with JWT validation, rate limiting, request proxying |
| Auth | 4001 | User registration, login, JWT token management |
| Monitor | 4002 | Health check execution (HTTP/TCP), check scheduling |
| Notify | 4003 | Email & webhook notifications, subscriber management |
| Dashboard | 4004 | Component CRUD, incident management, maintenance windows |
| Status | 4005 | Public status pages, real-time SSE, uptime metrics |

### Infrastructure
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI microservices with shared Python package
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 async
- **Cache**: Redis (caching, rate limiting, pub/sub)
- **Auth**: JWT tokens with refresh token rotation
- **Queue**: Redis-backed async tasks
- **K8s**: Self-hosted Kubernetes with Traefik ingress
- **GitOps**: ArgoCD for continuous deployment
- **CI/CD**: GitHub Actions building to GHCR
- **Frontend Hosting**: Vercel

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- Kubernetes cluster (for production)

### Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd status-page

# 2. Start all services locally
docker-compose up

# 3. Seed the database (in another terminal)
cd api/shared
alembic upgrade head

# 4. Start the frontend
cd app
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000
- Auth Service: http://localhost:4001
- MailHog (email testing): http://localhost:8025

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://statuspage:statuspage@localhost:5432/statuspage

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# SMTP (optional - for email notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Project Structure

```
status-page/
├── api/
│   ├── auth/           # Authentication service
│   ├── monitor/        # Health check service
│   ├── notify/         # Notification service
│   ├── dashboard/      # Component & incident management
│   ├── status/         # Public status pages
│   ├── gateway/        # API Gateway
│   └── shared/         # Shared Python package
│       ├── shared/     # Modules (config, db, jwt, errors, schemas)
│       ├── tests/      # Unit tests
│       └── alembic/    # Database migrations
├── app/                # Next.js frontend
│   ├── src/
│   │   ├── app/        # App Router pages
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom hooks
│   │   ├── lib/        # Utilities (API client)
│   │   └── stores/     # Zustand state stores
├── k8s/                # Kubernetes manifests
│   ├── base/           # Base Kustomize resources
│   └── overlays/       # Environment overlays
├── argocd/             # ArgoCD application manifests
└── .github/            # GitHub Actions workflows
```

## Database Migrations

```bash
cd api/shared

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Testing

### Backend
```bash
# Run shared package tests
cd api/shared
pytest

# Run service tests
cd api/auth
pytest
```

### Frontend
```bash
cd app
npm test
```

## Deployment

### Kubernetes (Production)

1. Install ArgoCD:
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. Apply ArgoCD applications:
```bash
kubectl apply -f argocd/
```

3. Configure secrets with Sealed Secrets:
```bash
# Install kubeseal CLI
# Encrypt your secret
kubeseal --format=yaml < k8s/base/secret.yaml > k8s/base/sealed-secret.yaml
```

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## API Endpoints

### Auth
- `POST /auth/register` - Register new user + org
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token

### Dashboard (Requires Auth)
- `POST /dashboard/components` - Create component
- `GET /dashboard/components?project_id=` - List components
- `PATCH /dashboard/components/:id` - Update component
- `DELETE /dashboard/components/:id` - Delete component
- `POST /dashboard/incidents` - Create incident
- `GET /dashboard/incidents?project_id=` - List incidents
- `PATCH /dashboard/incidents/:id` - Update incident

### Status (Public)
- `GET /status/:org_slug/:project_slug` - Public status page
- `GET /status/:org_slug/:project_slug/metrics` - Uptime metrics
- `GET /events/:org_slug/:project_slug` - SSE stream

## Features

### Implemented
- Multi-tenant architecture with org isolation
- JWT authentication with refresh tokens
- Component CRUD with soft delete
- Incident management with timeline updates
- Maintenance window scheduling
- Public status pages with auto-refresh
- Real-time SSE updates
- Redis caching (30s TTL for status pages)
- Rate limiting (100 req/min per IP)
- Health checks (HTTP/TCP)
- Email & webhook notifications
- Subscriber management with verification
- Pagination on all list endpoints
- Comprehensive error handling
- Structured logging with correlation IDs
- SQLAlchemy async ORM with connection pooling
- Alembic database migrations
- Docker multi-stage builds
- Kubernetes manifests with Kustomize
- ArgoCD GitOps deployment
- GitHub Actions CI/CD

### Roadmap
- [ ] Advanced RBAC with teams
- [ ] Component status history graphs
- [ ] API tokens for programmatic access
- [ ] Slack/Discord integrations
- [ ] Custom domains with SSL
- [ ] White-label branding
- [ ] Advanced analytics & reporting
- [ ] Multi-region check execution
- [ ] PagerDuty/Opsgenie integration
- [ ] Mobile app

## License

MIT
