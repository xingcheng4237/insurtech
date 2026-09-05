# Proposal: Insurtech Platform Scaffold

## Overview

Build the foundational Insurtech platform MVP that enables policy management, claims processing, and a customer self-service portal. This scaffold establishes the core architecture, CI/CD pipeline, and development workflows that all future features will build upon.

## Goals

1. **Establish Spring Boot 3.x backend** with Clean Architecture + DDD patterns
2. **Create React 18 + TypeScript frontend** with component library and routing
3. **Set up PostgreSQL + Redis infrastructure** with Docker Compose
4. **Configure CI/CD pipeline** with GitHub Actions (build, test, deploy to Railway)
5. **Deploy to Railway** with managed PostgreSQL + Redis
6. **Integrate Jira** as the product build tracker for all development work
7. **Integrate Confluence** as the knowledge base for architecture decisions and documentation
8. **Establish OpenSpec workflow** for spec-driven feature development
5. **Integrate Jira** as the product build tracker for all development work
6. **Integrate Confluence** as the knowledge base for architecture decisions and documentation
7. **Establish OpenSpec workflow** for spec-driven feature development

## Non-Goals

- Production deployment to AWS (Railway is the primary hosting platform)
- Full insurance policy underwriting logic
- Full insurance policy underwriting logic
- Payment processing integration
- Real-time chat/support features
- Mobile native apps

## Context

### Business Context
The insurance industry is undergoing digital transformation. Legacy systems are slow, paper-based, and provide poor customer experience. This platform aims to modernize policy lifecycle management from quote to claim.

### Technical Context
- Java 17 LTS with Spring Boot 3.x ecosystem
- React 18 with modern tooling (Vite, TanStack Query, Tailwind)
- Containerized local development with Docker Compose
- Spec-driven development via OpenSpec

## Success Criteria

- [ ] Backend API server starts and serves health endpoint
- [ ] Frontend dev server starts and renders landing page
- [ ] Database migrations run successfully via Flyway
- [ ] All containers start with `docker compose up`
- [ ] GitHub Actions workflow passes (build + test)
- [ ] Railway deployment succeeds (backend + frontend live)
- [ ] Railway managed PostgreSQL and Redis connected
- [ ] Jira project configured with issue types and workflows
- [ ] Jira project configured with issue types and workflows
- [ ] Confluence space created with architecture overview
- [ ] First OpenSpec change archived successfully

## Related Work

- OpenSpec initialization (already completed)
- Tech stack definition (already documented in AGENTS.md)
- Atlassian MCP integration (available via installed plugin)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Spring Modulith complexity | Medium | Start with standard packages, migrate to Modulith in follow-up |
| Frontend build tooling issues | Low | Use proven Vite + React template |
| Jira API rate limits | Low | Use batch operations, cache lookups |
| Team unfamiliar with OpenSpec | Medium | Document workflow in Confluence, provide examples |

## Decisions

- **API-first approach**: OpenAPI spec drives backend and frontend contract
- **Monorepo structure**: Single repo for backend, frontend, shared types
- **Trunk-based development**: Main branch with feature flags
- **Jira as source of truth** for build tracking, Confluence for knowledge
