# Insurtech Platform Scaffold — Implementation Tasks

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Backend Project
- [ ] Create Maven multi-module project structure
- [ ] Add Spring Boot 3.2 starter with web, data-jpa, security, validation
- [ ] Configure application.yml with profiles (local, test, prod)
- [ ] Add Spring Modulith dependency
- [ ] Add Flyway for database migrations
- [ ] Set up Logstash encoder for structured JSON logging
- [ ] Create health indicator endpoint (`/api/v1/health`)
- [ ] **Jira**: Create task `INS-1` — Backend project initialization

### 1.2 Initialize Frontend Project
- [ ] Scaffold React 18 + TypeScript with Vite
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Set up TanStack Router with type-safe routes
- [ ] Configure TanStack Query with devtools
- [ ] Set up Zustand for client state
- [ ] Create base layout (Navbar, Sidebar, Footer)
- [ ] Implement theme toggle (light/dark mode)
- [ ] Create landing page at `/`
- [ ] **Jira**: Create task `INS-2` — Frontend project initialization

### 1.3 Docker & Local Dev Environment
- [ ] Create `docker-compose.yml` with PostgreSQL, Redis, backend, frontend
- [ ] Add `.env.example` with all required variables
- [ ] Create `Dockerfile` for backend (multi-stage build)
- [ ] Create `Dockerfile` for frontend (nginx serve)
- [ ] Verify all services start with `docker compose up`
- [ ] **Jira**: Create task `INS-3` — Docker local dev environment

### 1.4 GitHub Actions CI/CD + Railway
- [ ] Create `.github/workflows/ci.yml` for PR validation
- [ ] Add Maven build + test + SonarQube steps
- [ ] Add frontend build + test + lint steps
- [ ] Configure branch protection rules (require PR + checks)
- [ ] **Jira**: Create task `INS-4` — CI/CD pipeline setup

### 1.5 Railway Project Setup
- [ ] Create Railway project `insurtech`
- [ ] Add services: `insurtech-api` (backend), `insurtech-web` (frontend)
- [ ] Provision Railway PostgreSQL database
- [ ] Provision Railway Redis cache
- [ ] Configure environment variables for production
- [ ] Create `railway.json` configuration file
- [ ] **Jira**: Create task `INS-5` — Railway project setup

---
- [ ] Create `.github/workflows/ci.yml` for PR validation
- [ ] Add Maven build + test + SonarQube steps
- [ ] Add frontend build + test + lint steps
- [ ] Add Docker image build and push to GHCR
- [ ] Configure branch protection rules (require PR + checks)
- [ ] **Jira**: Create task `INS-4` — CI/CD pipeline setup

---

## Phase 2: Domain & Persistence

### 2.1 Database Schema & Migrations
- [ ] Create `V1__init.sql` with policies and claims tables
- [ ] Add indexes for common queries (customer_id, status, date ranges)
- [ ] Configure Flyway in Spring Boot
- [ ] Add Testcontainers for PostgreSQL in integration tests
- [ ] **Jira**: Create task `INS-6` — Database schema and migrations

### 2.2 Policy Domain Module
- [ ] Create `policy` package with Modulith boundary
- [ ] Implement `Policy` aggregate root with value objects
- [ ] Create `PolicyRepository` interface (port)
- [ ] Implement `JpaPolicyRepository` (adapter)
- [ ] Add `PolicyApplicationService` with CRUD operations
- [ ] Write unit tests for domain logic
- [ ] Write integration tests for repository
- [ ] **Jira**: Create task `INS-7` — Policy domain module

### 2.3 Claims Domain Module
- [ ] Create `claims` package with Modulith boundary
- [ ] Implement `Claim` aggregate root
- [ ] Create `ClaimRepository` interface and JPA implementation
- [ ] Add `ClaimApplicationService`
- [ ] Implement claim filing workflow
- [ ] Write unit and integration tests
- [ ] **Jira**: Create task `INS-8` — Claims domain module

---
- [ ] Create `V1__init.sql` with policies and claims tables
- [ ] Add indexes for common queries (customer_id, status, date ranges)
- [ ] Configure Flyway in Spring Boot
- [ ] Add Testcontainers for PostgreSQL in integration tests
- [ ] **Jira**: Create task `INS-5` — Database schema and migrations

### 2.2 Policy Domain Module
- [ ] Create `policy` package with Modulith boundary
- [ ] Implement `Policy` aggregate root with value objects
- [ ] Create `PolicyRepository` interface (port)
- [ ] Implement `JpaPolicyRepository` (adapter)
- [ ] Add `PolicyApplicationService` with CRUD operations
- [ ] Write unit tests for domain logic
- [ ] Write integration tests for repository
- [ ] **Jira**: Create task `INS-6` — Policy domain module

