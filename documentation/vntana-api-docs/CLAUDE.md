# VNTANA API Documentation

This directory contains comprehensive documentation for the VNTANA REST APIs for 3D content management.

## API Overview

| API | Base URL | Auth | Endpoints | Use Case |
|-----|----------|------|-----------|----------|
| **Admin API** | `https://api-platform.vntana.com` | `X-AUTH-TOKEN` header | 237 | Full CRUD, user management, analytics |
| **Public API** | `https://api.vntana.com` | Org/client slugs in URL | 18 | Read-only, embedding, public content |

## Authentication Flow (Critical for n8n Integration)

VNTANA uses a **two-step authentication process**:

### Step 1: Login (Get Temporary Token)
```bash
POST https://api-platform.vntana.com/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "email": "user@example.com",
    "session": {
      "accessToken": "temporary-token-here",
      "expiration": "2026-01-23T12:00:00Z",
      "status": "ACTIVE"
    }
  }
}
```
The token is also returned in the `X-AUTH-TOKEN` response header.

### Step 2: Refresh Token (Get Organization-Specific Token)
```bash
POST https://api-platform.vntana.com/v1/auth/refresh-token
X-AUTH-TOKEN: <temporary-token-from-step-1>
organizationUuid: <org-uuid-from-organizations-list>
```

**Response:** New `X-AUTH-TOKEN` in response header - this is the organization-specific token for all subsequent requests.

### Alternative: Personal Access Token Login
```bash
POST https://api-platform.vntana.com/v1/auth/login/token
Content-Type: application/json

{
  "personal-access-token": "your-pat-here"
}
```

### Getting Organization List
After initial login, get available organizations:
```bash
GET https://api-platform.vntana.com/v1/organizations
X-AUTH-TOKEN: <temporary-token>
```

## Key Endpoints for n8n MVP

### Products Resource

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| **Get Product** | GET | `/v1/products/{uuid}` | Requires `X-AUTH-TOKEN` |
| **Search Products** | POST | `/v1/products/clients/search` | Requires `clientUuid` |
| **Create Product** | POST | `/v1/products` | Complex - requires file upload first |
| **Update Product** | PUT | `/v1/products` | Pass `uuid` as query param |
| **Delete Product** | DELETE | `/v1/products/delete` | Soft delete |
| **Hard Delete** | DELETE | `/v1/products/hard-delete` | Permanent |
| **Update Status** | PUT | `/v1/products/status` | Change DRAFT/LIVE/etc |
| **Download Model** | GET | `/v1/products/{productUuid}/download/model` | Requires `conversionFormat=GLB` |

### Search Products Request
```bash
POST /v1/products/clients/search
X-AUTH-TOKEN: <org-token>

Query Parameters:
- clientUuid (required): Workspace UUID
- page: Page number (0-indexed)
- size: Items per page
- searchTerm: Full-text search
- status: DRAFT | LIVE_PUBLIC | LIVE_INTERNAL | APPROVED | REJECTED | WAITING_REVIEW
- conversionStatuses: PENDING | CONVERTING | COMPLETED | FAILED | NO_ASSET
- tagsUuids: Comma-separated tag UUIDs
- sorts: Sorting parameters
```

### Get Product Response Structure
```json
{
  "success": true,
  "response": {
    "uuid": "product-uuid",
    "name": "Product Name",
    "description": "Description",
    "status": "LIVE",
    "conversionStatus": "COMPLETED",
    "createdAt": "2026-01-22T10:00:00Z",
    "updatedAt": "2026-01-22T12:00:00Z",
    "thumbnailUrl": "https://...",
    "tags": [...],
    "attributes": {...}
  }
}
```

### Organizations Resource

| Operation | Method | Endpoint |
|-----------|--------|----------|
| **List Organizations** | GET | `/v1/organizations` |
| **Get Current Org** | GET | `/v1/organizations/current` |
| **Subscription Details** | GET | `/v1/organizations/subscription-details` |

### Clients (Workspaces) Resource

| Operation | Method | Endpoint |
|-----------|--------|----------|
| **Get Client** | GET | `/v1/clients/{uuid}` |
| **List Clients** | GET | `/v1/clients/client-organizations` |
| **Create Client** | POST | `/v1/clients` |
| **Update Client** | PUT | `/v1/clients` |
| **Delete Client** | DELETE | `/v1/clients/{uuid}` |

