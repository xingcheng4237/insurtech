# Insurtech Platform Scaffold — Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                     React 18 SPA                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  TanStack   │  │   Zustand    │  │   React Hook Form   │ │
│  │   Router    │  │    Store     │  │   + Zod Validation  │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST/JSON (OpenAPI 3.0)
┌──────────────────────────▼──────────────────────────────────┐
│              Spring Boot 3.x API Gateway                     │
│         (Spring Security 6 + JWT + Rate Limiting)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│   Policy     │  │     Claims      │  │   User     │
│   Module     │  │     Module      │  │   Module   │
│ (Modulith)   │  │   (Modulith)    │  │  (Future)  │
└───────┬──────┘  └────────┬────────┘  └────────────┘
        │                  │
        └──────────────────┼──────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              PostgreSQL 15 + Redis 7                        │
│         (Docker Compose for local dev)                      │
└─────────────────────────────────────────────────────────────┘
```

## Backend Design

### Package Structure (Clean Architecture)

```
insurtech-backend/
├── src/main/java/com/insurtech/
│   ├── InsurtechApplication.java
│   ├── config/                    # Spring config, security, properties
│   ├── policy/                    # Policy bounded context (Modulith)
│   │   ├── domain/                # Entities, value objects, aggregates
│   │   ├── application/           # Use cases, DTOs, ports
│   │   └── infrastructure/        # JPA repositories, REST controllers
│   ├── claims/                    # Claims bounded context (Modulith)
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── common/                    # Shared kernel
│   │   ├── domain/                # BaseEntity, Money, Address
│   │   └── infrastructure/        # Web exception handler, audit
│   └── health/                    # Health indicators
├── src/main/resources/
│   ├── db/migration/              # Flyway migrations (V1__init.sql)
│   └── application-*.yml          # Profile configs
└── pom.xml
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Clean Architecture + DDD | Testability, maintainability, team scaling |
| Modularity | Spring Modulith | Compile-time module boundaries, event-driven |
| Security | OAuth2 Resource Server + JWT | Stateless, scalable, industry standard |
| Database | PostgreSQL + Flyway | ACID, mature, versioned migrations |
| API Docs | SpringDoc OpenAPI | Auto-generated from annotations |
| Logging | Structured JSON (Logstash) | Observable, searchable |

### API Endpoints (Phase 1)

```yaml
/api/v1/health          GET    → Health check
/api/v1/policies        GET    → List policies
/api/v1/policies        POST   → Create policy
/api/v1/policies/{id}   GET    → Get policy details
/api/v1/claims          POST   → File claim
/api/v1/claims/{id}     GET    → Get claim status
```

## Frontend Design

### Component Architecture

```
src/
├── components/           # shadcn/ui + custom
│   ├── ui/              # Base components (Button, Card, Input)
│   ├── layout/          # Navbar, Sidebar, Footer
│   └── features/        # PolicyCard, ClaimForm, StatusBadge
├── pages/
│   ├── Home.tsx
│   ├── Policies.tsx
│   ├── Claims.tsx
│   └── PolicyDetail.tsx
├── hooks/
│   ├── useApi.ts        # TanStack Query wrappers
│   └── useTheme.ts      # Dark mode toggle
├── stores/
│   └── authStore.ts     # Zustand auth state
├── types/
│   └── api.ts           # Generated from OpenAPI
└── lib/
    └── utils.ts         # cn() helper, formatters
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build Tool | Vite | Fast HMR, modern esbuild |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| State (Server) | TanStack Query | Caching, synchronization, deduping |
| State (Client) | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Performance, type-safe validation |
| Routing | TanStack Router | Type-safe, nested layouts |

## Infrastructure Design

### Docker Compose (Local Development)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: insurtech
      POSTGRES_USER: insurtech
      POSTGRES_PASSWORD: insurtech
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [postgres, redis]
    environment:
      SPRING_PROFILES_ACTIVE: local

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
```

