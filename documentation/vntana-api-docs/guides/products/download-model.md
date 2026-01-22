# Downloading an Asset

> **Status:** Complete
> **Source URL:** https://help.vntana.com/api-download-model

## Overview

A key feature of the VNTANA Platform is the ability to download:
- The **Original file** that was uploaded
- **Optimized 3D model** versions in GLB, FBX, and USDZ formats

Downloads are available via both the Admin API and Public API.

**Important:** To download files, the Asset must be "Published" (Live Internal or Live Public state).

**Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

## API Base URLs

| API | Base URL |
|-----|----------|
| Admin API | `https://api-platform.vntana.com` |
| Public API | `https://api.vntana.com` |

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

**Authentication Steps Summary:**
1. Log in using Authentication Key or email/password - Returns `x-auth-token`
2. Retrieve Organizations list and store needed UUID (skip if stored)
3. Generate Refresh Token for Organization
4. Retrieve Workspaces list and store needed UUID (skip if stored)
5. Generate Refresh Token for Workspace (Org Admin/Owner skip this)
6. Use final Refresh Token for API calls

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/storage/download/clients/sign-url | Generate signed URL for resumable download |
| GET | /v1/products/{uuid}/download/asset | Direct download original file |
| GET | /v1/products/{uuid}/download/model | Direct download optimized model |
| POST | /products/organizations/{org}/clients/{client} | Public API search |
| GET | /products/organizations/{org}/clients/{client}/{blobId} | Public API download |

## Resumable Download (Recommended)

The recommended method for downloading files. Supports:
- Parallel chunk downloads for large files
- Resume interrupted downloads
- Byte range control

### Step 1: Generate Signed URL

```
Method: POST
Endpoint: /v1/storage/download/clients/sign-url
Headers: {
  'x-auth-token': 'Bearer ' + refreshToken,
  'Origin': 'https://api-platform.vntana.com'
}
Body: {
  "entityUuid": "string",
  "storeType": "string",
  "format": "string"
}
```

**Body Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `entityUuid` | Yes | UUID of the entity (assetUuid/productUuid) |
| `storeType` | Yes | Type of stored entity (see below) |
| `format` | No | For 3D files: FBX, USDZ, GLB, OBJ, STEP |

**storeType Values:**
- `ASSET` - Original file (not optimized)
- `MODEL` - Optimized format of 3D Asset
- `ATTACHMENT` - File uploaded as attachment
- `RENDER` - Static render from Renders tab
- `TURNTABLE` - Turntable from Renders tab

**Note:** For ATTACHMENT, RENDER, and TURNTABLE types, use the `uuid` from the search response (ignore `entityUuid` and `blobId`).

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "requestUuid": "d2db28bb-e015-4037-8961-e05ca127de75",
    "location": "signed-url-string"
  }
}
```

### Step 2: Download from Signed URL

```
Method: GET
URL: {{ signedURL }}
Headers: {
  'Range': 'bytes=0-1999'  // Optional
}
```

The `Range` header is optional but useful for:
- Breaking downloads into parallel chunks
- Resuming stopped downloads

**Response Headers:**
```
Content-Range: bytes 0-1999/11955
Content-Length: 2000
```

This shows 2000 bytes downloaded out of 11,955 total bytes.

## Direct Download (Alternative)

Simpler but cannot control or resume downloads.

### Download Original File

```bash
curl -X GET "https://api-platform.vntana.com/v1/products/{productUuid}/download/asset?clientUuid={clientUuid}" \
  -H "X-AUTH-TOKEN: Bearer your-refresh-token"
```

### Download Optimized Model

```bash
curl -X GET "https://api-platform.vntana.com/v1/products/{productUuid}/download/model?clientUuid={clientUuid}&conversionFormat=GLB" \
  -H "X-AUTH-TOKEN: Bearer your-refresh-token"
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `clientUuid` | Yes | Workspace UUID |
| `conversionFormat` | Yes (for model) | GLB, FBX, or USDZ |

