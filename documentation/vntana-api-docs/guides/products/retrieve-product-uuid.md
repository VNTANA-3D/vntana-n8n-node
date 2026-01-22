# Retrieve Product UUID

> **Status:** Complete
> **Source URL:** https://help.vntana.com/api-retrieve-product-uuid

## Overview

A common use of the API is to retrieve specific assets and their information for a variety of reasons, including:
- **Updating it** - Modify product metadata, tags, or settings
- **Generating an iFrame for it** - Embed the 3D viewer on external websites
- **Checking its status** - Monitor conversion progress or publication state

There are two methods available to retrieve assets:
1. **Directly using its UUID** (this guide)
2. **Executing a search** using a variety of parameters to filter results (see [Searching Products](./searching-products.md))

This guide covers how to retrieve a specific product (asset) by its UUID using both available API options:

| Option | Authentication | Use Case |
|--------|----------------|----------|
| **Admin API** | Required (`X-AUTH-TOKEN`) | Full access, internal tools, backend integrations |
| **Public API** | None (uses org/workspace slugs) | Public-facing embeds, read-only access |

### Getting the Asset UUID

To get the UUID, visit the asset's page on the VNTANA Platform and copy it from the **Asset ID** field in the asset's details panel.

> **Note:** In the API documentation, "Client" refers to Workspaces. This is legacy nomenclature that is being replaced with "Workspace" throughout the platform.

## Authentication

### Admin API
Requires `X-AUTH-TOKEN` header with a valid refresh token. The authentication workflow involves:
1. Initial login to obtain an auth token
2. Generating organization-scoped refresh tokens
3. Generating workspace-scoped refresh tokens (for non-admin users)

See [API Authentication](../authentication/api-authentication.md) for detailed authentication steps.

### Public API
No authentication required. Access is controlled through organization and workspace slugs in the URL path. The base URL for Public API is different from the Admin API:
- **Admin API:** `https://api-platform.vntana.com`
- **Public API:** `https://api.vntana.com`

## Endpoints

| Method | Endpoint | API | Description |
|--------|----------|-----|-------------|
| GET | /v1/products/{uuid} | Admin | Get product by UUID (authenticated) |
| GET /{orgSlug}/{clientSlug}/products/{uuid} | Public | Get product by UUID (public access) |

## Complete Authentication Workflow (Admin API)

### Step 1: Log In

Authenticate using an API key or email/password credentials.

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Store the `x-auth-token` returned in the response headers.

### Step 2: Retrieve Organizations (Optional)

Skip this step if you already have the Organization UUID stored locally.

```bash
curl -X GET "https://api-platform.vntana.com/v1/organizations" \
  -H "X-AUTH-TOKEN: Bearer {x_auth_token}"
```

Store the needed Organization UUID from the response.

### Step 3: Generate Organization Refresh Token

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/refresh" \
  -H "X-AUTH-TOKEN: Bearer {x_auth_token}" \
  -H "organizationUuid: {organization_uuid}"
```

Store the refresh token returned in the `x-auth-token` response header.

### Step 4: Retrieve Workspaces (Optional)

Skip this step if you already have the Workspace UUID stored locally.

```bash
curl -X GET "https://api-platform.vntana.com/v1/clients" \
  -H "X-AUTH-TOKEN: Bearer {refresh_token}"
```

Store the needed Workspace (client) UUID from the response.

### Step 5: Generate Workspace Refresh Token

**Note:** Organization Admin and Owner users must skip this step and use the token from Step 3.

```bash
curl -X POST "https://api-platform.vntana.com/v1/auth/refresh" \
  -H "X-AUTH-TOKEN: Bearer {refresh_token}" \
  -H "organizationUuid: {organization_uuid}" \
  -H "clientUuid: {workspace_uuid}"
```

Store the refresh token returned in the `x-auth-token` response header.

### Step 6: Retrieve Product by UUID

With proper authentication complete, retrieve the product:

```bash
curl -X GET "https://api-platform.vntana.com/v1/products/{product_uuid}" \
  -H "X-AUTH-TOKEN: Bearer {refresh_token}"
```

## Public API Access

The Public API does not require authentication. You only need to know:
- **Organization slug:** The URL-friendly identifier for the organization
- **Workspace slug:** The URL-friendly identifier for the workspace (client)
- **Product UUID:** The unique identifier of the product

### Finding Organization and Workspace Slugs

Slugs can be obtained in two ways:

1. **From the Platform URL:** When viewing a workspace at `https://platform.vntana.com/organization-slug/client-slug`, the slugs are visible in the URL path.

2. **Via Admin API:** Retrieve organization and workspace details through the Admin API endpoints.

### Public API Request

```bash
curl -X GET "https://api.vntana.com/{org_slug}/{client_slug}/products/{product_uuid}"
```

