# Upload Attachments

> **Source URL:** https://help.vntana.com/api-upload-attachments

## Overview

Upload attachments to Assets in various forms. Attachments can be uploaded to multiple entity types:
- **Assets** (Products) - Direct upload
- **Projects**
- **Configurators** (Variant Groups) - Upload to workspace first, then attach
- **Comments** - Upload to workspace first, then attach
- **Annotations**
- **Hotspots**

**Limits:**
- Maximum attachment size: **3 GB**
- See VNTANA documentation for full list of allowable file types

**Note:** For Hotspots, videos must be linked (not uploaded) since Hotspots are visible to users with embed links.

**Deprecation Warning:** Certain upload endpoints are being deprecated. Only the resumable upload route will be supported going forward.

**Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/storage/upload/clients/resource/sign-url | Generate signed URL for upload |
| POST | /v1/attachments/search | Search attachments for an asset |
| GET | /v1/comments/images/{blobId} | Download attachment |
| GET | /v1/clients/client-organizations | Get workspaces |
| POST | /v1/products/clients/search | Search assets |
| POST | /v1/variant-groups/search | Search configurators |

## Uploading Attachments

### Two Upload Processes

1. **Direct to Asset:** Single endpoint process
2. **To Variant Group/Comment:** Upload to workspace first, then attach to entity

### Step 1: Generate Signed URL

```bash
curl -X POST "https://api-platform.vntana.com/v1/storage/upload/clients/resource/sign-url" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Origin: https://api-platform.vntana.com" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSettings": {
      "contentType": "application/octet-stream",
      "originalName": "filename.png",
      "originalSize": 128326
    },
    "clientUuid": "workspace-uuid",
    "storeType": "ATTACHMENT",
    "parentEntityUuid": "asset-uuid",
    "parentEntityType": "PRODUCT"
  }'
```

### Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `resourceSettings.contentType` | Yes | MIME type (e.g., `application/octet-stream`) |
| `resourceSettings.originalName` | Yes | Filename |
| `resourceSettings.originalSize` | Yes | File size in bytes |
| `clientUuid` | Yes | Workspace UUID |
| `storeType` | Yes | `ATTACHMENT` or `RENDER` |
| `parentEntityUuid` | Yes | UUID of entity to attach to |
| `parentEntityType` | Yes | Entity type (see below) |

### parentEntityType Values

| Value | Description |
|-------|-------------|
| `PRODUCT` | Asset |
| `VARIANT_GROUP` | Configurator |
| `ANNOTATION` | Annotation |
| `COMMENT` | Comment |
| `RENDER` | Render (for renders tab) |

### storeType Values

| Value | Description |
|-------|-------------|
| `ASSET` | Store as asset |
| `ATTACHMENT` | Store as attachment |
| `RENDER` | Store in renders tab |

### Response

```json
{
  "success": true,
  "response": {
    "requestUuid": "d2384aac-685b-4307-b6cf-ce99c368e4f3",
    "location": "signed-url-string",
    "blobId": "56b3d655-c008-4017-ad95-7a278ebe8a6a.png"
  }
}
```

### Step 2: Upload to Signed URL

```bash
curl -X POST "$SIGNED_URL" \
  -H "Origin: https://api-platform.vntana.com" \
  -H "Content-Length: 128326" \
  --data-binary @filename.png
```

**Note:** Google Signed URLs don't return a response on success (empty response object). If issues occur, send the `requestUuid` to VNTANA support for log investigation.

## Uploading to Renders Tab

To store attachments in the Renders tab instead of Attachments tab, set `storeType` to `RENDER`:

```bash
curl -X POST "https://api-platform.vntana.com/v1/storage/upload/clients/resource/sign-url" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Origin: https://api-platform.vntana.com" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSettings": {
      "contentType": "application/octet-stream",
      "originalName": "render.png",
      "originalSize": 256000
    },
    "clientUuid": "workspace-uuid",
    "storeType": "RENDER",
    "parentEntityUuid": "asset-uuid",
    "parentEntityType": "PRODUCT"
  }'
```

