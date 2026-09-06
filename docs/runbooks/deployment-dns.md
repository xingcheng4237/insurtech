# Deployment & DNS Runbook

Last verified: 2026-09-06

## Architecture

```
Browser
  └── https://insurtech.chengxing.org          (Cloudflare proxy, Full strict TLS)
        └── Railway: insurtech-web             (nginx, static frontend + /api reverse proxy)
              └── http://insurtech-api.railway.internal:8080
                    └── Railway: insurtech-api (Spring Boot 3.5, port 8080)
                          ├── Railway Postgres 18.x
                          └── Railway Redis
```

- **Railway project**: `secure-warmth` (`34874d7a-b69e-45bb-8c77-d93d35b34e82`), environment `production`
- **Repo**: `github.com/xingcheng4237/insurtech`, both services auto-deploy from `main`
- **Cloudflare zone**: `chengxing.org` (zone id `22068129c860642bfb3177a08f511bcb`)

## Railway service configuration

Both services are GitHub-connected (repo trigger: `main` branch). Build config is set on the
**service instance** (Railway dashboard / API), which is authoritative:

| Setting | insurtech-web | insurtech-api |
|---|---|---|
| Root directory | `frontend` | repo root |
| Builder | Dockerfile `frontend/Dockerfile` | Dockerfile `backend/Dockerfile` |
| Start command | nginx envsubst wrapper (see `frontend/railway.json`) | `java -jar app.jar` |
| Healthcheck | `GET /` | `GET /api/v1/health` |
| Key env vars | `BACKEND_URL=http://insurtech-api.railway.internal:8080` | `SPRING_PROFILES_ACTIVE=prod`, DB/Redis vars |

> ⚠️ **Pitfall (fixed 2026-09-06):** the repo-root `railway.json` is pinned to
> `backend/Dockerfile`. Any service whose build context is the repo root must have its
> correct `rootDirectory` / `dockerfilePath` set on the service instance, or Railway will
> build the backend image for that service and crash it. `insurtech-web` has
> `rootDirectory=frontend` for exactly this reason.

## Domains & DNS (Cloudflare)

| Record | Value | Proxy |
|---|---|---|
| `CNAME insurtech` | `74d6w9ig.up.railway.app` | 🟧 proxied |
| (Railway service domains) | `insurtech-web-production-53c3.up.railway.app`, `insurtech-api-production-417e.up.railway.app` | — |

### Adding / changing a custom domain — the order matters

1. Add the custom domain in Railway first (`railway domain --service <svc> <fqdn>`) and note the
   required CNAME target (it changes if the domain is deleted and re-created).
2. Create the CNAME in Cloudflare with **proxy OFF (grey cloud)**. Railway cannot see the
   CNAME target behind an orange-cloud proxy, and domain validation / cert issuance will
   stall at `VALIDATING_OWNERSHIP`.
3. Wait for Railway cert status `VALID` (poll the GraphQL API, see below), verify HTTPS
   directly against the Railway edge IP.
4. Only then re-enable the Cloudflare proxy (orange cloud). Railway then shows the DNS record
   as `REQUIRES_UPDATE` — this is cosmetic; the cert is already issued and stays valid.
5. Verification TXT records (`_railway-verify.*`) can be deleted once the cert is issued.

## Deploy procedures

### Normal path (preferred)

Merge/push to `main` → both services autodeploy via GitHub triggers. Done.

### Backend hotfix deploy (manual trigger of the GitHub-connected build)

Do **not** use `railway up` for the backend — CLI uploads bypass the repo-root Dockerfile
config and Railpack fails with `Script start.sh not found`. Instead trigger a repo build:

```bash
# GraphQL against https://backboard.railway.com/graphql/v2
# (Authorization: Bearer <token from ~/.railway/config.json>, browser User-Agent required)
mutation { serviceInstanceDeploy(serviceId: "<api-service-id>", environmentId: "<env-id>") }
```

### Frontend manual deploy (if autodeploy must be bypassed)

```bash
tmp=$(mktemp -d); cp -R frontend "$tmp/frontend"; cd "$tmp/frontend"
railway link -p 34874d7a-b69e-45bb-8c77-d93d35b34e82 -e production -s insurtech-web
railway up --detach
```

(The frontend build is self-contained in `frontend/`, so CLI upload works. Never run
`railway up` from the repo root for the web service.)

### If the site serves but `/api/*` times out

nginx resolves `BACKEND_URL` at container start. If the api container restarts after web,
nginx can hold a stale internal IP. Fix: restart the web deployment
(`deploymentRestart` via API, or Railway dashboard → Restart).

## Useful API snippets

```bash
# Latest deployment status per service
query ($projectId: String!) {
  project(id: $projectId) {
    services { edges { node { name deployments(first: 1) { edges { node { status createdAt } } } } } }
  }
}

# Custom domain + cert status
query ($projectId: String!, $serviceId: String!, $environmentId: String!) {
  domains(projectId: $projectId, serviceId: $serviceId, environmentId: $environmentId) {
    customDomains { domain status { certificateStatus dnsRecords { recordType requiredValue currentValue status } } }
  }
}
```

Notes:
- `backboard.railway.com` is behind Cloudflare — requests need a browser-like `User-Agent`
  or they are blocked with `error code: 1010`.
- Environment id for `production`: `e8e5beab-7f4f-44a3-80f9-9d9b7b5d2be7`
- Service ids: web `950f46dc-02ab-4473-a441-b5165c187f25`, api `e58062c7-b7ff-43a0-bfe8-3b986d3a8b7a`

## Known pitfalls (all hit on 2026-09-06)

1. **Flyway + PostgreSQL 18**: Spring Boot 3.5 brings Flyway 11, which needs the separate
   `org.flywaydb:flyway-database-postgresql` module — without it the app dies at startup with
   `Unsupported Database: PostgreSQL 18.6`. Declared in `backend/pom.xml`.
2. **Root `railway.json`** pins `backend/Dockerfile` — see warning above.
3. **Orange-cloud CNAME before cert issuance** blocks Railway domain validation.
4. **Local `~/.railway/config.json` project links** are per-directory; a stale temp dir can
   link to the wrong project. Check with `railway status` before `railway up`.