## Product Statuses

| Status | Description |
|--------|-------------|
| `DRAFT` | Initial state, not published |
| `LIVE_PUBLIC` | Published and publicly visible |
| `LIVE_INTERNAL` | Published but internal only |
| `APPROVED` | Approved for publishing |
| `REJECTED` | Rejected in review |
| `WAITING_REVIEW` | Pending approval |

## Conversion Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Queued for conversion |
| `CONVERTING` | Currently processing |
| `COMPLETED` | Ready for use |
| `FAILED` | Conversion error |
| `NO_ASSET` | No asset to process |
| `TERMINATED` | Processing stopped |
| `NOT_APPLICABLE` | Conversion not needed |

## Error Handling

### HTTP Status Codes
| Code | Meaning | Action |
|------|---------|--------|
| `200` | Success | Process response |
| `401` | Unauthorized | Re-authenticate (token expired/invalid) |
| `403` | Forbidden | Check user permissions |
| `404` | Not Found | Verify UUID and organization context |
| `409` | Conflict | Resource state conflict |
| `422` | Unprocessable Entity | Validation failed - check required fields |

### Response Structure
All responses follow this pattern:
```json
{
  "success": true|false,
  "errors": [] | {},
  "response": { ... }
}
```

## n8n Integration Notes

### Credentials Configuration
For the n8n node, use header-based authentication:
```typescript
authenticate: IAuthenticateGeneric = {
  type: 'generic',
  properties: {
    header: {
      'X-AUTH-TOKEN': '={{$credentials.apiToken}}',
    },
  },
};
```

### Recommended Credential Fields
1. **Email** (string) - For email/password auth
2. **Password** (string, password type) - For email/password auth
3. **Organization UUID** (string) - Required for org-specific operations
4. **API Token** (string, password type) - The org-specific token after auth flow

**Note:** Consider implementing OAuth2-style token management or storing the org-specific token directly to simplify the auth flow in n8n.

### Request Defaults
```typescript
requestDefaults: {
  baseURL: 'https://api-platform.vntana.com',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
}
```

### Test Endpoint for Credentials
```typescript
test: ICredentialTestRequest = {
  request: {
    baseURL: 'https://api-platform.vntana.com',
    url: '/v1/organizations/current',
  },
};
```

## File Structure

```
vntana-api-docs/
├── CLAUDE.md                         # This file
├── swagger/
│   ├── vntana-admin-api-docs.yaml   # Admin API OpenAPI spec (237 endpoints)
│   └── vntana-public-api-docs.yaml  # Public API OpenAPI spec (18 endpoints)
├── guides/
│   ├── authentication/              # Auth workflows
│   ├── getting-started/             # API overview
│   ├── products/                    # Product CRUD
│   ├── content/                     # Tags, annotations, hotspots
│   ├── organizations/               # Org management
│   ├── showrooms/                   # Showroom config
│   ├── analytics/                   # Analytics queries
│   ├── webhooks/                    # Event-driven integration
│   └── embedding/                   # 3D viewer embedding
└── quick-reference/
    ├── endpoint-cheatsheet.md       # All endpoints overview
    └── error-codes.md               # Error handling
```

## Common Workflows

### Product Upload Flow
```
1. POST /v1/auth/login                    → Get temp token
2. POST /v1/auth/refresh-token            → Get org token
3. POST /v1/storage/upload/.../sign-url   → Get upload URL
4. PUT  <signed-url>                      → Upload file
5. POST /v1/products                      → Create product
6. GET  /v1/products/{uuid}               → Check conversion status
```

### Search and Filter Products
```
1. POST /v1/auth/login + refresh-token    → Authenticate
2. GET  /v1/clients/client-organizations  → Get workspace list
3. POST /v1/products/clients/search       → Search with filters
```

## Supported 3D Formats

**Input:** GLB, GLTF, FBX, OBJ, STEP, JT, STL, 3DS, COLLADA
**Output:** GLB, USDZ (for AR), optimized variants

---

**Last Updated:** 2026-01-22