### 2.3 Claims Domain Module
- [ ] Create `claims` package with Modulith boundary
- [ ] Implement `Claim` aggregate root
- [ ] Create `ClaimRepository` interface and JPA implementation
- [ ] Add `ClaimApplicationService`
- [ ] Implement claim filing workflow
- [ ] Write unit and integration tests
- [ ] **Jira**: Create task `INS-7` — Claims domain module

---

## Phase 3: API & Security

### 3.1 REST API Controllers
- [ ] Create `PolicyController` with CRUD endpoints
- [ ] Create `ClaimController` with file/get endpoints
- [ ] Implement DTOs with MapStruct mappers
- [ ] Add request/response validation
- [ ] Add global exception handler
- [ ] Generate OpenAPI spec with SpringDoc
- [ ] **Jira**: Create task `INS-9` — REST API controllers

### 3.2 Security Configuration
- [ ] Configure Spring Security with OAuth2 Resource Server
- [ ] Set up JWT token validation
- [ ] Implement RBAC (ADMIN, AGENT, CUSTOMER roles)
- [ ] Add method-level security annotations
- [ ] Configure CORS for frontend origin
- [ ] **Jira**: Create task `INS-10` — Security configuration

### 3.3 Frontend API Integration
- [ ] Generate TypeScript types from OpenAPI spec
- [ ] Create API client with TanStack Query hooks
- [ ] Implement error handling and loading states
- [ ] Add request interceptors for JWT token
- [ ] **Jira**: Create task `INS-11` — Frontend API integration

---

## Phase 4: Railway Deployment

### 4.1 Railway Backend Deploy
- [ ] Create production `application-prod.yml` profile
- [ ] Configure Railway PostgreSQL connection
- [ ] Configure Railway Redis connection
- [ ] Set up Railway health checks
- [ ] Deploy backend via `railway up`
- [ ] Verify health endpoint on Railway URL
- [ ] **Jira**: Create task `INS-12` — Railway backend deploy

### 4.2 Railway Frontend Deploy
- [ ] Build frontend for production (Vite build)
- [ ] Configure API base URL to point to Railway backend
- [ ] Deploy frontend as Railway static site
- [ ] Verify frontend loads and connects to backend
- [ ] **Jira**: Create task `INS-13` — Railway frontend deploy

### 4.3 Railway Monitoring & Logs
- [ ] Configure structured logging for Railway
- [ ] Set up Railway log drains (if needed)
- [ ] Verify application logs visible in Railway dashboard
- [ ] Test auto-restart on failure
- [ ] **Jira**: Create task `INS-14` — Railway monitoring
- [ ] Create `PolicyController` with CRUD endpoints
- [ ] Create `ClaimController` with file/get endpoints
- [ ] Implement DTOs with MapStruct mappers
- [ ] Add request/response validation
- [ ] Add global exception handler
- [ ] Generate OpenAPI spec with SpringDoc
- [ ] **Jira**: Create task `INS-8` — REST API controllers

### 3.2 Security Configuration
- [ ] Configure Spring Security with OAuth2 Resource Server
- [ ] Set up JWT token validation
- [ ] Implement RBAC (ADMIN, AGENT, CUSTOMER roles)
- [ ] Add method-level security annotations
- [ ] Configure CORS for frontend origin
- [ ] **Jira**: Create task `INS-9` — Security configuration

### 3.3 Frontend API Integration
- [ ] Generate TypeScript types from OpenAPI spec
- [ ] Create API client with TanStack Query hooks
- [ ] Implement error handling and loading states
- [ ] Add request interceptors for JWT token
- [ ] **Jira**: Create task `INS-10` — Frontend API integration

---

## Phase 4: Atlassian Integration

### 4.1 Jira Project Configuration
- [ ] Create Jira project `INS` with appropriate issue types
- [ ] Configure workflow: Backlog → In Progress → In Review → Done
- [ ] Set up labels: `backend`, `frontend`, `infra`, `docs`
- [ ] Add custom fields: `OpenSpec Change`, `Architecture Decision`
- [ ] Configure automation: move to "In Review" on PR open
- [ ] **Jira**: Create task `INS-11` — Jira project setup

### 4.2 Confluence Space Setup
- [ ] Create "Insurtech Knowledge Base" Confluence space
- [ ] Create parent pages: Architecture, Status Reports, Runbooks, Meeting Notes
- [ ] Set up page templates for ADRs and status reports
- [ ] Configure permissions for team access
- [ ] **Jira**: Create task `INS-12` — Confluence space setup