**Note:** For non-3D files, use `/download/asset` only.

## Verifying Available Formats

Before downloading, verify the format is available via search. Check the `asset.models` section:

```json
{
  "asset": {
    "conversionFormats": ["GLB", "USDZ", "FBX"],
    "models": [
      {
        "uuid": "string",
        "conversionFormat": "GLB",
        "modelBlobId": "string.glb",
        "conversionStatus": "COMPLETED",
        "modelSize": 52777040
      },
      {
        "uuid": "string",
        "conversionFormat": "USDZ",
        "modelBlobId": "string.usdz",
        "conversionStatus": "COMPLETED",
        "modelSize": 31200469
      }
    ]
  }
}
```

Check `conversionStatus: "COMPLETED"` before attempting download.

## Public API Download

No authentication required. Requires:
- `productUuid`: Asset UUID
- `blobId`: UUID of converted file (unique per format)
- `organizationSlug`: Organization's URL slug
- `clientSlug`: Workspace's URL slug

Slugs are found in Platform URLs: `https://platform.vntana.com/{org-slug}/{client-slug}`

### Step 1: Search for Asset

```bash
curl -X POST "https://api.vntana.com/products/organizations/{organizationSlug}/clients/{clientSlug}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "searchTerm": "string",
    "tagName": "string",
    "attributeKey": "string",
    "attributeValue": "string"
  }'
```

Response includes `uuid` (productUuid) and `modelBlobId` for each format.

### Step 2: Download File

```bash
curl -X GET "https://api.vntana.com/products/organizations/{organizationSlug}/clients/{clientSlug}/{blobId}" \
  -o downloaded-model.glb
```

Use `modelBlobId` from `response.grid.asset.models` for optimized formats, or `assetBlobId` from `response.grid.asset` for original.

## Getting Workspace UUID

If you need the clientUuid:

```bash
curl -X GET "https://api-platform.vntana.com/v1/clients/client-organizations" \
  -H "X-AUTH-TOKEN: Bearer your-refresh-token"
```

**Tip:** Webhooks for `product.completed` events include `clientUuid` in the payload.

## Common Patterns

### Download All Formats for a Product

```bash
# 1. Search for product to get UUIDs
curl -X POST "https://api-platform.vntana.com/v1/products/search" \
  -H "X-AUTH-TOKEN: Bearer your-token" \
  -d '{"searchTerm": "product-name"}'

# 2. For each format in asset.models where conversionStatus is COMPLETED:
#    Download using the appropriate endpoint
```

### Resumable Download with Chunks

```bash
# Get total file size from initial request
curl -I "{{ signedURL }}"
# Response: Content-Length: 52777040

# Download in 10MB chunks
curl -H "Range: bytes=0-10485759" "{{ signedURL }}" -o part1
curl -H "Range: bytes=10485760-20971519" "{{ signedURL }}" -o part2
# ... continue until complete

# Combine parts
cat part1 part2 part3 ... > complete-file.glb
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Asset UUID doesn't exist | Verify UUID via search |
| 403 Forbidden | Asset in Draft state | Publish asset to Live Internal/Public |
| 400 Bad Request | Invalid format parameter | Use GLB, FBX, or USDZ |

## Postman Collections

VNTANA provides Postman collections for testing both Public and Admin API download processes:
1. Set global variables (tokens, UUIDs)
2. Run collection as a whole or individual endpoints
3. Activate deactivated headers for individual runs

## Related

- [Retrieve Product UUID](./retrieve-product-uuid.md)
- [Searching Products](./searching-products.md)
- [Product Creation](./product-creation.md)
- [Webhooks](../webhooks/webhooks.md)
- [API Authentication](../authentication/api-authentication.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
- [Swagger Reference: Public API](/api-documentation/swagger/vntana-public-api-docs.yaml)
