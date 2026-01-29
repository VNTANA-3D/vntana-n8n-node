---
name: vntana-auth
description: Get a valid VNTANA X-AUTH-TOKEN for API testing. Use when you need to test VNTANA API calls with curl, verify API request formats, or debug 400/401 errors. Reads credentials from the project's .env file (VNTANA_EMAIL, VNTANA_PASSWORD, VNTANA_ORGANIZATION_UUID).
---

# VNTANA Authentication

Get a valid X-AUTH-TOKEN for testing VNTANA API calls.

## Get Token

```bash
TOKEN=$(/Users/benconway/GitHub/VNTANA-n8n-node/.claude/skills/vntana-auth/scripts/get_token.sh)
echo "Token: $TOKEN"
```

## Use Token with curl

```bash
TOKEN=$(/Users/benconway/GitHub/VNTANA-n8n-node/.claude/skills/vntana-auth/scripts/get_token.sh)

curl -X POST "https://api-platform.vntana.com/v1/<endpoint>" \
  -H "Content-Type: application/json" \
  -H "X-AUTH-TOKEN: Bearer $TOKEN" \
  -d '<json-body>'
```

## Environment Variables

Required in `.env`:
- `VNTANA_EMAIL` - Account email
- `VNTANA_PASSWORD` - Account password
- `VNTANA_ORGANIZATION_UUID` - Organization UUID for token scope

Optional:
- `VNTANA_BASE_URL` - API base URL (default: https://api-platform.vntana.com)

## Testing UUIDs

The .env file also contains UUIDs for testing:
- `VNTANA_WORKSPACE_UUID` - Target workspace for operations
- `VNTANA_PRODUCT_UUID` - Test product UUID
- `VNTANA_PIPELINE_UUID` - Pipeline for 3D model uploads
