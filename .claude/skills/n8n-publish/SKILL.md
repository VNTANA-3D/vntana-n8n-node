---
name: n8n-publish
description: Publish n8n-nodes-vntana to npm with proper versioning. Use when the user says "publish", "release", "bump version", "npm publish", or asks to release a new version of the node.
---

# n8n Node Publish

Publish the n8n-nodes-vntana package to npm with version bump and verification.

## How publishing actually works

**npm publish is handled by GitHub Actions, NOT locally.** Do not run `npm publish` on this machine — it will fail with either:
- `prepublishOnly` blocks it via `n8n-node prerelease` (unless `RELEASE_MODE=1`)
- 401/404 because this machine isn't authenticated to the `n8n-nodes-vntana` npm package (CI owns the token)

A GitHub Actions workflow is triggered on tag push (`refs/tags/v*`) and runs `npm publish` from CI. Confirmed: tag push → npm notification email within ~30s.

**Therefore the local flow is:** version bump + push tag → CI publishes automatically.

## Prerequisites

- **Node version must be ≥ 20.** The `@n8n/node-cli` uses `styleText` from `node:util` (Node 20+) and fails on Node 18 with `tracingChannel is not a function` or `styleText not exported`. Switch before running anything:
  ```bash
  source ~/.nvm/nvm.sh && nvm use 22
  ```
- Working tree clean, commit your changes first.
- On `main` branch.

## Quick Publish (script)

```bash
/Users/benconway/GitHub/VNTANA-n8n-node/.claude/skills/n8n-publish/scripts/publish.sh [patch|minor|major]
```

Default is `patch`. The script bumps version, pushes the tag, and lets CI publish. It does NOT run `npm publish` locally.

## Manual Steps

```bash
cd /Users/benconway/GitHub/VNTANA-n8n-node
source ~/.nvm/nvm.sh && nvm use 22

# 1. Run fast tests (skip e2e — they require live VNTANA API + network)
npx vitest run tests/unit tests/integration

# 2. Build (verifies typecheck + artifacts)
npm run build

# 3. Bump version (creates commit + tag)
npm version patch   # or minor/major

# 4. Push main + tag — this triggers the GitHub Actions publish workflow
git push origin main --tags

# 5. Wait ~30s for CI. Verify:
#    - npm email notification arrives
#    - npm view n8n-nodes-vntana version   (should match)
```

## Testing notes

- `npm test` runs the full vitest suite including `tests/e2e/` which make real API calls to VNTANA (auth, product, render, etc.) and will fail with `ETIMEDOUT` on machines without reliable outbound access to `*.vntana.com`.
- For pre-release confidence on pure code changes, `tests/unit` + `tests/integration` (110 tests, all offline) are sufficient. Skip e2e unless you're validating the API layer itself.

## Version Types

| Type | When to Use |
|------|-------------|
| `patch` | Bug fixes, small improvements |
| `minor` | New operations, significant features |
| `major` | Breaking API changes |

## Pre-publish Checklist

- Node ≥ 20 active (`node --version`)
- GitHub repo public (n8n scanner requires it)
- All HTTP calls use `httpRequest` (not deprecated `this.helpers.request()`)
- Unit + integration tests pass
- Build succeeds
- Changes committed on `main`

## Gotchas (learned the hard way)

1. **Don't run `npm publish` locally.** It's not how this repo ships. Trust CI.
2. **Don't run `npm run release`.** That uses `release-it` which wants to do its own version bump — if you already ran `npm version`, it errors "no commits since the latest tag". Just push the tag.
3. **Node 18 breaks everything.** Every `npm run build`, `npm test`, `npm run lint`, and the publish script itself fail on Node 18 with cryptic `tracingChannel` / `styleText` errors. Always `nvm use 22` first.
4. **e2e timeouts ≠ broken code.** If tests fail only with `ETIMEDOUT` / `EHOSTUNREACH`, it's network, not your change.
