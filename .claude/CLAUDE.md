# Insurtech Project Context

## Domain
Insurance Technology — digital transformation, policy management, claims processing, risk assessment, customer portals.

## Tech Stack

### Backend
- **Java**: 17+ (LTS)
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security 6.x with OAuth2 Resource Server + JWT
- **Data**: Spring Data JPA + Hibernate 6.x
- **Database**: PostgreSQL 15+
- **Cache**: Redis (sessions, distributed caching)
- **Messaging**: Apache Kafka (event-driven architecture)
- **API**: REST with OpenAPI 3.0 / SpringDoc
- **Build**: Maven 3.9+

### Frontend
- **Framework**: React 18+ with TypeScript 5.x
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite 5.x
- **State**: TanStack Query (React Query) + Zustand
- **Routing**: TanStack Router
- **Forms**: React Hook Form + Zod

### Testing
- **Unit/Integration**: JUnit 5 + Mockito
- **E2E**: Playwright
- **Contract**: Spring Cloud Contract
- **Containers**: Testcontainers (PostgreSQL, Redis, Kafka)

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions → Railway + Cloudflare Pages
- **Backend Hosting**: Railway.app (managed PostgreSQL + Redis)
- **Frontend Hosting**: Cloudflare Pages (static site)
- **CDN / DNS**: Cloudflare (www.chengxing.org)
- **Observability**: Spring Boot Actuator + Micrometer + Prometheus

## Architecture
- **Pattern**: Domain-Driven Design (DDD) + Clean Architecture
- **Modularity**: Spring Modulith for bounded contexts
- **API Style**: API-first with OpenAPI specification
- **Security**: Zero-trust, RBAC, audit logging

## When to Use Which Agent
- **Claude Code**: Complex multi-file refactoring, code review, deployment, OpenSpec workflows
- **Codex CLI**: Quick single-file edits, deep Java analysis
- **Kimi Work**: Document generation, data analysis, financial research, scheduled automations
- **Perplexity AI**: Industry research, competitor analysis, regulatory landscape

## Coding Standards
- Java records for DTOs, immutability by default
- Constructor-based dependency injection only
- DTO-only API responses (no entity exposure)
- Functional programming patterns with Optional and Stream
- Conventional commits (feat:, fix:, docs:, test:, refactor:)
- Branch naming: `feature/`, `bugfix/`, `hotfix/` prefixes

## Key Decisions
- See `docs/decisions/` for ADRs

## Atlassian Integration

### Jira (Build Tracker)
- **Project**: `INS` — Insurtech
- **Issue Types**: Epic = OpenSpec Change, Story = Feature, Task = Technical, Bug = Defect
- **Workflow**: Backlog → In Progress → In Review → Done
- **Labels**: `backend`, `frontend`, `infra`, `docs`, `openspec`
- **Custom Fields**: `OpenSpec Change`, `Architecture Decision`

### Confluence (Knowledge Base)
- **Space**: Insurtech Knowledge Base
- **Structure**:
  - 📋 Project Overview (Vision, Tech Stack, Team)
  - 🏛️ Architecture (C4 Diagrams, API Reference, DB Schema, ADR Index)
  - 📊 Status Reports (Sprint-by-sprint, auto-generated from Jira)
  - 📖 Runbooks (Local Dev Setup, Deployment, Incident Response)
  - 🤝 Meeting Notes (Sprint Planning, Retros, Architecture Reviews)

### MCP Tools Available
- `search` — Cross-system search (Confluence + Jira)
- `searchJiraIssuesUsingJql` — Targeted Jira search
- `searchConfluenceUsingCql` — Targeted Confluence search
- `getJiraIssue` / `createJiraIssue` / `addCommentToJiraIssue`
- `getConfluencePage` / `createConfluencePage` / `updateConfluencePage`
- `lookupJiraAccountId` — User lookup for task assignment

### Automation Rules
1. **OpenSpec Change Approved** → Create Jira Epic + Stories from tasks.md
2. **Task Complete in OpenSpec** → Transition Jira issue to "Done" + add commit SHA
3. **ADR Merged** → Publish to Confluence Architecture page
4. **Sprint End** → Generate status report from Jira → Publish to Confluence
5. **Meeting Notes in Confluence** → Extract action items → Create Jira tasks

## Railway Integration

### Deployment Pipeline
```
GitHub PR merged → main branch
    ↓
GitHub Actions: build + test
    ↓
Backend: Railway CLI deploy → insurtech-api service
Frontend: Cloudflare Pages deploy → www.chengxing.org
```

### Railway Services
| Service | Type | Purpose |
|---------|------|---------|
| insurtech-api | Service | Spring Boot backend |
| insurtech-db | Database | Railway PostgreSQL |
| insurtech-cache | Database | Railway Redis |

### Environment Variables (Railway)
```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
SPRING_REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<secret>
CORS_ALLOWED_ORIGINS=https://www.chengxing.org,https://*.pages.dev
```

## Cloudflare Integration

### DNS Records
| Type | Name | Target |
|------|------|--------|
| CNAME | www | `<pages-project>.pages.dev` |
| CNAME | api | `insurtech-api.up.railway.app` |

### Settings
- SSL/TLS: Full (strict)
- Always Use HTTPS: ON
- Auto Minify: HTML, CSS, JS

## Perplexity AI Integration

### Research Use Cases
- Insurance tech market trends and competitor analysis
- Regulatory landscape (GDPR, HIPAA, state insurance regulations)
- Customer behavior and digital transformation benchmarks
- Technology stack comparisons and best practices

### Workflow
1. Query Perplexity for research topic
2. Synthesize findings in Confluence Research section
3. Link research to Jira epics as supporting context
4. Update OpenSpec proposals with data-driven rationale