### GitHub Actions + Railway Deployment

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: mvn -B verify
      - run: mvn -B test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build && npm run test

  deploy:
    needs: [backend, frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy to Railway
        run: railway up --service=insurtech-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Railway Configuration

`railway.json` (project root):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "java -jar target/insurtech-*.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Railway Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `SPRING_PROFILES_ACTIVE` | Manual | `prod` for production |
| `SPRING_DATASOURCE_URL` | Railway Postgres | Auto-populated by Railway |
| `SPRING_REDIS_HOST` | Railway Redis | Auto-populated by Railway |
| `JWT_SECRET` | Manual | Secret key for JWT signing |
| `CORS_ALLOWED_ORIGINS` | Manual | Frontend URL on Railway |

### Railway Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (Railway)
┌──────────────────────────▼──────────────────────────────────┐
│              Railway.app Platform                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  insurtech-web  │  │  insurtech-api   │  │  PostgreSQL│ │
│  │   (Static Site) │  │  (Spring Boot)   │  │  (Managed) │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────────┘ │
│           │                    │            ┌────────────┐   │
│           │                    └───────────►│   Redis    │   │
│           │                                 │  (Managed) │   │
│           └────────────────────────────────►└────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: mvn -B verify
      - run: mvn -B test
      - run: docker build -t insurtech-backend ./backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build && npm run test
```

## Jira Integration Design

### Workflow Mapping

```
OpenSpec Change ──► Jira Epic
├── proposal.md    → Epic description + acceptance criteria
├── specs/         → Epic links to Confluence spec page
├── design.md      → Epic links to Confluence design page
└── tasks.md       → Child Stories/Tasks in Epic

Task Completion ──► Jira Update
├── [x] Task 1     → Story "Done" + comment with commit SHA
├── [x] Task 2     → Story "Done" + comment with commit SHA
└── /opsx:archive  → Epic "Done" + spec merged to main
```

### Jira Project Structure

- **Project Key**: `INS` (Insurtech)
- **Issue Types**: Epic (change), Story (feature), Task (technical), Bug (defect)
- **Labels**: `backend`, `frontend`, `infra`, `docs`, `openspec`
- **Custom Fields**: `OpenSpec Change`, `Architecture Decision`

## Confluence Integration Design

### Space Structure

```
Insurtech Knowledge Base
├── 📋 Project Overview
│   ├── Vision & Goals
│   ├── Tech Stack
│   └── Team Contacts
├── 🏛️ Architecture
│   ├── System Architecture Diagram
│   ├── API Reference (auto-generated)
│   ├── Database Schema
│   └── ADR Index
├── 📊 Status Reports
│   ├── Sprint 1 Status
│   ├── Sprint 2 Status
│   └── ...
├── 📖 Runbooks
│   ├── Local Development Setup
│   ├── Deployment Guide
│   └── Incident Response
└── 🤝 Meeting Notes
    ├── Sprint Planning
    ├── Retrospectives
    └── Architecture Reviews
```

### Automation Rules

1. **ADR → Confluence**: When `docs/decisions/ADR-NNN.md` is merged, publish to Architecture space
2. **OpenAPI → Confluence**: On `main` merge, regenerate API Reference page
3. **Sprint End → Status Report**: Query Jira, generate report, publish to Status Reports

## Data Model (Phase 1)

### Policy Aggregate

```sql
-- policies table
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    policy_type VARCHAR(50) NOT NULL,  -- MOTOR, HOME, LIFE
    status VARCHAR(20) NOT NULL,       -- DRAFT, ACTIVE, EXPIRED, CANCELLED
    premium_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Claim Aggregate

```sql
-- claims table
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    policy_id UUID NOT NULL REFERENCES policies(id),
    status VARCHAR(20) NOT NULL,       -- FILED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED
    incident_date DATE NOT NULL,
    description TEXT,
    claimed_amount DECIMAL(15,2),
    settled_amount DECIMAL(15,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit Tests | JUnit 5 + Mockito | 80% |
| Integration Tests | Testcontainers | Critical paths |
| API Contract Tests | Spring Cloud Contract | All endpoints |
| E2E Tests | Playwright | Core user flows |
| Load Tests | k6 (future) | Key endpoints |
