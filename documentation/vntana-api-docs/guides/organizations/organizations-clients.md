# API - Retrieve Organizations and Workspaces

> **Source URL:** https://help.vntana.com/api-organizations-clients
> **API Base URL:** https://api-platform.vntana.com

## Overview

A key step in any interaction with the VNTANA API is the retrieval of the Organization and Workspace you wish to work with. This is covered as part of the Authentication guide as in order to properly authenticate with a refresh token the Organization UUID and Workspace UUID are required. This guide dives deeper into the endpoints and what information they return.

**Note:** In the API documentation, "Client" refers to Workspaces (folders within an Organization). The "Client" nomenclature is a legacy reference being replaced with "Workspace."

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/auth/login | Login with email/password |
| GET | /v1/organizations | List all organizations for user |
| POST | /v1/auth/refresh-token | Generate organization refresh token |
| GET | /v1/clients/client-organizations | List all workspaces in organization |

## Retrieve Organizations

Before retrieving the list of Organizations, you must log in with either email/password or authentication key.

### Step 1: Login

**Endpoint:** `POST /v1/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "yourPassword"
}
```

**Response:**

```json
{
  "success": true,
  "errors": [],
  "response": {
    "email": "user@example.com"
  }
}
```

The `x-auth-token` is returned in the **Response Headers**.

### Step 2: Get Organizations

**Endpoint:** `GET /v1/organizations`

**Headers:**

```
X-AUTH-TOKEN: Bearer {x_auth_token}
```

**Note:** The endpoint will need the current token associated with your user, whether it is the x-auth-token from the login endpoints or a refresh token from `/v1/auth/refresh-token`.

**Response:**

```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "org-uuid-string",
        "slug": "some-organization",
        "name": "Some Organization",
        "role": "ORGANIZATION_ADMIN",
        "imageBlobId": "",
        "created": "2022-06-20T14:42:15.488732"
      }
    ]
  }
}
```

### Organization Response Fields

| Field | Description |
|-------|-------------|
| `uuid` | Unique ID of the Organization. Used for generating refresh tokens and accessing Organization-level (not Workspace-specific) data. |
| `slug` | Unique identifier generated from the Organization name. Used in embed links, iFrames, and Public API endpoints. Find it in the URL: `https://platform.vntana.com/{org-slug}/{workspace-slug}` |
| `name` | Name of the Organization. Not unique - use slug for verification. |
| `role` | Your role within the Organization. Determines if Workspace-level authentication is needed (Org Owners/Admins don't need it). |
| `imageBlobId` | UUID of the Organization's profile picture (optional). |
| `created` | Timestamp of when the Organization was created. |

## Retrieve Workspaces

Most API use requires a Workspace UUID. First, generate an Organization-specific refresh token.

### Step 3: Generate Organization Refresh Token

**Endpoint:** `POST /v1/auth/refresh-token`

**Headers:**

```
X-AUTH-TOKEN: Bearer {x_auth_token}
organizationUuid: {org-uuid-string}
```

**Response:**

```json
{
  "success": true,
  "errors": [],
  "response": {
    "email": "user@example.com"
  }
}
```

The **Refresh Token** is returned in the **Response Headers** as `x-auth-token`.

### Step 4: Get Workspaces

**Endpoint:** `GET /v1/clients/client-organizations`

**Headers:**

```
X-AUTH-TOKEN: Bearer {refresh_token}
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
        "uuid": "workspace-uuid-string",
        "slug": "some-workspace-slug",
        "name": "Some Workspace",
        "role": "ORGANIZATION_ADMIN",
        "imageBlobId": "image-uuid-string",
        "created": "2020-01-31T19:17:23.972"
      }
    ]
  }
}
```

### Workspace Response Fields

| Field | Description |
|-------|-------------|
| `uuid` | Unique ID of the Workspace. Used for most API calls involving entities linked to a specific Workspace. |
| `slug` | Unique identifier generated from Workspace name. Used in embed links, iFrames, and Public API endpoints. Find it in URL: `https://platform.vntana.com/{org-slug}/{workspace-slug}`. **Note:** The slug cannot be changed after creation, even if the name is updated. |
| `name` | Name of the Workspace. Not unique - use slug for verification. |
| `role` | Your role in the Organization. Workspace-level access means only assigned Workspaces are returned. |
| `imageBlobId` | UUID of the Workspace's profile picture. |
| `created` | Timestamp of when the Workspace was created. |

## Code Examples

### Complete Workflow (curl)

```bash
# 1. Login
curl -X POST "https://api-platform.vntana.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  -D - # Outputs headers to capture x-auth-token

# 2. Get Organizations
curl -X GET "https://api-platform.vntana.com/v1/organizations" \
  -H "X-AUTH-TOKEN: Bearer $X_AUTH_TOKEN"

# 3. Generate Organization Refresh Token
curl -X POST "https://api-platform.vntana.com/v1/auth/refresh-token" \
  -H "X-AUTH-TOKEN: Bearer $X_AUTH_TOKEN" \
  -H "organizationUuid: $ORG_UUID" \
  -D - # Outputs headers to capture new x-auth-token (refresh token)

# 4. Get Workspaces
curl -X GET "https://api-platform.vntana.com/v1/clients/client-organizations" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

## Common Patterns

### Finding Slugs Manually

Organization and Workspace slugs can be found in the Platform URL:

```
https://platform.vntana.com/{organization-slug}/{workspace-slug}
```

### Role-Based Authentication

| Role | Authentication Level |
|------|---------------------|
| ORGANIZATION_OWNER | Organization-level only (no Workspace auth needed) |
| ORGANIZATION_ADMIN | Organization-level only (no Workspace auth needed) |
| Workspace-level roles | Must authenticate to specific Workspace |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid or expired token | Re-authenticate with login |
| 403 Forbidden | No access to Organization/Workspace | Verify user has proper role |
| 404 Not Found | Organization/Workspace doesn't exist | Verify UUIDs |

## Key Points

- **Organization UUID** and **Workspace UUID** are required for most VNTANA Admin API interactions
- Organization Owners/Admins can access all Workspaces without Workspace-level authentication
- Workspace-level users only see Workspaces they've been explicitly added to
- Slugs are permanent identifiers (won't change even if names are updated)
- You can also receive Organization/Workspace info via [Webhooks](../webhooks/webhooks.md) for events like Workspace creation

## Related

- [API Authentication](../authentication/api-authentication.md)
- [Refresh Token Usage](../authentication/refresh-token-usage.md)
- [iFrames](../embedding/iframes.md)
- [Webhooks](../webhooks/webhooks.md) - Subscribe to `workspace.added` event
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
