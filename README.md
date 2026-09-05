# Insurtech

Insurance Technology platform — policy management, claims processing, customer portal.

## Tech Stack
- **Backend**: Java 17 + Spring Boot 3.x + PostgreSQL + Redis
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Hosting**: Railway (backend API) + Cloudflare Pages (frontend at www.chengxing.org)
- **Tracking**: Jira (build tracker) + Confluence (knowledge base)
- **Specs**: OpenSpec (spec-driven development)
- **Research**: Perplexity AI (industry research)

## Quick Start

### Local Development
```bash
# Start everything with Docker Compose
docker compose up

# Or run separately:
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
cd frontend && npm run dev
```

### Deploy to Production
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete instructions.

**Quick deploy:**
```bash
# 1. Authenticate Railway (opens browser)
railway login

# 2. Create project and deploy backend
cd backend
railway init --name insurtech
railway add --database postgres
railway add --database redis
railway up --service=insurtech-api

# 3. Deploy frontend to Cloudflare Pages
# (via GitHub Actions or Cloudflare Dashboard)
```

## Project Structure
```
Insurtech/
├── backend/          # Spring Boot 3.x API
├── frontend/         # React 18 + TypeScript SPA
├── docs/             # Documentation + Deployment guide
├── openspec/         # Spec-driven development
│   └── changes/      # In-flight OpenSpec changes
├── .claude/          # Claude Code project config
├── AGENTS.md         # Cross-agent configuration
└── docker-compose.yml
```

## Links
- **Live Site**: https://www.chengxing.org
- **API Health**: https://api.chengxing.org/api/v1/health
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **OpenSpec Change**: `openspec/changes/insurtech-platform-scaffold/`
