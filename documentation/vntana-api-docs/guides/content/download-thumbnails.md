# Download Posters (Thumbnails)

> **Source URL:** https://help.vntana.com/api-download-thumbnails

## Overview

You can download the **Poster image** (also called Thumbnail) generated for your 3D Assets using both the Admin API and Public API. Use cases include:
- Internal records
- Asset poster on websites with VNTANA Webviewer integration
- Automated workflows with Webhooks

**Important:** To download the Poster, the Asset must be "Published" (Live Internal or Live Public state).

**Note:** This guide covers downloading Posters only. For downloading the Asset itself, see [Download Model](../products/download-model.md).

**Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

## API Base URLs

| API | Base URL |
|-----|----------|
| Admin API | `https://api-platform.vntana.com` |
| Public API | `https://api.vntana.com` |

## Authentication

**Admin API:** Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

**Public API:** No authentication required. Uses organization and workspace slugs in URL path.

**Admin API Authentication Steps Summary:**
1. Log in using Authentication Key or email/password - Returns `x-auth-token`
2. Retrieve Organizations list and store needed UUID (skip if stored)
3. Generate Refresh Token for Organization
4. Retrieve Workspaces list and store needed UUID (skip if stored)
5. Generate Refresh Token for Workspace (Org Admin/Owner skip this)
6. Use final Refresh Token for API calls

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/products/{productUuid}/clients/{clientUuid}/thumbnails/{thumbnailBlobId} | Admin API - Download poster |
| GET | /v1/clients/client-organizations | Get list of workspaces |
| POST | /v1/products/clients/search | Search for assets |
| GET | /v1/products/{productUuid} | Get asset details |
| POST | /products/organizations/{org}/clients/{client} | Public API - Search assets |
| GET | /products/{productUuid}/organizations/{org}/clients/{client} | Public API - Get poster |

## Download via Admin API

Requires three UUIDs:
- `clientUuid` - Workspace containing the Asset
- `productUuid` - The Asset the poster belongs to
- `thumbnailBlobId` - The poster's UUID (from Asset search response)

### Step 1: Get Workspace UUID (if needed)

```bash
curl -X GET "https://api-platform.vntana.com/v1/clients/client-organizations" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "workspace-uuid",
        "slug": "some-client-slug",
        "name": "Some Client",
        "role": "ORGANIZATION_ADMIN"
      }
    ]
  }
}
```

### Step 2: Get Product UUID and Thumbnail UUID

Search for assets to retrieve both `productUuid` and `thumbnailBlobId`:

```bash
curl -X POST "https://api-platform.vntana.com/v1/products/clients/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "clientUuids": ["workspace-uuid"],
    "searchTerm": "product name"
  }'
```

**Response (key fields):**
```json
{
  "success": true,
  "response": {
    "grid": [
      {
        "uuid": "product-uuid",
        "clientUuid": "workspace-uuid",
        "asset": {
          "thumbnailBlobId": "thumbnail-uuid",
          "assetBlobId": "string",
          "conversionFormats": ["GLB", "USDZ"]
        },
        "status": "LIVE",
        "conversionStatus": "COMPLETED"
      }
    ]
  }
}
```

The `thumbnailBlobId` is at `response.grid[].asset.thumbnailBlobId`.

**Alternative:** If using Webhooks with `product.completed` event, use the `productUuid` from the webhook payload to get asset details:

```bash
curl -X GET "https://api-platform.vntana.com/v1/products/{productUuid}" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

### Step 3: Download the Poster

```bash
curl -X GET "https://api-platform.vntana.com/v1/products/{productUuid}/clients/{clientUuid}/thumbnails/{thumbnailBlobId}" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -o poster.png
```

**Optional Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `height` | Desired height in pixels |
| `width` | Desired width in pixels |

## Download via Public API

No authentication required. Requires:
- `productUuid` - Asset UUID
- `organizationSlug` - Organization's URL slug
- `clientSlug` - Workspace's URL slug

Slugs are found in Platform URLs: `https://platform.vntana.com/{org-slug}/{client-slug}`

### Step 1: Search for Product UUID

```bash
curl -X POST "https://api.vntana.com/products/organizations/{organizationSlug}/clients/{clientSlug}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "searchTerm": "product name"
  }'
```

### Step 2: Download the Poster

```bash
curl -X GET "https://api.vntana.com/products/{productUuid}/organizations/{organizationSlug}/clients/{clientSlug}" \
  -o poster.png
```

## Common Patterns

### Webhook-Based Poster Download

1. Set up webhook for `product.completed` event
2. Receive webhook with `productUuid` and `clientUuid`
3. Call asset details endpoint to get `thumbnailBlobId`
4. Download poster using all three UUIDs

### Batch Download Posters

```bash
# Search for multiple assets
curl -X POST "https://api-platform.vntana.com/v1/products/clients/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 100, "clientUuids": ["workspace-uuid"]}'

# For each result, download poster using:
# productUuid = response.grid[i].uuid
# clientUuid = response.grid[i].clientUuid
# thumbnailBlobId = response.grid[i].asset.thumbnailBlobId
```

## Important Notes

- **Fuzzy search:** Asset searches return results based on relevance. Iterate over results to match exact names if needed.
- **Draft assets hidden:** Only Live Internal or Live Public assets are returned by search endpoints.
- **Response format:** In Postman, the poster displays in the response console. Otherwise, stream the data to a file.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Asset or thumbnail doesn't exist | Verify UUIDs via search |
| 403 Forbidden | Asset in Draft state | Publish asset first |

## Related

- [Download Model](../products/download-model.md)
- [Searching Products](../products/searching-products.md)
- [Retrieve Product UUID](../products/retrieve-product-uuid.md)
- [Webhooks](../webhooks/webhooks.md)
- [Renders](./renders.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
- [Swagger Reference: Public API](/api-documentation/swagger/vntana-public-api-docs.yaml)
