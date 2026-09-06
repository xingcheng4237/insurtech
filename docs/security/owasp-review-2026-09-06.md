# OWASP Top 10 Security Review Report

## Review Summary

- **Scope:** Whole repo — `backend/` (Spring Boot 3.2.5: `InsurtechApplication`, `SecurityConfig`, `WebConfig`, `HealthController`, `application*.yml`, Flyway V1/V2, `pom.xml`, `Dockerfile`), `frontend/` (React 18 + Vite: `App.tsx`, `main.tsx`, `index.html`, `vite.config.ts`, `package.json`, `Dockerfile`, `nginx.conf`, `railway.json`), root (`docker-compose.yml`, `.env.example`, `railway.json`, `.github/workflows/ci-cd.yml`, `.github/dependabot.yml`, `.railway/railway.ts`), plus git history secret scan and `npm audit`
- **Date:** 2026-09-06
- **Risk summary:** 🔴 RED High ×0 | 🟡 YELLOW Medium ×6 | 🟢 GREEN Low ×7 | ✅ PASS ×2
- **Context note:** The app currently exposes only `GET /api/v1/health` (no auth, no business endpoints, no DB queries in code). Several YELLOWs are design-stage risks that become RED the moment policy/claims endpoints (per `V1__init.sql`: customer PII, premium amounts) ship without remediation.

---

## Findings (sorted by severity, descending)

### 🟡 YELLOW A01 — All endpoints permit all access (`anyRequest().permitAll()`)

- **Location:** `backend/src/main/java/com/insurtech/config/SecurityConfig.java:38`
- **Description:** The security filter chain permits every request to every endpoint. Today only the health controller exists, so nothing sensitive leaks — but any future controller (policies, claims, customers) will be **public by default**. A missing `@PreAuthorize` or an unlisted path will silently ship unauthenticated.
- **Impact:** Broken access control by default for all future endpoints; IDOR/unauthenticated data access the moment business endpoints land.
- **Fix:** Flip the default to *deny-by-authenticated* and explicitly open only public routes:

```java
// SecurityConfig.java — replace the authorizeHttpRequests block
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/health", "/actuator/health").permitAll()
    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll() // optional
    .anyRequest().authenticated()   // was: permitAll()
)
// and when the auth module lands:
// .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
```

Until JWT is wired, `authenticated()` with no configured authentication mechanism returns 401 for business endpoints — which is the *safe* failure mode (fail closed, not open).

---

### 🟡 YELLOW A01 — CORS: `allowCredentials(true)` combined with wildcard origin `https://*.up.railway.app`

- **Location:** `backend/src/main/java/com/insurtech/config/SecurityConfig.java:52-62` and duplicated in `backend/src/main/java/com/insurtech/config/WebConfig.java:20-28`
- **Description:** `*.up.railway.app` matches **every Railway-hosted site on the internet**, not just yours. With `allowCredentials(true)`, any Railway tenant's page can make credentialed cross-origin requests to your API once cookies exist. (Today no cookie auth exists, limiting impact.)
- **Impact:** Once session cookies/JWT-in-cookie auth ships, any `*.up.railway.app` origin can ride a victim's credentials.
- **Fix:** Narrow to exact origins and drop credentials until cookie auth actually exists:

```java
// SecurityConfig.java — corsConfigurationSource()
config.setAllowedOrigins(List.of(
    "http://localhost:3000",
    "http://localhost:5173",
    "https://www.chengxing.org",
    "https://insurtech-web-production-53c3.up.railway.app"  // exact, no wildcard
));
config.setAllowCredentials(false); // flip to true only when cookie auth ships
```

Also remove the duplicate CORS mapping in `WebConfig.java` (single source of truth in `SecurityConfig`) — two copies will drift.

---

### 🟡 YELLOW A01 — Actuator `health` details and `metrics` exposed publicly

- **Location:** `backend/src/main/resources/application.yml:25-29`
- **Description:** `management.endpoints.web.exposure.include: health,info,metrics` plus `endpoint.health.show-details: always`, combined with `permitAll`, means anyone on the internet can read detailed health (DB/disk/mail components) and all micrometer metrics of the live pod.
- **Impact:** Information disclosure useful for reconnaissance (internal component states, JVM metrics, request counts).
- **Fix:**

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health          # drop info,metrics from public exposure
  endpoint:
    health:
      show-details: when_authorized   # was: always
