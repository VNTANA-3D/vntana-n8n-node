---
name: n8n-relink
description: Clean up and relink n8n-nodes-vntana for local development. Use when n8n is not picking up code changes, when there are multiple copies of the node installed, or when the user says "relink", "rebuild and link", "n8n not seeing changes", or asks to fix node loading issues.
---

# n8n Node Relink

Clean up stale n8n-nodes-vntana installations and create a fresh link to the dev repo.

## Quick Fix

Run the relink script, then restart n8n:

```bash
/Users/benconway/GitHub/VNTANA-n8n-node/.claude/skills/n8n-relink/scripts/relink.sh
```

## Problem

n8n loads custom nodes from multiple locations. Old versions can hide in:

| Location | Type |
|----------|------|
| `~/.n8n/nodes/node_modules/n8n-nodes-vntana` | Installed via npm |
| `~/.n8n/custom/node_modules/n8n-nodes-vntana` | Custom linked |
| Global npm | `npm list -g n8n-nodes-vntana` |

If multiple copies exist, n8n may load the wrong one.

## Manual Steps

If the script fails:

```bash
# 1. Build
cd /Users/benconway/GitHub/VNTANA-n8n-node
npm run build

# 2. Remove ALL old copies
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-vntana
rm -rf ~/.n8n/custom/node_modules/n8n-nodes-vntana

# 3. Link fresh in ~/.n8n/nodes
cd ~/.n8n/nodes && npm link n8n-nodes-vntana

# 4. Restart n8n
```

## Verification

```bash
# Check link target
ls -la ~/.n8n/nodes/node_modules/n8n-nodes-vntana
# Should show: -> /Users/benconway/GitHub/VNTANA-n8n-node

# Check no other copies exist
ls ~/.n8n/custom/node_modules/n8n-nodes-vntana 2>/dev/null && echo "WARNING: Old copy in custom!"
```
