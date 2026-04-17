# Agent Guidelines — n8n-nodes-vntana

## Releases always ship with release notes

Every published version of this package **must** have both of the following, without exception:

1. **An entry in `CHANGELOG.md`** for the new version (regenerated via `auto-changelog` from git tags + commits).
2. **A GitHub Release** at `https://github.com/VNTANA-3D/vntana-n8n-node/releases/tag/v<version>` with a human-written body covering:
   - **What's new** — a short paragraph a non-engineer user can understand.
   - **Breaking changes / upgrade notes** — explicit, actionable steps when a change requires users to do anything (re-enter credentials, rerun a workflow, change config). If there are none, say "No action required".
   - **A link to the full diff** — `compare/v<prev>...v<new>`.

### Why this matters

n8n's Creator Portal auto-propagates new npm versions to n8n Cloud on a bi-weekly cadence, and the n8n team's review step explicitly looks at release notes. Shipping without them delays propagation and leaves self-hosted users to reverse-engineer behavior changes.

### When to do it

- The `n8n-publish` skill owns enforcement: its workflow regenerates `CHANGELOG.md` and drafts the GitHub Release as part of the publish flow. Do not skip those steps even for a "tiny fix" patch release.
- For breaking changes (credential schema, node parameter changes, API contract shifts), also write a "Migrating from vX.Y" section in the release body that a user can follow in under two minutes.

## Commit style

Conventional Commits: `feat(scope):`, `fix(scope):`, `docs(scope):`, `chore:`, `test:`, `refactor:`. Scope is usually `credentials`, `node`, `skills`, or omitted.

## Testing

- Fast suite: `npx vitest run tests/unit tests/integration` (offline, ~110 tests, required before every publish).
- Full suite: `npm test` (includes `tests/e2e/` which hit live VNTANA APIs — only run when you have outbound network to `*.vntana.com` and valid `.env` credentials).

## Publishing

Tag push (`v*.*.*`) triggers GitHub Actions which runs `npm publish` with provenance. Do not run `npm publish` locally — it will fail. See the `n8n-publish` skill for the full flow.
