# Status Page Platform - Microservices Architecture

## Architecture
- **Frontend**: Next.js (Vercel)
- **Gateway**: FastAPI (Traefik ingress)
- **Services**: Auth, Monitor, Notify, Dashboard, Status (FastAPI)
- **Database**: PostgreSQL (managed or self-hosted)
- **Cache/Queue**: Redis
- **K8s**: Self-hosted with Traefik ingress
- **GitOps**: ArgoCD
- **Secrets**: Sealed Secrets

## Services

### Gateway (`api/gateway/`)
- Entry point for all client requests
- Routes to downstream services
- JWT validation
- Rate limiting

### Auth (`api/auth/`)
- User authentication & authorization
- JWT token generation
- Org membership management

### Monitor (`api/monitor/`)
- Uptime check configuration
- Health check execution
- Check history recording

### Notify (`api/notify/`)
- Email notifications
- Webhook delivery
- Subscriber management

### Dashboard (`api/dashboard/`)
- Component CRUD
- Incident management
- Maintenance windows

### Status (`api/status/`)
- Public status page data
- Read-optimized endpoints
- SSE for real-time updates

## Local Development
```bash
docker-compose up
```

## Deployment
See `k8s/` and `argocd/` directories for Kubernetes manifests.