```

Keep `metrics` enabled but bind it to a management port or secure it in `SecurityConfig` with `.requestMatchers("/actuator/**").hasRole("ADMIN")` when roles exist.

---

### 🟡 YELLOW A06 — Vulnerable build tooling: `vite ≤6.4.1` (high) and `esbuild ≤0.24.2` (moderate)

- **Location:** `frontend/package.json:39` (`"vite": "^5.2.10"`, resolved 5.4.21) — confirmed by `npm audit` on 2026-09-06
- **Description:**
  - `vite` — GHSA-4w7w-66w2-5vf9, path traversal in optimized-deps `.map` handling (CWE-22/CWE-200)
  - `esbuild` — GHSA-67mh-4wv8-2f99, dev server accepts cross-site requests (CWE-346, CVSS 5.3)
- **Impact:** Both are **build-time/dev-server only** (production is nginx serving static files), so real-world exposure is limited to developer machines running `npm run dev`. Not exploitable against the deployed site.
- **Fix:** Upgrade vite to ≥6.4.2 (also pulls esbuild ≥0.25):

```bash
cd frontend
npm install --save-dev vite@^6.4.2 @vitejs/plugin-react@latest
npm run build   # verify the build still passes
npm audit       # expect 0 vulnerabilities
```

---

### 🟡 YELLOW A06 — Spring Boot 3.2.5 is far behind the patch line

- **Location:** `backend/pom.xml:11`
- **Description:** Spring Boot 3.2.5 (April 2024) is >1 year old; the 3.2.x line accumulated multiple security patches since (Spring Framework 6.1.x CVEs fixed in later 3.2.x/3.3.x releases). No `mvn dependency:check` was runnable locally (no JDK on this machine), so this is a version-age advisory, not a confirmed-CVE list. Same for `springdoc-openapi 2.5.0` (`pom.xml:86`) and `spring-modulith 1.1.3` (`pom.xml:25`).
- **Impact:** Exposure to already-public framework CVEs; risk grows while the version stays pinned.
- **Fix:**

```xml
<!-- pom.xml — move to the current stable line and let CI verify -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.5</version>   <!-- or latest 3.5.x at upgrade time -->
    <relativePath/>
</parent>
```

Then `mvn -B clean verify` (CI already does this) and spot-check the health endpoint. Also add OWASP dependency-check to CI:

```yaml
# .github/workflows/ci-cd.yml — add to backend-test steps
- name: OWASP Dependency-Check
  working-directory: ./backend
  run: mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
```

---

### 🟡 YELLOW A07 — No authentication mechanism exists (JWT planned but absent)

- **Location:** `backend/pom.xml:46-49` (`spring-boot-starter-oauth2-resource-server` declared but never configured); `.env.example:14` (`JWT_SECRET=change-me-in-production`, unused)
- **Description:** No login, no token validation, no session management, no rate limiting/lockout — because there is nothing to authenticate against yet. This is acceptable for a scaffold but must not survive the first business endpoint.
- **Impact:** Same blast radius as the A01 `permitAll` finding; listed separately because the fix is a different workstream (the auth module).
- **Fix (when the auth change lands):**

```java
// SecurityConfig.java
http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt
    .decoder(NimbusJwtDecoder.withSecretKey(
        new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"))
        .build())));
```

```yaml
# application-prod.yml — never a default/placeholder secret in prod
app:
  jwt:
    secret: ${JWT_SECRET:}   # empty default → fail fast at startup if unset
```

Requirements for that change: HS256 minimum (prefer RS256 via JWKS), mandatory `exp` validation, token revocation strategy, and login rate limiting (e.g., bucket4j or Redis-backed — Redis is already provisioned).

---

### 🟢 GREEN A02 — Hardcoded dev database credentials in `docker-compose.yml`

- **Location:** `docker-compose.yml:6-8` (`insurtech/insurtech`)
- **Description:** Standard for local-only dev; compose is not used in prod (Railway injects real credentials via reference variables — verified no secrets in repo or git history).
- **Fix (defense-in-depth):** reference `.env` instead of literals:

```yaml
environment:
  POSTGRES_DB: ${DB_NAME:-insurtech}
  POSTGRES_USER: ${DB_USER:-insurtech}
  POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
