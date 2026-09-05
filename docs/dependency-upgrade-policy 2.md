# Dependency Upgrade Regression Policy

## Purpose

Every dependency update, including upgrades to **Express**, its middleware, and transitive runtime packages, must be reviewed through a pull request and pass the automated regression gate before it is merged.

## Automated update pull requests

Dependabot checks npm packages and GitHub Actions dependencies weekly on Monday at 01:00 Singapore time. It assigns update pull requests to `xingcheng4237` and labels them `dependencies` and `automated`. Action-update pull requests also receive the `github-actions` label.

Updates affecting the Express runtime family are grouped together so that changes to `express`, `@types/express`, `express-*`, `body-parser`, `qs`, or `path-to-regexp` receive a single focused review. Minor and patch updates for other production and development dependencies are grouped separately. Major upgrades remain isolated for deliberate review. GitHub Actions updates remain in separate reviewable pull requests, preventing workflow-runtime changes from being bundled with application packages.

## Mandatory regression gate

A pull request that changes `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or npm configuration triggers the **Dependency Upgrade Regression** workflow. The workflow performs a frozen installation and runs:

| Check                              | Command                                    | Purpose                                                                                |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| Formatting                         | `pnpm lint`                                | Prevents inconsistent source and configuration formatting.                             |
| Type safety                        | `pnpm check`                               | Detects breaking TypeScript API and type-definition changes.                           |
| Route and authorization regression | `pnpm test`                                | Exercises health, SPA fallback, OAuth, protected API, and cron authorization behavior. |
| Production build                   | `pnpm build`                               | Confirms the client and server bundle can be produced.                                 |
| Production dependency audit        | `pnpm audit --prod --audit-level=moderate` | Blocks known moderate, high, and critical runtime dependency advisories.               |

The workflow also runs GitHub’s dependency-review action against dependency changes in the pull request. The combined local command is:

```bash
pnpm test:dependency-upgrade
```

## Review and merge rules

Do not merge an automated update pull request until both `Dependency upgrade regression` and `Dependency review` are successful. Major runtime upgrades, especially Express and authentication, routing, scheduling, database packages, or GitHub Actions major versions, require a manual staging check of Google SSO, SPA navigation, protected reports, admin controls, cron authorization, application health, and CI workflow execution before merge.

If the regression gate fails, retain the pull request for investigation or close it; do not work around the failure by weakening the checks.
