# Insurtech Workspace

Cross-agent project configuration for Claude Code, Codex CLI, and Kimi Work.

## Project Identity
- **Name**: Insurtech
- **Domain**: Insurance Technology
- **Stack**: TBD — define during project initialization
- **Created**: 2026-09-05
- **OpenSpec**: ✅ Initialized (v1.12.0) — spec-driven development enabled
- **Tech Stack**: Java 17 + Spring Boot 3.x + React 18 + TypeScript + PostgreSQL + Redis + Kafka

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.x, Spring Security 6 (OAuth2/JWT), Spring Data JPA |
| **Frontend** | React 18, TypeScript 5, Tailwind CSS, shadcn/ui, Vite |
| **Database** | PostgreSQL 15+, Redis (cache/sessions) |
| **Messaging** | Apache Kafka |
| **Testing** | JUnit 5, Mockito, Testcontainers, Playwright |
| **Build** | Maven 3.9+ |
| **DevOps** | Docker, Docker Compose, GitHub Actions, Railway CLI |
| **Hosting** | Railway (backend API) + Cloudflare Pages (frontend) |
| **CDN / DNS** | Cloudflare (www.chengxing.org) |
| **Database (Prod)** | Railway PostgreSQL + Redis |
| **Architecture** | DDD + Clean Architecture, Spring Modulith |
| **API** | REST + OpenAPI 3.0 |

## Cloudflare — CDN & Custom Domain
- **Domain**: `www.chengxing.org`
- **DNS**: Cloudflare manages DNS records for chengxing.org
- **CDN**: Cloudflare caches static assets (frontend)
- **SSL/TLS**: Full (strict) encryption mode
- **Pages**: Cloudflare Pages for frontend static hosting (alternative to Railway static)
- **Workers**: Potential future use for edge functions/API gateway
- **Configuration**:
  - CNAME `www` → Railway frontend URL or Cloudflare Pages
  - API subdomain: `api.chengxing.org` → Railway backend
  - Always Use HTTPS enabled
  - Auto Minify: HTML, CSS, JS

## Railway — Application Hosting

- **Platform**: Railway.app (primary hosting)
- **Services**: Backend API, Frontend (static), PostgreSQL, Redis
- **Deployment**: GitHub Actions → Railway CLI on merge to `main`
- **Environment Variables**: Managed via Railway dashboard + `.env` files for local
- **Features Used**: Automatic HTTPS, PR previews, managed databases, persistent storage
- **CLI**: `railway login`, `railway link`, `railway up`

## Atlassian Integration

### Jira — Product Build Tracker
- **Project Key**: `INS` (Insurtech)
- **Issue Types**: Epic (OpenSpec change), Story, Task, Bug
- **Workflow**: Backlog → In Progress → In Review → Done
- **Skills Available**:
  - `/triage-issue` — Intelligently triage bug reports, search duplicates
  - `/capture-tasks-from-meeting-notes` — Extract action items from Confluence meeting notes and create Jira tasks
  - `/generate-status-report` — Generate project status reports from Jira and publish to Confluence
- **Automation**: OpenSpec tasks → Jira issues, PR merges → Jira transitions, Sprint end → Confluence status report

### Confluence — Knowledge Base
- **Space**: "Insurtech Knowledge Base"
- **Key Pages**: System Architecture, API Reference, ADR Index, Status Reports, Runbooks, Meeting Notes
- **Skills Available**:
  - `/search-company-knowledge` — Search across Confluence, Jira, and internal docs
- **Auto-Publish**: ADRs on merge, API docs on OpenAPI change, Status reports on sprint end

### Atlassian MCP Quick Reference
```bash
# Search company knowledge
search(cloudId="...", query="billing system")

# Search Confluence specifically
searchConfluenceUsingCql(cloudId="...", cql="text ~ 'deployment process'")

# Search Jira issues
searchJiraIssuesUsingJql(cloudId="...", jql='project = "INS" AND status != Done')

# Create Jira issue
createJiraIssue(cloudId="...", projectKey="INS", issueTypeName="Story", summary="...")

# Get Confluence page
getConfluencePage(cloudId="...", pageId="12345", contentFormat="markdown")

# Create Confluence page
createConfluencePage(cloudId="...", spaceId="12345", title="...", body="...")
```

## Agent Instructions

### For All Agents
- Work spec-first when possible. Use OpenSpec (`/opsx:propose`) for complex features.
- Prefer small, coherent commits with clear messages.
- Do not auto-import external issues into specs without confirmation.
- Maintain a `docs/decisions/` folder for architectural decision records (ADRs).

### Claude Code Specific
- Use `/browse` from gstack for web browsing (never `mcp__claude-in-chrome__*`)
- Available gstack skills: `/autoplan`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/qa`, `/careful`, `/freeze`, `/guard`
- OpenSpec skills available: `/opsx:propose`, `/opsx:explore`, `/opsx:apply`, `/opsx:archive`, `/opsx:update`, `/opsx:sync`
- Caveman mode is active — output will be token-optimized
- Use RTK for bash commands when applicable (`rtk git status`, etc.)

### Codex CLI Specific
- Model: gpt-5.5 (medium reasoning)
- Trust level: `trusted` for this workspace
- Use computer-use tools for browser automation when needed

### Perplexity AI — Industry Research
- **Use cases**: Market research, competitor analysis, regulatory landscape, insurance tech trends, customer behavior studies
- **Integration**: Use `/browse` skill or direct API calls for real-time research
- **Workflow**: Research → Summarize in Confluence → Link to Jira epics as supporting context

### Kimi Work Specific
- Default model: k2d6-agent
- Approval mode: yolo
- All system skills available (PDF, Excel, Word, Slides, WebBridge, Yahoo Finance, SEC EDGAR, etc.)
- Blueprint Automations can be scheduled for recurring tasks

## Workspace Structure

```
Insurtech/
├── README.md
├── AGENTS.md              # This file
├── openspec/              # OpenSpec spec-driven development
│   ├── config.yaml        # OpenSpec configuration
│   ├── specs/             # Current specs (source of truth)
│   └── changes/           # In-flight changes
├── docs/
│   ├── decisions/         # ADRs
│   ├── specs/             # OpenSpec specs
│   └── research/          # Market research, findings
├── src/                   # Source code
├── tests/                 # Test suites
├── scripts/               # Automation scripts
└── .claude/               # Claude project config
    ├── settings.json
    ├── CLAUDE.md
    ├── skills/            # OpenSpec skills
    └── commands/          # OpenSpec commands
```

## OpenSpec Quick Start

```bash
# Propose a new feature
/opsx:propose "add user authentication"

# Explore before committing
/opsx:explore

# Apply an approved change
/opsx:apply

# Archive a completed change
/opsx:archive

# Update an existing change plan
/opsx:update

# Sync specs with external systems
/opsx:sync
```

## Skills to Use

### Product Management
- `deanpeters/Product-Manager-Skills` — 77 PM skills ✅ Installed
- `product-on-purpose/pm-skills` — 24 lifecycle skills ✅ Installed
- `alirezarezvani/claude-skills/product-team/` — PM toolkit, agile PO, strategist ✅ Installed

### Development
- `AyrtonAldayr/agent-skill-java-spring-framework` — Java Spring reference ✅ Installed
- `mattpocock/skills` — PRD writing, TDD, architecture ✅ Installed
- `NeoLabHQ/ddd` — Domain-Driven Design *(private repo — skipped)*

### OpenSpec
- `Fission-AI/OpenSpec` — 12 workflow skills for spec-driven development ✅ Installed
