# Custom QR Codes

## Overview

A key feature of the VNTANA Platform is the ability for users to view 3D Models externally through an embed link, iFrame, or on mobile using a QR code. The QR code allows anyone on a mobile device to view the 3D Model in a browser using the VNTANA Viewer with a unique embed link. From this embed link, users can also view the model in AR.

It is possible via the VNTANA Platform to generate custom QR codes containing your company's logo for each Asset. The Organization image is added to the center of the QR code. All new Assets automatically generate this custom QR code.

> **Note:** If no image is uploaded for your Organization, the QR code will still be generated as a standard QR code without an embedded logo.

## Platform UI Operations

### Generating the QR Code

For existing Assets, the custom QR code must be manually generated:
1. Visit the Asset page
2. Press the **GENERATE QR CODE** button in the attachments section

This creates a PNG of the QR code containing:
- Your Workspace's image (if one exists), OR
- Your Organization's image (if Workspace has no image)

For all future Assets, the QR code is generated automatically.

### Uploading Organization Image

1. Navigate to your dashboard on the VNTANA Platform
2. Press the **Settings** button in the bottom left corner
3. On the General Settings page, click **Upload Image**
4. Select your desired image

> **Note:** If you change your Organization's image, all custom QR codes must be manually regenerated. The **GENERATE QR CODE** button becomes available again for all products.

### Uploading Workspace Image

1. Navigate to Settings page
2. Click the Workspaces section
3. Select the Workspace to edit
4. Click **Upload Image** button

### Downloading the QR Code

Download the PNG by clicking the download icon in the upper right corner of the attachment when hovering over it.

## Retrieving QR Code via API

### Authentication

Before making API calls, you need to authenticate and obtain the appropriate tokens.

**Authentication Steps Summary:**
1. Log in using Authentication Key or email/password - returns `x-auth-token` in Response Headers
2. Retrieve list of Organizations, store needed Organization UUID (skip if stored locally)
3. Generate token for Organization - returns Refresh Token as `x-auth-token`
4. Retrieve list of Clients/Workspaces, store needed UUID (skip if stored locally)
5. Generate Refresh Token for Client/Workspace (Organization Admin/Owner users skip this step)

See [API Authentication Guide](../authentication/api-authentication.md) for detailed authentication workflows.

### Getting the Asset UUID

You need the Asset (Product) UUID to retrieve its QR code. Options include:

- **Use Webhooks:** Subscribe to `product.completed` event which fires when Asset completes Optimization (QR code generated at this point)
- **Store locally:** Save the UUID when the Asset was created
- **Search via API:** Query for the product as shown below

### Searching for a Product

```
Method: POST
Endpoint: /v1/products/clients/search
Headers: { 'x-auth-token': 'Bearer ' + refreshToken }
```

**Request Body:**
```json
{
  "page": 1,
  "size": 10,
  "clientUuids": ["some-client-uuid"],
  "searchTerm": "string",
  "name": "string"
}
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
        "uuid": "string",
        "clientUuid": "string",
        "clientSlug": "some-client-slug",
        "name": "string",
        "status": "LIVE",
        "conversionFormats": ["GLB", "USDZ"],
        "models": [
          {
            "uuid": "string",
            "conversionFormat": "GLB",
            "modelBlobId": "string",
            "conversionStatus": "COMPLETED"
          }
        ],
        "created": "2022-06-26T22:21:26.744",
        "updated": "2022-06-26T22:34:57.042706"
      }
    ]
  }
}
```

> **Note:** Searches are fuzzy and return results by relevance. Iterate over results to match the name exactly if needed.

### Searching for Attachments

```
Method: POST
Endpoint: /v1/attachments/search
Headers: { 'x-auth-token': 'Bearer ' + refreshToken }
```

**Request Body:**
```json
{
  "entityType": "PRODUCT",
  "entityUuid": "productUuid",
  "page": 0,
  "size": 10,
  "productUuid": "productUuid"
}
```

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `entityType` | PRODUCT, COMMENT, ANNOTATION, or VARIANT_GROUP (Assets were formerly called Products) |
| `entityUuid` | UUID of the entity (the productUuid) |
| `productUuid` | UUID of the Product the entity belongs to |
| `page` | Page number (0 is first page) |
| `size` | Results per page |

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "string",
        "type": "PRODUCT",
        "name": "qrCode_some-id-string.png",
        "entityType": "PRODUCT",
        "entityUuid": "productUuid",
        "blobId": "some-blob-id.png",
        "created": "2022-07-13T17:10:36.247",
        "productUuid": "productUuid"
      }
    ]
  }
}
```

> **Tip:** Filter by name starting with `qrCode_` to identify QR code attachments.

### Downloading the QR Code

```
Method: GET
Endpoint: /v1/comments/images/{blobId}?clientUuid={clientUuid}
```

**Example:**
```
https://api-platform.vntana.com/v1/comments/images/some-blob-id.png?clientUuid=some-client-uuid
```

Returns image data that can be streamed to a file or another location.

## Code Example

```bash
# Step 1: Search for the product
curl -X POST "https://api-platform.vntana.com/v1/products/clients/search" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: Bearer YOUR_REFRESH_TOKEN" \
  -d '{
    "page": 1,
    "size": 10,
    "clientUuids": ["your-client-uuid"],
    "name": "Your Product Name"
  }'

# Step 2: Search for attachments using the product UUID
curl -X POST "https://api-platform.vntana.com/v1/attachments/search" \
  -H "Content-Type: application/json" \
  -H "x-auth-token: Bearer YOUR_REFRESH_TOKEN" \
  -d '{
    "entityType": "PRODUCT",
    "entityUuid": "product-uuid-from-step-1",
    "page": 0,
    "size": 10,
    "productUuid": "product-uuid-from-step-1"
  }'

# Step 3: Download the QR code using the blobId from step 2
curl -X GET "https://api-platform.vntana.com/v1/comments/images/qrcode-blob-id.png?clientUuid=your-client-uuid" \
  -H "x-auth-token: Bearer YOUR_REFRESH_TOKEN" \
  --output qrcode.png
```

## Important Notes

- **Organization image is NOT the same as user profile picture** - The logo embedded in QR codes comes from Organization or Workspace settings, not individual user profiles
- **Updating an Asset does NOT re-generate the QR code** - QR codes are generated once; manual regeneration is required if you change your Organization/Workspace image
- **Asset must be Published (Live Public) for QR code to work** - Unpublished assets will show an error screen to users who scan the QR code

## Common Patterns

### Automated QR Code Retrieval Workflow

1. Subscribe to `product.completed` webhook event
2. When event fires, extract `productUuid` from payload
3. Search attachments for the product
4. Filter results for attachments with names starting with `qrCode_`
5. Download using the `blobId`

### Batch QR Code Download

For downloading multiple QR codes:
1. Use product search with appropriate filters
2. Iterate through results to collect product UUIDs
3. For each product, search attachments and download QR codes
4. Store with appropriate naming convention

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired or invalid | Re-authenticate and obtain new token |
| 404 Not Found | Product or attachment doesn't exist | Verify UUID is correct |
| 403 Forbidden | Insufficient permissions | Check user role and workspace access |
| Empty attachment results | QR code not generated | Manually generate via Platform UI or wait for asset completion |

## Related

- [3D WebViewer HTML Component](./3d-webviewer-html.md)
- [iFrames](./iframes.md)
- [Webhooks Guide](../webhooks/webhooks.md)
- [API Authentication](../authentication/api-authentication.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