### 4.3 OpenSpec ↔ Jira Sync
- [ ] Create script to parse `tasks.md` and create Jira issues
- [ ] Link Jira epic to OpenSpec change directory
- [ ] Add git commit hook to update Jira on commit
- [ ] Create status report generator (Jira → Confluence)
- [ ] **Jira**: Create task `INS-13` — OpenSpec Jira sync

### 4.4 Meeting Notes → Tasks Pipeline
- [ ] Document Confluence meeting notes format with action items
- [ ] Test Atlassian MCP `capture-tasks-from-meeting-notes` skill
- [ ] Create template for sprint planning notes
- [ ] Validate task creation with assignee lookup
- [ ] **Jira**: Create task `INS-14` — Meeting notes automation

---

## Phase 5: Documentation & Validation

### 5.1 Architecture Decision Records
- [ ] Write ADR-001: Java 17 + Spring Boot 3.x choice
- [ ] Write ADR-002: React 18 + Vite choice
- [ ] Write ADR-003: Clean Architecture + Spring Modulith
- [ ] Write ADR-004: PostgreSQL + Redis persistence
- [ ] Write ADR-005: Jira + Confluence for tracking/docs
- [ ] Write ADR-006: Railway for application hosting
- [ ] Publish ADRs to Confluence Architecture page
- [ ] **Jira**: Create task `INS-19` — Architecture decisions

### 5.2 Developer Onboarding Docs
- [ ] Write `docs/SETUP.md` — Local development setup
- [ ] Write `docs/API.md` — API usage guide
- [ ] Write `docs/TESTING.md` — Testing strategy
- [ ] Write `docs/DEPLOYMENT.md` — Railway deployment guide
- [ ] Publish to Confluence Runbooks section
- [ ] **Jira**: Create task `INS-20` — Developer documentation

### 5.3 OpenSpec Validation
- [ ] Run `openspec validate` on this change
- [ ] Fix any spec violations
- [ ] Verify all tasks have clear acceptance criteria
- [ ] Archive change with `openspec archive`
- [ ] **Jira**: Create task `INS-21` — OpenSpec validation
- [ ] Write ADR-001: Java 17 + Spring Boot 3.x choice
- [ ] Write ADR-002: React 18 + Vite choice
- [ ] Write ADR-003: Clean Architecture + Spring Modulith
- [ ] Write ADR-004: PostgreSQL + Redis persistence
- [ ] Write ADR-005: Jira + Confluence for tracking/docs
- [ ] Publish ADRs to Confluence Architecture page
- [ ] **Jira**: Create task `INS-15` — Architecture decisions

### 5.2 Developer Onboarding Docs
- [ ] Write `docs/SETUP.md` — Local development setup
- [ ] Write `docs/API.md` — API usage guide
- [ ] Write `docs/TESTING.md` — Testing strategy
- [ ] Write `docs/DEPLOYMENT.md` — Deployment guide
- [ ] Publish to Confluence Runbooks section
- [ ] **Jira**: Create task `INS-16` — Developer documentation

### 5.3 OpenSpec Validation
- [ ] Run `openspec validate` on this change
- [ ] Fix any spec violations
- [ ] Verify all tasks have clear acceptance criteria
- [ ] Archive change with `openspec archive`
- [ ] **Jira**: Create task `INS-17` — OpenSpec validation

---

## Jira Epic Structure

```
INS-0  Epic: Insurtech Platform Scaffold
├── INS-1  Task: Backend project initialization
├── INS-2  Task: Frontend project initialization
├── INS-3  Task: Docker local dev environment
├── INS-4  Task: CI/CD pipeline setup
├── INS-5  Task: Database schema and migrations
├── INS-6  Task: Policy domain module
├── INS-7  Task: Claims domain module
├── INS-8  Task: REST API controllers
├── INS-9  Task: Security configuration
├── INS-10 Task: Frontend API integration
├── INS-11 Task: Jira project setup
├── INS-12 Task: Confluence space setup
├── INS-13 Task: OpenSpec Jira sync
├── INS-14 Task: Meeting notes automation
├── INS-15 Task: Architecture decisions
├── INS-16 Task: Developer documentation
└── INS-17 Task: OpenSpec validation
```

## Confluence Pages to Create

| Page | Content | Source |
|------|---------|--------|
| System Architecture | C4 diagrams, component overview | `design.md` |
| API Reference | Auto-generated from OpenAPI | SpringDoc |
| Database Schema | ERD, migration history | Flyway + dbdocs |
| Sprint 1 Status | Jira query results | Auto-generated |
| Local Dev Setup | Docker, env vars, IDE config | `docs/SETUP.md` |
| ADR Index | List of all ADRs with status | `docs/decisions/` |
