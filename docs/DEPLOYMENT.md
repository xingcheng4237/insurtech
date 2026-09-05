# Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User Browser → https://www.chengxing.org                   │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  Cloudflare (CDN + DNS + SSL)                       │  │
│  │  • Caches static assets                             │  │
│  │  • Full (strict) SSL/TLS                            │  │
│  │  • Always Use HTTPS                                 │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  Cloudflare Pages — Frontend (React 18 SPA)         │  │
│  │  • Static site from GitHub Actions build            │  │
│  │  • Auto-deploy on push to main                      │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  API Calls → api.chengxing.org OR *.up.railway.app        │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │  Railway — Backend API (Spring Boot 3.x)            │  │
│  │  • Managed PostgreSQL                               │  │
│  │  • Managed Redis                                    │  │
│  │  • Auto-restart on failure                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Railway Setup (Backend)

### 1.1 Authenticate Railway CLI

```bash
# In your terminal (requires browser for OAuth)
railway login
```

### 1.2 Create Railway Project

```bash
# Navigate to project root
cd /Users/xingcheng/Documents/Kimi/Workspaces/Insurtech

# Create new project
railway init --name insurtech

# Or link to existing project
railway link
```

### 1.3 Add Services

```bash
# Add PostgreSQL database
railway add --database postgres

# Add Redis cache
railway add --database redis

# Add backend service (from backend Dockerfile)
railway up --service=insurtech-api
```

### 1.4 Configure Environment Variables

In Railway Dashboard (or CLI):

```bash
railway variables set SPRING_PROFILES_ACTIVE=prod
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set CORS_ALLOWED_ORIGINS="https://www.chengxing.org,https://insurtech.pages.dev"
```

> **Note**: `SPRING_DATASOURCE_URL` and `SPRING_REDIS_URL` are auto-populated by Railway when you provision PostgreSQL and Redis.

### 1.5 Deploy Backend

```bash
cd backend
railway up --service=insurtech-api
```

Verify: `railway status` → should show `Healthy`

---

## Step 2: Cloudflare Pages Setup (Frontend)

### 2.1 Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project"
3. Connect to GitHub repository
4. Build settings:
   - Build command: `cd frontend && npm ci && npm run build`
   - Build output directory: `frontend/dist`

### 2.2 Add Environment Variables

In Cloudflare Pages project settings:

```
VITE_API_URL=https://insurtech-api.up.railway.app/api
```

### 2.3 Custom Domain

1. In Cloudflare Pages → Custom domains
2. Add `www.chengxing.org`
3. Cloudflare will auto-configure DNS

---

## Step 3: Cloudflare DNS Configuration

### 3.1 DNS Records

In Cloudflare DNS dashboard for `chengxing.org`:

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | www | `<your-pages-project>.pages.dev` | Proxied (orange cloud) |
| CNAME | api | `insurtech-api.up.railway.app` | Proxied (orange cloud) |

### 3.2 SSL/TLS Settings

- **Encryption mode**: Full (strict)
- **Always Use HTTPS**: ON
- **Auto Minify**: HTML, CSS, JS → ON

---

## Step 4: GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret | Value | How to Get |
|--------|-------|------------|
| `RAILWAY_TOKEN` | Railway API token | Railway Dashboard → Account → Tokens |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | Cloudflare → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare dashboard sidebar |

---

## Step 5: Verify Deployment

### 5.1 Check Backend Health

```bash
curl https://api.chengxing.org/api/v1/health
# OR
curl https://insurtech-api.up.railway.app/api/v1/health
```

Expected response:
```json
{
  "status": "UP",
  "service": "insurtech-backend",
  "version": "0.0.1-SNAPSHOT",
  "uptimeSeconds": 123
}
```

### 5.2 Check Frontend

Open `https://www.chengxing.org` in browser.

You should see:
- Insurtech Platform landing page
- Backend health status displayed
- No console errors

---

## Local Development

```bash
# Start all services locally
docker compose up

# Backend only
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Frontend only
cd frontend && npm run dev
```

---

## Troubleshooting

### Railway deployment fails
```bash
railway logs --service=insurtech-api
```

### Cloudflare 522 error (backend)
- Check Railway service is running: `railway status`
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain

### Frontend can't reach backend
- Check `VITE_API_URL` is set correctly in Cloudflare Pages
- Verify Cloudflare DNS record for `api` subdomain

### Database connection errors
- Ensure Railway PostgreSQL is provisioned
- Check `SPRING_DATASOURCE_URL` is auto-populated