**Accepted render file types:** jpeg, jpg, png, bmp, gif, tiff, svg, mp4, tif, mov, avi, pdf

## Downloading Attachments

### Step 1: Search for Attachment

```bash
curl -X POST "https://api-platform.vntana.com/v1/attachments/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 0,
    "size": 10,
    "productUuid": "asset-uuid",
    "sortDirection": "ASC"
  }'
```

**Note:** For this endpoint, page `0` is the first page.

### Response

```json
{
  "success": true,
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "attachment-uuid",
        "type": "PRODUCT",
        "name": "filename.png",
        "entityType": "PRODUCT",
        "entityUuid": "asset-uuid",
        "blobId": "blob-uuid.png",
        "productUuid": "asset-uuid",
        "created": "2023-08-28T19:03:53.198",
        "updated": "2023-08-28T19:03:53.198"
      }
    ]
  }
}
```

**QR Code:** Auto-generated QR codes have format `qrCode_some-uuid.png`

### Step 2: Download Attachment

```bash
curl -X GET "https://api-platform.vntana.com/v1/comments/images/$BLOB_ID?clientUuid=$CLIENT_UUID" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -o downloaded_file.png
```

## Downloading Renders

Renders are stored as attachments but displayed in a separate Renders section. Download process is the same.

**entityType values for renders:**
- `RENDER` - Still image renders
- `TURNTABLE` - MP4/GIF turntable renders
- `PRODUCT` - Manually uploaded images/videos or QR codes

```bash
# Search for renders
curl -X POST "https://api-platform.vntana.com/v1/attachments/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -d '{"page": 0, "size": 10, "productUuid": "asset-uuid"}'

# Filter results by entityType: "RENDER" or "TURNTABLE"
# Download using /v1/comments/images/{blobId}
```

## Searching Entities

### Search Assets

```bash
curl -X POST "https://api-platform.vntana.com/v1/products/clients/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -d '{"page": 1, "size": 10, "clientUuids": ["workspace-uuid"], "searchTerm": "name"}'
```

**Note:** Assets in Draft status won't be returned. Only Live Internal/Live Public assets are searchable.

### Search Variant Groups (Configurators)

```bash
curl -X POST "https://api-platform.vntana.com/v1/variant-groups/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -d '{"clientUuids": ["workspace-uuid"], "page": 1, "size": 10, "searchTerm": "name"}'
```

## Common Patterns

### Upload Reference Image to Asset

```bash
# 1. Generate signed URL
RESPONSE=$(curl -s -X POST "https://api-platform.vntana.com/v1/storage/upload/clients/resource/sign-url" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSettings": {"contentType": "image/png", "originalName": "reference.png", "originalSize": 50000},
    "clientUuid": "workspace-uuid",
    "storeType": "ATTACHMENT",
    "parentEntityUuid": "asset-uuid",
    "parentEntityType": "PRODUCT"
  }')

# 2. Extract location and upload
SIGNED_URL=$(echo $RESPONSE | jq -r '.response.location')
curl -X POST "$SIGNED_URL" \
  -H "Origin: https://api-platform.vntana.com" \
  --data-binary @reference.png
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Entity UUID doesn't exist | Verify UUID via search |
| 400 Bad Request | Invalid parentEntityType | Use PRODUCT, VARIANT_GROUP, ANNOTATION, or COMMENT |
| Empty response | Normal for signed URL upload | Check requestUuid with support if issues |

## Postman Collection

Collection available covering authentication, asset retrieval, and attachment download:
1. Deselect unwanted endpoints
2. Set global variables in Pre-request Script
3. For individual runs: activate X-AUTH-TOKEN header

## Related

- [Download Model](../products/download-model.md)
- [Renders](./renders.md)
- [Annotations](./annotations.md)
- [Comments](./comments.md)
- [Hotspots](./hotspots.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