```

---

### 🟢 GREEN A04 — No rate limiting anywhere

- **Location:** `frontend/nginx.conf` (no `limit_req_zone`), backend (no throttle filter)
- **Description:** Only a health endpoint today, but there is no throttling design for future login/quote/claim endpoints.
- **Fix (nginx layer, ready when endpoints land):**

```nginx
# nginx.conf — inside server {}
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api {
    limit_req zone=api burst=20 nodelay;
    proxy_pass ${BACKEND_URL};
    # ... existing headers
}
```

---

### 🟢 GREEN A05 — No HTTP security headers in nginx

- **Location:** `frontend/nginx.conf:1-17`
- **Description:** Missing `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`, HSTS.
- **Fix:**

```nginx
# nginx.conf — inside server {}
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${BACKEND_URL}" always;
# HSTS only once a custom domain with stable HTTPS is live:
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### 🟢 GREEN A05 — Containers run as root; health endpoint leaks version/uptime

- **Location:** `backend/Dockerfile` (no `USER` directive), `frontend/Dockerfile` (nginx master as root), `backend/src/main/java/com/insurtech/health/HealthController.java:19-23`
- **Description:** Backend JVM runs as root inside the container. Health payload exposes exact version and uptime — minor fingerprinting aid.
- **Fix:**

```dockerfile
# backend/Dockerfile — runtime stage, before ENTRYPOINT
RUN addgroup -S app && adduser -S app -G app
USER app
```

(nginx in the official image already drops workers to the `nginx` user; the master-as-root pattern is acceptable.) Consider trimming `version`/`uptimeSeconds` from the public health payload once a protected actuator health exists.

---

### 🟢 GREEN A08 — CI/CD integrity: actions pinned to major version, `apk add maven` unpinned

- **Location:** `.github/workflows/ci-cd.yml:13,14,27,28` (`actions/checkout@v4` etc.), `backend/Dockerfile:6`
- **Description:** Major-version tags are mutable; the Docker build pulls `maven` from Alpine repos without a version pin. Supply-chain hardening gap, no known incident.
- **Fix:** pin actions to commit SHAs (Dependabot already updates them — it will keep SHA pins current):

```yaml
- uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955   # v4.3.0
```

Positives already in place: `package-lock.json` committed (as of today), Dependabot active on `/frontend` and `github-actions`, no `pickle`-style unsafe deserialization anywhere (Java/TS only).

---

### 🟢 GREEN A09 — No security-event logging yet

- **Location:** backend (no auth/events to log); `application.yml:34` (`com.insurtech: DEBUG` in base profile — correctly overridden to `INFO` in `application-prod.yml`)
- **Description:** Nothing sensitive is logged today (no auth, no user data). When auth lands, log success/failure with IP, never passwords/tokens.
- **Fix (pattern to adopt with the auth module):**

```java
private static final Logger SEC_LOG = LoggerFactory.getLogger("SECURITY");
// on auth failure:
SEC_LOG.warn("auth_failed user={} ip={}", username, request.getRemoteAddr());
// never log: passwords, JWTs, Authorization headers
```

---

### ✅ PASS A03 — Injection — No issues found

No SQL in application code (no repositories/queries yet; Flyway migrations are static DDL). JPA/Hibernate parameterizes by default. No `Runtime.exec`/shell usage. Frontend renders via React (auto-escapes); `App.tsx:33` uses `JSON.stringify` inside `<pre>` — safe, no `dangerouslySetInnerHTML` anywhere.

### ✅ PASS A10 — SSRF — No issues found

No server-side fetching of user-supplied URLs. `nginx.conf:12` `proxy_pass ${BACKEND_URL}` is operator-controlled at deploy time, not request-driven. Frontend `fetch` target (`App.tsx:8-9`) is a build-time constant.

---

## Remediation Priority

1. **A06 vite/esbuild upgrade** — one command, zero risk, clears the only scanner-confirmed vulnerabilities. Do first.
2. **A06 Spring Boot 3.2.5 → 3.5.x + dependency-check in CI** — must happen before business endpoints ship; do it now while the app is a 3-class scaffold (cheap to verify).
3. **A01 `anyRequest().permitAll()` → `authenticated()`** — fail closed *before* the first controller lands; this is the single highest-leverage change.
4. **A01 CORS narrowing** — exact origins + `allowCredentials(false)`; 5-line change, removes the `*.up.railway.app` trust of arbitrary tenants.
5. **A01 actuator exposure** — drop `metrics`, `show-details: when_authorized`.
6. **A07 auth module** — the planned OAuth2/JWT resource-server workstream (items 3–5 are its prerequisites).
7. **GREEN batch** — nginx security headers + rate-limit zone, non-root backend container, SHA-pinned actions, docker-compose env-ified credentials, security logging pattern.
