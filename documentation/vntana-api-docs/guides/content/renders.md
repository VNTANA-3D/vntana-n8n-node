# API – Renders

> **Source URL:** https://help.vntana.com/api-renders

## Overview

The VNTANA API allows you to trigger, track, and download renders programmatically. You can initiate processing of:
- **Still image renders** - High-quality images in PNG, JPG, or WEBP format
- **Turntable renders** - 360° view videos (MP4) and optional GIFs

**Important:** When triggering new renders, any previous renders/turntables will be replaced with the new versions. If you previously had a GIF but re-render with GIF disabled, the GIF will no longer be available.

**Note:** In the API, "Client" refers to folders within an Organization. This is legacy nomenclature being replaced with "Folder".

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/products/renders | Trigger render generation |

## Triggering Renders

```bash
curl -X POST "https://api-platform.vntana.com/v1/products/renders" \
  -H "X-AUTH-TOKEN: Bearer your-refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "productUuids": ["product-uuid-1", "product-uuid-2"],
    "imageWidth": 1920,
    "imageHeight": 1080,
    "imageFormat": "PNG",
    "turntable": {
      "includeGif": true,
      "imageCount": 120,
      "frameRate": 30,
      "width": 1920,
      "height": 1080
    }
  }'
```

### Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `productUuids` | Yes | List of product UUIDs to generate renders for |
| `imageWidth` | Yes | Width of still image renders (pixels) |
| `imageHeight` | Yes | Height of still image renders (pixels) |
| `imageFormat` | Yes | Format: "PNG", "JPG", or "WEBP" |
| `turntable` | Yes | Turntable configuration object |

### Turntable Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `includeGif` | Yes | Whether to generate a GIF (MP4 always generates) |
| `imageCount` | Yes | Number of frames for 360° view |
| `frameRate` | Yes | Frames per second |
| `width` | Yes | Frame width (pixels) |
| `height` | Yes | Frame height (pixels) |

**Note:** `frameRate` and `imageCount` together determine video length. For example, 120 frames at 30 fps = 4 second video.

### Response

```json
{
  "success": true,
  "errors": [],
  "response": {
    "uuids": ["product-uuid-1", "product-uuid-2"],
    "errors": null
  }
}
```

## Downloading Renders

Renders and turntables are classified as **Attachments** and can be downloaded via the Attachments API. See [Upload Attachments](./upload-attachments.md) and [Download Model](../products/download-model.md) for the download process using signed URLs.

## Tracking Status via Webhooks

Track render progress using Webhook events. See [Webhooks](../webhooks/webhooks.md).

### Render Events

| Event | Description |
|-------|-------------|
| `renders.pending` | Render job queued |
| `renders.processing` | Render job in progress |
| `renders.completed` | Render job finished successfully |
| `renders.failed` | Render job failed |

### Turntable Events

| Event | Description |
|-------|-------------|
| `turntable.pending` | Turntable job queued |
| `turntable.processing` | Turntable job in progress |
| `turntable.completed` | Turntable job finished successfully |
| `turntable.failed` | Turntable job failed |

### Webhook Payload Example

```json
{
  "event": "renders.completed",
  "organization": {
    "uuid": "org-uuid"
  },
  "product": {
    "uuid": "product-uuid",
    "name": "Product Name",
    "description": "",
    "status": "LIVE_PUBLIC",
    "asset": {
      "assetOriginalName": "model.glb",
      "assetOriginalSize": 464929548,
      "generationRequestUuid": "string"
    }
  },
  "client": {
    "uuid": "client-uuid"
  }
}
```

**Key webhook data:**
- `organization.uuid` - Required for API calls
- `client.uuid` - Required for API calls
- `product.uuid` - Identifies the asset with completed renders

Use these UUIDs to call the Attachments API to locate and download the renders/turntables.

## Postman Collection

A Postman collection is available for testing render triggers:
1. Set necessary credentials
2. Add list of `productUuids`
3. Adjust render settings as needed
4. Run individually or as collection

## Common Patterns

### Batch Render Multiple Products

```bash
# Trigger renders for multiple products at once
curl -X POST "https://api-platform.vntana.com/v1/products/renders" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productUuids": ["uuid-1", "uuid-2", "uuid-3"],
    "imageWidth": 1920,
    "imageHeight": 1080,
    "imageFormat": "PNG",
    "turntable": {
      "includeGif": false,
      "imageCount": 60,
      "frameRate": 30,
      "width": 1920,
      "height": 1080
    }
  }'
```

### Webhook-Based Workflow

1. Trigger renders via API
2. Set up webhook for `renders.completed` event
3. When webhook fires, extract `product.uuid` and `client.uuid`
4. Call Attachments API to download completed renders

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Product UUID doesn't exist | Verify UUID via search |
| 400 Bad Request | Invalid format or missing parameters | Check required fields |

## Related

- [Upload Attachments](./upload-attachments.md)
- [Download Model](../products/download-model.md)
- [Webhooks](../webhooks/webhooks.md)
- [Download Thumbnails](./download-thumbnails.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
