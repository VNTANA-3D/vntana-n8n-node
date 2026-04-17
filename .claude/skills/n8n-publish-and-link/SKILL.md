---
name: n8n-publish-and-link
description: Publish n8n-nodes-vntana to npm and relink to local n8n environment. Use when the user says "publish", "push and publish", "release", or asks to publish and link the node.
---

# n8n Publish and Link

Release a new version of `n8n-nodes-vntana` and relink it into the local n8n environment.

## Key fact — publishing is CI-driven

**npm publish runs in GitHub Actions**, triggered by pushing a `v*` tag. Do NOT run `npm publish` locally:
- `package.json`'s `prepublishOnly` → `n8n-node prerelease` blocks local publishing unless `RELEASE_MODE=1`.
- Even bypassed, this machine isn't authenticated to the `n8n-nodes-vntana` npm package (CI owns the token).

Local flow: bump version → push tag → CI publishes.

## Prerequisites

Node ≥ 20. `@n8n/node-cli` breaks on Node 18 (`styleText`/`tracingChannel` errors). First:
```bash
source ~/.nvm/nvm.sh && nvm use 22
```

## Workflow

### 1. Run fast tests
```bash
npx vitest run tests/unit tests/integration
```
Skip the `tests/e2e/` directory — it hits live VNTANA APIs and will `ETIMEDOUT` on machines without network access to `*.vntana.com`. Unit + integration (110 tests) exercise the code paths that matter for pure node changes.

### 2. Build
```bash
npm run build
```

### 3. Bump version
```bash
npm version patch   # bug fixes
# or
npm version minor   # new operations / features
# or
npm version major   # breaking API changes
```
Default to `patch` unless the user says otherwise.

### 4. Push main + tag (triggers CI publish)
```bash
git push origin main --tags
```
GitHub Actions picks up `refs/tags/v*` and runs `npm publish`. Verify at https://github.com/VNTANA-3D/vntana-n8n-node/actions — you'll also get an npm email within ~30s.

### 5. Verify the version is live
```bash
npm view n8n-nodes-vntana version
```

### 6. Regenerate CHANGELOG and cut the GitHub Release (REQUIRED)

Per `AGENTS.md`, every published version must ship with both a `CHANGELOG.md` entry and a GitHub Release. Do not skip these — n8n's Creator Portal review looks for release notes when propagating to n8n Cloud.

```bash
NEW_VERSION=$(node -p "require('./package.json').version")

# Regenerate CHANGELOG from tags
npx --yes --package=auto-changelog -- auto-changelog --commit-limit false
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v$NEW_VERSION"
git push origin main

# Create the GitHub Release (body must cover: what's new, upgrade notes, diff link)
gh release create "v$NEW_VERSION" \
  --title "v$NEW_VERSION — <one-line summary>" \
  --notes-file /tmp/release-notes.md
```

### 7. Relink local n8n
```bash
/Users/benconway/GitHub/VNTANA-n8n-node/.claude/skills/n8n-relink/scripts/relink.sh
```

### 8. Final message
Remind the user to restart n8n to pick up the new node version. Also confirm the GitHub Release URL so they can share it or edit the body.

## Do NOT

- `npm publish` locally — it will 401/404 and/or be blocked by `prepublishOnly`.
- `npm run release` *after* already running `npm version` — release-it wants to own the version bump and errors "no commits since the latest tag".
- Use Node 18 — every script (`build`, `lint`, `test`, publish) fails with `styleText`/`tracingChannel` errors.
