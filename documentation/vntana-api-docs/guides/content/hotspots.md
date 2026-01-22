# Hotspots

> **Source URL:** https://help.vntana.com/api-hotspots

## Overview

Hotspots enhance the viewing experience of 3D assets within the VNTANA viewer. Like Annotations, they exist at designated points in 3D space, but **unlike Annotations, Hotspots are publicly visible** wherever the viewer is embedded.

**Use cases:**
- Show product dimensions
- Provide how-to videos for setup and usage
- Highlight key product information
- Draw customer attention to important features

Using the Admin API, you can automate creating, updating, and searching Hotspots. Couple with Webhooks to automatically add Hotspots once a 3D file completes optimization.

**Hotspot Types:**
| Type | Description |
|------|-------------|
| `TEXT` | Display text content |
| `IMAGE` | Display an uploaded image with description |
| `VIDEO` | Embed a video with optional autoplay |

> **Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

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
| POST | /v1/hotspots | Create hotspot |
| PUT | /v1/hotspots | Update hotspot |
| POST | /v1/hotspots/search | Search hotspots for an asset |
| POST | /v1/hotspots/upload/images | Upload image for hotspot |

## Creating Hotspots

> **Important:** Hotspots exist in 3D space. Unless you know the exact 3D coordinate, creating via API may not produce desired results since you cannot reposition after creation.

First, retrieve the Asset UUID. See [Searching Products](../products/searching-products.md).

> **Note:** Assets in Draft status cannot be searched via API.

### Dimensions Format

**CRITICAL:** The `dimensions` parameter requires specific formatting with escaped quotes:

```
"dimensions": "{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}"
```

Every interior quote must be escaped with `\` or data won't parse correctly.

### TEXT Hotspot

```bash
curl -X POST "https://api-platform.vntana.com/v1/hotspots" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dimensions": "{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}",
    "productUuid": "asset-uuid",
    "title": "Hotspot Title",
    "type": "TEXT",
    "text": "Available in S, M, L, XL"
  }'
```

### IMAGE Hotspot

Requires uploading the image first (see [Uploading an Image for Hotspots](#uploading-an-image-for-hotspots) below).

```bash
curl -X POST "https://api-platform.vntana.com/v1/hotspots" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dimensions": "{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}",
    "productUuid": "asset-uuid",
    "title": "Color Options",
    "type": "IMAGE",
    "blobId": "uploaded-image-uuid",
    "description": "There are 4 colors available!"
  }'
```

### VIDEO Hotspot

```bash
curl -X POST "https://api-platform.vntana.com/v1/hotspots" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dimensions": "{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}",
    "productUuid": "asset-uuid",
    "title": "Setup Guide",
    "type": "VIDEO",
    "url": "https://youtube.com/watch?v=...",
    "autoplaying": false,
    "description": "Watch how to set up your product"
  }'
```

### Request Parameters

| Parameter | Required | Applies To | Description |
|-----------|----------|------------|-------------|
| `dimensions` | Yes | All | Stringified JSON with 3D position and normal |
| `productUuid` | Yes | All | Asset UUID |
| `title` | Yes | All | Hotspot title (visible on Platform only) |
| `type` | Yes | All | `TEXT`, `IMAGE`, or `VIDEO` |
| `text` | Yes | TEXT | Text content to display |
| `blobId` | Yes | IMAGE | UUID of uploaded image |
| `description` | No | IMAGE/VIDEO | Text shown under image/video (publicly visible) |
| `url` | Yes | VIDEO | Video URL to embed |
| `autoplaying` | No | VIDEO | Auto-play video (default: false) |

## Uploading an Image for Hotspots

Before creating an IMAGE hotspot, upload the image:

```bash
curl -X POST "https://api-platform.vntana.com/v1/hotspots/upload/images?clientUuid=$CLIENT_UUID" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -F "imageFile=@/path/to/image.png"
```

### Response

```json
{
  "success": true,
  "response": {
    "blobId": "uploaded-image-uuid.png",
    "blobSize": 128326,
    "metaData": {
      "content-length": "128326",
      "content-type": "image/png",
      "original-name": "image.PNG"
    }
  }
}
```

Use the returned `blobId` when creating the IMAGE hotspot.

## Updating a Hotspot

Similar to creating, but requires the hotspot's `uuid`:

```bash
curl -X PUT "https://api-platform.vntana.com/v1/hotspots" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "hotspot-uuid",
    "dimensions": "{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}",
    "productUuid": "asset-uuid",
    "title": "Updated Title",
    "type": "TEXT",
    "text": "Updated content"
  }'
```

Retrieve the hotspot UUID via search (see below).

## Searching Hotspots

Retrieve hotspots for an asset:

```bash
curl -X POST "https://api-platform.vntana.com/v1/hotspots/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 0,
    "size": 10,
    "productUuid": "asset-uuid"
  }'
```

> **Note:** For this endpoint, page `0` is the first page.

### Response

```json
{
  "success": true,
  "response": {
    "totalCount": 3,
    "grid": [
      {
        "uuid": "hotspot-uuid-1",
        "type": "TEXT",
        "productUuid": "asset-uuid",
        "title": "Sizes",
        "dimensions": "{\"position\":\"0.097m 0.18m 0.117m\",\"normal\":\"0.114m 0.435m 0.893m\"}",
        "text": "Available in S, M, L, XL",
        "created": "2022-10-10T18:00:47.687",
        "updated": "2022-10-10T18:00:47.687"
      },
      {
        "uuid": "hotspot-uuid-2",
        "type": "IMAGE",
        "productUuid": "asset-uuid",
        "title": "Now available in Green!",
        "dimensions": "...",
        "blobId": "image-uuid.png",
        "description": "There are 4 colors available!"
      },
      {
        "uuid": "hotspot-uuid-3",
        "type": "VIDEO",
        "productUuid": "asset-uuid",
        "title": "Setup Video",
        "dimensions": "...",
        "url": "https://...",
        "description": "",
        "autoplaying": false
      }
    ]
  }
}
```

## Platform Behavior

- Hotspots appear in the viewer's Hotspots tab
- Each hotspot is numbered; numbers re-adjust when hotspots are deleted
- By default, numbers don't appear in embedded viewer
- Toggle "Show Hotspot numbers in Share Links" to display numbers in order

## Common Patterns

### Webhook-Based Hotspot Creation

1. Set up webhook for `product.completed` event
2. Receive webhook with `productUuid`
3. Create hotspots using known 3D coordinates for that product type

### Batch Update Hotspots

```bash
# Search for all hotspots
curl -X POST "https://api-platform.vntana.com/v1/hotspots/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -d '{"page": 0, "size": 100, "productUuid": "asset-uuid"}'

# For each hotspot, update using PUT /v1/hotspots with the uuid
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Asset UUID doesn't exist | Verify UUID via search |
| 400 Bad Request | Invalid dimensions format | Check JSON escaping |
| 400 Bad Request | Missing blobId for IMAGE type | Upload image first |

## Related

- [Annotations](./annotations.md)
- [Comments](./comments.md)
- [Upload Attachments](./upload-attachments.md)
- [Searching Products](../products/searching-products.md)
- [Webhooks](../webhooks/webhooks.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
