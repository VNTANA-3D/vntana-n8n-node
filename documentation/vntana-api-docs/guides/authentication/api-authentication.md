# API Authentication

> **Status:** Complete
> **API Base URL:** `https://api-platform.vntana.com`

## Overview

VNTANA's API uses token-based authentication. You must authenticate to obtain an `x-auth-token`, which is then passed in request headers for all subsequent API calls.

**Important Terminology:** In the API, "Client" refers to Workspaces. This is legacy nomenclature that is being replaced with "Workspace" in the platform UI.

## Authentication Methods

VNTANA supports two authentication methods:

| Method | Best For | Endpoint |
|--------|----------|----------|
| **Authentication Key** | Automation, integrations, scripts | `POST /v1/auth/login/token` |
| **Email/Password** | Interactive use, testing | `POST /v1/auth/login` |

### Method 1: Email and Password

Use your VNTANA platform credentials to authenticate.

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@example.com",
    "password": "yourPassword"
  }'
```

### Method 2: Authentication Key (Recommended)

Authentication Keys (called `personal-access-token` in the API) provide secure, revocable access without exposing your password. Generate one from the VNTANA Platform UI.

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/login/token" \
  -H "Content-Type: application/json" \
  -d '{
    "personal-access-token": "your-authentication-key"
  }'
```

### Login Response

Both methods return a success response in the body:

```json
{
  "success": true,
  "errors": [],
  "response": {
    "email": "your.email@example.com"
  }
}
```

**Important:** The `x-auth-token` is returned in the **Response Headers**, not the body. Extract it from the headers for use in subsequent requests.

## Complete Authentication Flow

The full authentication flow involves up to 5 steps, depending on your access level and whether you have cached UUIDs.

### Step 1: Login

Authenticate using either method above to obtain the initial `x-auth-token`.

### Step 2: Get Organization UUID

*Skip this step if you have the Organization UUID stored locally.*

```bash
curl -X GET "https://api-platform.vntana.com/v1/organizations" \
  -H "x-auth-token: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "org-uuid-here",
        "slug": "my-organization",
        "name": "My Organization",
        "role": "ORGANIZATION_ADMIN",
        "imageBlobId": "string",
        "created": "2020-01-31T19:17:23.972"
      }
    ]
  }
}
```

### Step 3: Generate Organization Refresh Token

Exchange your auth token for an organization-scoped refresh token.

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/refresh-token" \
  -H "x-auth-token: Bearer YOUR_AUTH_TOKEN" \
  -H "organizationUuid: org-uuid-here"
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "email": "your.email@example.com"
  }
}
```

The Organization Refresh Token is returned in the **Response Headers** as `x-auth-token`.

### Step 4: Get Workspace UUID

*Skip this step if you have the Workspace UUID stored locally.*

```bash
curl -X GET "https://api-platform.vntana.com/v1/clients/client-organizations" \
  -H "x-auth-token: Bearer YOUR_ORG_REFRESH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "workspace-uuid-here",
        "slug": "my-workspace",
        "name": "My Workspace",
        "role": "ORGANIZATION_ADMIN",
        "imageBlobId": "string",
        "created": "2020-01-31T19:17:23.972"
      }
    ]
  }
}
```

### Step 5: Generate Workspace Refresh Token

**Important:** If you have **Organization Admin or Owner level access**, skip this step. Your organization refresh token already has access to all workspaces.

For workspace-level users, generate a workspace-scoped token:

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/refresh-token" \
  -H "x-auth-token: Bearer YOUR_ORG_REFRESH_TOKEN" \
  -H "organizationUuid: org-uuid-here" \
  -H "clientUuid: workspace-uuid-here"
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "email": "your.email@example.com"
  }
}
```

The Workspace Refresh Token is returned in the **Response Headers** as `x-auth-token`.

## Using the Token

Once you have your refresh token, include it in all API requests:

```bash
curl -X GET "https://api-platform.vntana.com/v1/products" \
  -H "x-auth-token: Bearer YOUR_REFRESH_TOKEN" \
  -H "Content-Type: application/json"
```

## Refresh Token Notes

| Property | Details |
|----------|---------|
| **Lifetime** | 30 days before rotation required |
| **Revocation** | Generating a new refresh token with the same credentials immediately revokes the previous one |
| **Usage** | Pass to any endpoint as the `x-auth-token` Request Header |

## Logging Out

To invalidate/revoke a refresh token before the 30-day expiry:

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/logout" \
  -H "x-auth-token: Bearer YOUR_REFRESH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {}
}
```

Any further attempts to use the revoked token will result in a `403 Forbidden` error.

## Code Examples

### Python

```python
import requests

BASE_URL = "https://api-platform.vntana.com"

# Step 1: Login with authentication key
response = requests.post(
    f"{BASE_URL}/v1/auth/login/token",
    json={"personal-access-token": "your-auth-key"}
)
auth_token = response.headers.get("x-auth-token")

# Step 2: Get organizations
response = requests.get(
    f"{BASE_URL}/v1/organizations",
    headers={"x-auth-token": f"Bearer {auth_token}"}
)
org_uuid = response.json()["response"]["grid"][0]["uuid"]

# Step 3: Get organization refresh token
response = requests.post(
    f"{BASE_URL}/v1/auth/refresh-token",
    headers={
        "x-auth-token": f"Bearer {auth_token}",
        "organizationUuid": org_uuid
    }
)
refresh_token = response.headers.get("x-auth-token")

# Use refresh token for API calls
response = requests.get(
    f"{BASE_URL}/v1/products",
    headers={"x-auth-token": f"Bearer {refresh_token}"}
)
products = response.json()
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const BASE_URL = 'https://api-platform.vntana.com';

async function authenticate(authKey) {
  // Step 1: Login
  const loginResponse = await axios.post(
    `${BASE_URL}/v1/auth/login/token`,
    { 'personal-access-token': authKey }
  );
  const authToken = loginResponse.headers['x-auth-token'];

  // Step 2: Get organizations
  const orgsResponse = await axios.get(
    `${BASE_URL}/v1/organizations`,
    { headers: { 'x-auth-token': `Bearer ${authToken}` } }
  );
  const orgUuid = orgsResponse.data.response.grid[0].uuid;

  // Step 3: Get refresh token
  const refreshResponse = await axios.post(
    `${BASE_URL}/v1/auth/refresh-token`,
    {},
    {
      headers: {
        'x-auth-token': `Bearer ${authToken}`,
        'organizationUuid': orgUuid
      }
    }
  );

  return refreshResponse.headers['x-auth-token'];
}
```

## Postman Collection

A Postman collection is available to test Authentication endpoints. Set global variables or manually edit endpoints with necessary information. Collections can run as one chain of endpoints (select your authentication method) or individually.

## Error Handling

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `401 Unauthorized` | Invalid credentials or token | Check email/password or authentication key |
| `403 Forbidden` | Token expired or revoked | Re-authenticate to get a new token |
| `404 Not Found` | Endpoint not found | Verify the API base URL and endpoint path |

## Related

- [Generate Authentication Key](./generate-auth-key.md) - How to create authentication keys in the VNTANA Platform
- [Refresh Token Usage](./refresh-token-usage.md) - Advanced token management workflows
- [REST API Overview](../getting-started/rest-api-overview.md) - General API concepts and setup
- [Endpoint Cheatsheet](../../quick-reference/endpoint-cheatsheet.md) - Quick reference for all endpoints
- [Error Codes](../../quick-reference/error-codes.md) - Complete error code reference