## Code Examples

### Admin API - Complete Workflow (Python)

```python
import requests

# Configuration
BASE_URL = "https://api-platform.vntana.com"
EMAIL = "your-email@example.com"
PASSWORD = "your-password"
ORG_UUID = "your-organization-uuid"  # Optional if known
CLIENT_UUID = "your-workspace-uuid"   # Optional if known
PRODUCT_UUID = "your-product-uuid"

# Step 1: Login
login_response = requests.post(
    f"{BASE_URL}/v1/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)
auth_token = login_response.headers.get("x-auth-token")

# Step 3: Get Organization Refresh Token
refresh_response = requests.post(
    f"{BASE_URL}/v1/auth/refresh",
    headers={
        "X-AUTH-TOKEN": f"Bearer {auth_token}",
        "organizationUuid": ORG_UUID
    }
)
refresh_token = refresh_response.headers.get("x-auth-token")

# Step 5: Get Workspace Refresh Token (skip for Org Admin/Owner)
workspace_refresh = requests.post(
    f"{BASE_URL}/v1/auth/refresh",
    headers={
        "X-AUTH-TOKEN": f"Bearer {refresh_token}",
        "organizationUuid": ORG_UUID,
        "clientUuid": CLIENT_UUID
    }
)
final_token = workspace_refresh.headers.get("x-auth-token")

# Step 6: Retrieve Product
product_response = requests.get(
    f"{BASE_URL}/v1/products/{PRODUCT_UUID}",
    headers={"X-AUTH-TOKEN": f"Bearer {final_token}"}
)
product = product_response.json()
print(product)
```

### Public API - Direct Access (curl)

```bash
# No authentication required
curl -X GET "https://api.vntana.com/acme-corp/main-catalog/products/abc123-product-uuid"
```

### Public API - iFrame Integration

The Public API can be integrated into an iFrame or configurator:

```html
<iframe
  src="https://api.vntana.com/{org_slug}/{client_slug}/embed/{product_uuid}"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>
```

## Response Examples

### Successful Response

```json
{
  "success": true,
  "data": {
    "uuid": "abc123-product-uuid",
    "name": "Product Name",
    "description": "Product description",
    "status": "LIVE",
    "conversionStatus": "COMPLETED",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:45:00Z",
    "thumbnail": "https://cdn.vntana.com/thumbnails/abc123.png",
    "tags": ["category:furniture", "material:wood"],
    "metadata": {
      "sku": "PROD-001",
      "price": "299.99"
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product with the specified UUID was not found"
  }
}
```

## Common Patterns

### Caching Organization and Workspace UUIDs

To reduce API calls, store organization and workspace UUIDs locally after the first retrieval:

```python
import json

# Save UUIDs to config file
config = {
    "organization_uuid": ORG_UUID,
    "workspace_uuid": CLIENT_UUID
}
with open("vntana_config.json", "w") as f:
    json.dump(config, f)

# Load UUIDs on subsequent runs
with open("vntana_config.json", "r") as f:
    config = json.load(f)
    ORG_UUID = config["organization_uuid"]
    CLIENT_UUID = config["workspace_uuid"]
```

### Token Refresh Strategy

Tokens have a limited lifespan. Implement automatic refresh when requests return 401:

```python
def get_product(product_uuid, token):
    response = requests.get(
        f"{BASE_URL}/v1/products/{product_uuid}",
        headers={"X-AUTH-TOKEN": f"Bearer {token}"}
    )

    if response.status_code == 401:
        # Token expired, refresh and retry
        new_token = refresh_authentication()
        return get_product(product_uuid, new_token)

    return response.json()
```

## Error Handling

| Error Code | HTTP Status | Description | Solution |
|------------|-------------|-------------|----------|
| UNAUTHORIZED | 401 | Token expired or invalid | Re-authenticate using the login flow |
| FORBIDDEN | 403 | User lacks permission | Verify user has access to the workspace |
| NOT_FOUND | 404 | Product UUID not found | Verify UUID exists and is in the correct workspace |
| INVALID_UUID | 422 | Malformed UUID format | Check UUID format is valid |

## Postman Collections

VNTANA provides Postman collections for testing:
- **Search Asset UID (Admin):** For finding product UUIDs via the Admin API
- **Retrieve Asset by UUID (Public):** For retrieving products via the Public API

See [Postman Setup Guide](../getting-started/postman.md) for importing and configuring collections.

## Related

- [API Authentication](../authentication/api-authentication.md) - Complete authentication workflow
- [Organizations and Clients](../organizations/organizations-clients.md) - Managing organizations and workspaces
- [Product Creation](./product-creation.md) - Creating new products
- [Searching Products](./searching-products.md) - Finding products and their UUIDs
- [Download Model](./download-model.md) - Downloading 3D model files
