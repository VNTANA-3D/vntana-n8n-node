---
name: n8n-publish
description: Publish n8n-nodes-vntana to npm with proper versioning. Use when the user says "publish", "release", "bump version", "npm publish", or asks to release a new version of the node.
---

# n8n Node Publish

Publish the n8n-nodes-vntana package to npm with version bump and verification.

## Quick Publish

Run the publish script:

```bash
/Users/benconway/GitHub/VNTANA-n8n-node/.claude/skills/n8n-publish/scripts/publish.sh [patch|minor|major]
```

Default is `patch`. Use `minor` for new features, `major` for breaking changes.

## Manual Steps

If the script fails or you need manual control:

```bash
cd /Users/benconway/GitHub/VNTANA-n8n-node

# 1. Run tests
npm test

# 2. Build
npm run build

# 3. Bump version (creates commit + tag)
npm version patch   # or minor/major

# 4. Push to GitHub with tags
git push origin main --tags

# 5. Publish to npm
npm publish

# 6. Verify with scanner
npx @n8n/scan-community-package n8n-nodes-vntana@<new-version>
```

## Version Types

| Type | When to Use |
|------|-------------|
| `patch` | Bug fixes, small improvements |
| `minor` | New operations, significant features |
| `major` | Breaking API changes |

## Pre-publish Checklist

- GitHub repo must be public (n8n scanner verifies this)
- All code uses `httpRequest` (not deprecated `this.helpers.request()`)
- Tests pass
- Build succeeds
