# Insurtech News Tracker — Railway Deployment Guide

The live application is available at **https://insurtechnewstracker.chengxing.org**. This guide documents the current private-access, Google SSO, and externally scheduled weekly-digest deployment model.

> **Security model.** The application is private by default. Google SSO is enforced for reports and operational data. Collection, queue status, schedule status, subscription statistics, and bulk subscriber actions are available only to administrators. The managed Railway cron is the only process that may trigger automatic collection.

## Deployment Pipeline

Railway uses `nixpacks.toml` as the canonical build definition. Every deployment runs a frozen dependency install, TypeScript check, regression tests, and production build before starting `node dist/index.js`.

| Stage    | Command                          | Purpose                                           |
| -------- | -------------------------------- | ------------------------------------------------- |
| Install  | `pnpm install --frozen-lockfile` | Installs exactly the committed lockfile versions. |
| Validate | `pnpm check`                     | Rejects TypeScript errors.                        |
| Test     | `pnpm test`                      | Runs server-side authorization regression tests.  |
| Build    | `pnpm build`                     | Produces client and server production assets.     |

## Required Railway Variables

Set the following values in the **Railway service Variables** panel. Never put real secrets in source code, documentation, Git commits, browser URLs, or Slack messages.

| Variable                                              |    Required | Purpose                                                                                    |
| ----------------------------------------------------- | ----------: | ------------------------------------------------------------------------------------------ |
| `NODE_ENV=production`                                 |         Yes | Enables production behavior and HTTP security headers.                                     |
| `DATABASE_URL`                                        |         Yes | Connection string for the managed database.                                                |
| `BASE_URL=https://insurtechnewstracker.chengxing.org` |         Yes | Canonical public origin used in OAuth and notification links.                              |
| `OPENAI_API_KEY`                                      |         Yes | AI analysis during collection.                                                             |
| `RESEND_API_KEY`                                      |         Yes | Verified subscriber email delivery.                                                        |
| `GOOGLE_CLIENT_ID`                                    |         Yes | Google OAuth client ID.                                                                    |
| `GOOGLE_CLIENT_SECRET`                                |         Yes | Google OAuth client secret.                                                                |
| `ALLOWED_EMAILS=xingcheng4237@gmail.com`              |         Yes | Comma-separated SSO allowlist.                                                             |
| `CRON_SECRET`                                         |         Yes | Long, random secret for the Railway cron Authorization header.                             |
| `SCHEDULE_ENABLED=true`                               |         Yes | Indicates that the external schedule is active in the administrator status view.           |
| `SCHEDULE_TIME=09:00`                                 | Recommended | Displayed collection time in the configured timezone.                                      |
| `SCHEDULE_TIMEZONE=Asia/Singapore`                    | Recommended | Display timezone.                                                                          |
| `SCHEDULE_DAY_OF_WEEK=5`                              | Recommended | Friday display value; `daily` is also supported.                                           |
| `SCHEDULE_MODE=production`                            | Recommended | `production` sends to verified subscribers; `test` sends only to the fixed test recipient. |

Generate `CRON_SECRET` with a cryptographically secure generator, for example:

```bash
openssl rand -base64 48
```

## Google OAuth Configuration

In the Google Cloud OAuth client, add the following **Authorized redirect URI** exactly:

```text
https://insurtechnewstracker.chengxing.org/api/auth/google/callback
```

The application generates a short-lived, one-time OAuth state and PKCE verifier for every login. A callback is rejected unless it returns the matching state, includes the verifier cookie, and has a Google-verified email address in `ALLOWED_EMAILS`.

## Weekly Railway Cron

Create one Railway **Cron Job** named `Weekly Insurtech Digest`. The configured business preference is **Friday, 09:00 Singapore time**, which is **01:00 UTC**.

| Setting  | Value                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schedule | `0 1 * * 5`                                                                                                                                              |
| Command  | `curl --fail --silent --show-error -X POST https://insurtechnewstracker.chengxing.org/api/cron/daily-collection -H "Authorization: Bearer $CRON_SECRET"` |
| Behavior | The endpoint validates `CRON_SECRET`, queues a production collection, and returns `202 Accepted` with a job ID.                                          |

> Keep the legacy in-process scheduler disabled. It was removed from the application so that the managed Railway cron is the only automatic trigger and duplicate digests are avoided.

## Post-Deployment Verification

After Railway reports a successful deployment, verify the following without invoking state-changing administrative routes using a browser GET request.

| Check                                               | Expected result                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET /health`                                       | `200` and `{ "status": "ok" }`.                                                          |
| Open `/login`                                       | Google sign-in screen renders.                                                           |
| Unauthenticated `GET /api/trpc/news.latest`         | `401` or `403`; no report contents are returned.                                         |
| Unauthenticated `GET /admin/list-subscribers`       | `404`; the legacy route no longer exists.                                                |
| Unauthenticated `GET /admin/verify-all-subscribers` | `404`; bulk verification is available only through authenticated administrator controls. |
| `GET /api/cron/health`                              | `200` and `cronSecret: "configured"`; no secret value is returned.                       |

To validate a scheduled collection safely, use the administrator-only **Test Collect** function while signed in with the approved admin account. Do not use a browser GET request for collection or bulk subscriber actions.

## Routine Operations

Review Railway logs after each scheduled run. The cron request should log an enqueued job ID, followed by collection progress and final delivery status. If the cron health endpoint reports `cronSecret: "missing"`, add or restore the service’s `CRON_SECRET` before enabling the Cron Job.

When adding an authorized person, update `ALLOWED_EMAILS` with a comma-separated address list, redeploy, then assign the appropriate database role. Only users with `role = 'admin'` can start collection, access queue/schedule operational data, or bulk-verify subscriptions.

## Incident Response

If a credential is ever committed, **revoke or rotate it immediately** in the provider dashboard, update Railway variables, and redeploy. Sanitizing a current file does not remove a secret from Git history. Assess whether history rewrite is necessary when the repository was shared while the credential was valid.
