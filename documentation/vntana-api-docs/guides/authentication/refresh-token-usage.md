# Refresh Token Usage

> **Source:** https://help.vntana.com/refresh-token-usage

## Overview

The VNTANA Admin API makes use of temporary tokens for all endpoints after authentication. This guide clarifies the terminology used in VNTANA API guides.

**Key Concept:** All endpoints after login pass a Request Header parameter called `x-auth-token`. However, this token changes 1 or 2 times in the full authentication process, depending on your user access level.

## Authentication Flow

### Step 1: Initial Authentication

| Property | Value |
|----------|-------|
| **Method** | Authentication Key or email/password login |
| **Request** | Does NOT pass an `x-auth-token` in Request Headers |
| **Response** | Returns `x-auth-token` in Response Headers |

**Usage:** This token is used for:
- Retrieving a list of Organizations
- Generating a Refresh Token for a selected Organization

### Step 2: Generate Organization-Specific Refresh Token

**Endpoint:** `POST /v1/auth/refresh-token`

**Headers:**
```json
{
  "x-auth-token": "Bearer " + x_auth_token,
  "organizationUuid": "string"
}
```

| Property | Value |
|----------|-------|
| **Request** | Passes the `x-auth-token` from Step 1 in Request Headers |
| **Response** | Returns `x-auth-token` in Response Headers (referred to as "Refresh Token" in guides) |

**Usage depends on access level:**
- **Organization Admin/Owner:** Use this token for ALL future endpoints
- **Workspace-level access:** Use only for retrieving Workspaces and generating Workspace-specific Refresh Token

### Step 3: Generate Workspace-Specific Refresh Token (if needed)

**Endpoint:** `POST /v1/auth/refresh-token`

**Headers:**
```json
{
  "x-auth-token": "Bearer " + refreshToken,
  "organizationUuid": "string",
  "clientUuid": "string"
}
```

| Property | Value |
|----------|-------|
| **Request** | Passes the Refresh Token from Step 2 as `x-auth-token` |
| **Response** | Returns `x-auth-token` in Response Headers (the Workspace Refresh Token) |

**Important Notes:**
- This step is ONLY for users WITHOUT Organization Admin/Owner access
- Organization Admin/Owner users will receive a `BAD_CREDENTIALS` error if they attempt this
- If generated, use this token for ALL future endpoints

## Token Terminology Summary

| What the API calls it | What guides call it | When to use |
|-----------------------|---------------------|-------------|
| `x-auth-token` (from login) | x-auth-token | Get orgs, generate org refresh token |
| `x-auth-token` (from org refresh) | Refresh Token | Org Admin/Owner: all endpoints. Others: get workspaces, generate workspace refresh token |
| `x-auth-token` (from workspace refresh) | Refresh Token | Non-admin users: all endpoints |

## Token Expiration

- **All tokens expire after 30 days**
- When expired, you must re-authenticate and generate new tokens
- Implement token rotation in your application to handle expiration

## Error Handling

### FORBIDDEN (403)

If a 403 response returns `FORBIDDEN`, it can mean:

| Cause | Solution |
|-------|----------|
| Refresh token has expired | Re-authenticate and generate new tokens |
| No refresh token was sent | Include `x-auth-token` header in request |
| Token doesn't grant access to requested resource | Verify token scope matches the Organization/Workspace you're accessing |
| IP not whitelisted | Add your IP to the whitelist (if IP filtering is enabled) |

### BAD_CREDENTIALS

Some endpoints may return this error if:
- Token has expired
- Token is formatted incorrectly
- Organization Admin/Owner tries to generate Workspace-specific token (not needed for their access level)

**Note:** Generally you should see `FORBIDDEN` for token issues; `BAD_CREDENTIALS` is less common.

## Code Example: Full Authentication Flow

```bash
# Step 1: Login with personal access token (get initial x-auth-token)
X_AUTH_TOKEN=$(curl -sS -X POST "https://api-platform.vntana.com/v1/auth/login/token" \
  -H "Content-Type: application/json" \
  -d '{"personal-access-token": "your-key"}' \
  -D - -o /dev/null | grep -i x-auth-token | cut -d' ' -f2 | tr -d '\r')

# Step 2: Get Organization UUID
ORG_UUID=$(curl -sS -X GET "https://api-platform.vntana.com/v1/organizations" \
  -H "X-AUTH-TOKEN: Bearer $X_AUTH_TOKEN" | jq -r '.response.grid[0].uuid')

# Step 3: Generate Organization Refresh Token
REFRESH_TOKEN=$(curl -sS -X POST "https://api-platform.vntana.com/v1/auth/refresh-token" \
  -H "X-AUTH-TOKEN: Bearer $X_AUTH_TOKEN" \
  -H "organizationUuid: $ORG_UUID" \
  -D - -o /dev/null | grep -i x-auth-token | cut -d' ' -f2 | tr -d '\r')

# For Org Admin/Owner: Use REFRESH_TOKEN for all API calls
# For Workspace-level users: Continue to Step 4

# Step 4 (if needed): Get Workspace UUID
CLIENT_UUID=$(curl -sS -X GET "https://api-platform.vntana.com/v1/clients/client-organizations" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" | jq -r '.response.grid[0].uuid')

# Step 5 (if needed): Generate Workspace Refresh Token
WORKSPACE_TOKEN=$(curl -sS -X POST "https://api-platform.vntana.com/v1/auth/refresh-token" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "organizationUuid: $ORG_UUID" \
  -H "clientUuid: $CLIENT_UUID" \
  -D - -o /dev/null | grep -i x-auth-token | cut -d' ' -f2 | tr -d '\r')

# Use WORKSPACE_TOKEN for all subsequent API calls
```

## Related

- [API Authentication](./api-authentication.md)
- [Generate Authentication Key](./generate-auth-key.md)
- [User Management](../organizations/user-management.md) - Check user access levels
- [Organizations & Workspaces](../organizations/organizations-clients.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
