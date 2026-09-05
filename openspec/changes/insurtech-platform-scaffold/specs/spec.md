# Insurtech Platform Scaffold — Specifications

## ADDED Requirements

### Requirement: Backend API Foundation
The backend SHALL provide a production-ready Spring Boot 3.x API server with health monitoring, structured logging, and security foundations.

#### Scenario: Health endpoint responds
- **WHEN** a GET request is made to `/api/v1/health`
- **THEN** the server returns `200 OK` with status `{"status":"UP"}`

#### Scenario: Application starts with profiles
- **WHEN** the application starts with `local` profile
- **THEN** it connects to Docker Compose PostgreSQL and Redis
- **AND** Flyway migrations execute automatically

#### Scenario: Structured logging
- **WHEN** any API endpoint is called
- **THEN** a structured JSON log entry is written with traceId, timestamp, method, path, and duration

---

### Requirement: Domain-Driven Architecture
The backend SHALL follow Clean Architecture with clear separation between domain, application, infrastructure, and interface layers.

#### Scenario: Package structure enforces boundaries
- **WHEN** a developer adds a new feature
- **THEN** domain classes have no dependencies on Spring or infrastructure
- **AND** application services depend only on domain and application ports

#### Scenario: Policy aggregate exists
- **GIVEN** a policy domain module
- **WHEN** creating a new policy
- **THEN** the Policy aggregate encapsulates all policy lifecycle rules

---

### Requirement: Frontend Application
The frontend SHALL be a React 18 + TypeScript SPA with routing, state management, and a design system.

#### Scenario: Landing page renders
- **WHEN** a user navigates to `/`
- **THEN** the Insurtech landing page renders with navigation to Policies and Claims

#### Scenario: API integration works
- **WHEN** the frontend calls `/api/v1/health`
- **THEN** it displays the backend status

#### Scenario: Theme switching
- **WHEN** a user clicks the theme toggle
- **THEN** the app switches between light and dark modes

---

### Requirement: Database Infrastructure
The system SHALL use PostgreSQL for persistent storage and Redis for caching/sessions.

#### Scenario: Flyway migrations run
- **WHEN** the backend starts
- **THEN** all pending Flyway migrations execute in order
- **AND** migration history is recorded in `flyway_schema_history`

#### Scenario: Redis connection
- **WHEN** the application starts
- **THEN** it connects to Redis for session storage
- **AND** session data persists across restarts

---

### Requirement: CI/CD Pipeline
The project SHALL have a GitHub Actions workflow that builds, tests, and validates the codebase.

#### Scenario: Pull request validation
- **WHEN** a pull request is opened
- **THEN** GitHub Actions runs Maven build, tests, and code quality checks
- **AND** the PR cannot merge until checks pass

#### Scenario: Docker image build
- **WHEN** code is merged to `main`
- **THEN** GitHub Actions builds a Docker image for the backend
- **AND** pushes it to GitHub Container Registry

---

### Requirement: Jira Integration — Build Tracker
All development work SHALL be tracked in Jira with automated ticket creation from OpenSpec changes.

#### Scenario: OpenSpec change creates Jira epic
- **WHEN** an OpenSpec change is approved for implementation
- **THEN** a Jira epic is created with the change name and proposal link
- **AND** child stories are created for each task in tasks.md

#### Scenario: Task completion updates Jira
- **WHEN** a developer marks a task complete in OpenSpec
- **THEN** the corresponding Jira issue transitions to "Done"
- **AND** a comment is added with the git commit SHA

#### Scenario: Status report generation
- **WHEN** a sprint ends
- **THEN** a status report is generated from Jira issues
- **AND** published to Confluence

---

### Requirement: Confluence Integration — Knowledge Base
Architecture decisions, API documentation, and runbooks SHALL live in Confluence.

#### Scenario: ADR published to Confluence
- **WHEN** an architecture decision is made
- **THEN** an ADR is created in `docs/decisions/`
- **AND** published to the Confluence "Architecture Decisions" page

#### Scenario: API documentation auto-generated
- **WHEN** the OpenAPI spec is updated
- **THEN** the Confluence "API Reference" page is updated with the new spec

#### Scenario: Meeting notes to tasks
- **GIVEN** meeting notes in Confluence
- **WHEN** action items are identified
- **THEN** Jira tasks are created with proper assignees

---

### Requirement: OpenSpec Workflow
The team SHALL use OpenSpec for all feature development, with changes archived and specs updated.

#### Scenario: Feature development lifecycle
- **GIVEN** a new feature request
- **WHEN** using `/opsx:propose "feature-name"`
- **THEN** a change directory is created with proposal, specs, design, and tasks
- **AND** upon completion, `/opsx:archive` merges specs back to main

#### Scenario: Spec validation passes
- **WHEN** `openspec validate` is run
- **THEN** all requirements use SHALL/MUST keywords
- **AND** scenarios have WHEN/THEN structure
