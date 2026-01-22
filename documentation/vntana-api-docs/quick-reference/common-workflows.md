# Common VNTANA API Workflows

Quick reference for common multi-step API operations.

## Authentication

### Initial Login
```bash
# 1. Login to get auth token
curl -X POST "https://api-platform.vntana.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response:
# {"success": true, "response": {"token": "your-auth-token"}}
```

### Using the Token
```bash
# Include in all subsequent requests
-H "X-AUTH-TOKEN: your-auth-token"
```

---

## Product Upload Workflow

### Complete Flow: File Upload to Published Product

```bash
# 1. Get signed upload URL
curl -X POST "https://api-platform.vntana.com/v1/files/signed-link" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "model.glb", "contentType": "model/gltf-binary"}'

# 2. Upload file to signed URL (from step 1 response)
curl -X PUT "$SIGNED_URL" \
  -H "Content-Type: model/gltf-binary" \
  --data-binary @model.glb

# 3. Create product with uploaded file
curl -X POST "https://api-platform.vntana.com/v1/products" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Name",
    "fileUrl": "storage-url-from-step-1",
    "clientUuid": "workspace-uuid"
  }'

# 4. Check conversion status (poll until COMPLETED)
curl -X GET "https://api-platform.vntana.com/v1/products/$PRODUCT_UUID" \
  -H "X-AUTH-TOKEN: $TOKEN"

# 5. Update product status to LIVE
curl -X PUT "https://api-platform.vntana.com/v1/products/$PRODUCT_UUID/status" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "LIVE"}'
```

### Status Values
- `DRAFT` → Initial state after creation
- `PENDING_APPROVAL` → Awaiting review
- `APPROVED` → Approved but not public
- `LIVE` → Published and accessible
- `ARCHIVED` → Hidden but not deleted

### Conversion Status Values
- `PENDING` → Queued for processing
- `CONVERTING` → Currently processing
- `COMPLETED` → Ready for use
- `FAILED` → Error occurred

---

## Search and Retrieve

### Search Products
```bash
curl -X POST "https://api-platform.vntana.com/v1/products/search" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 0,
    "size": 20,
    "sortBy": "createdDate",
    "sortDirection": "DESC",
    "searchText": "chair"
  }'
```

### Get Product Details
```bash
curl -X GET "https://api-platform.vntana.com/v1/products/$PRODUCT_UUID" \
  -H "X-AUTH-TOKEN: $TOKEN"
```

### Download Product Model
```bash
curl -X GET "https://api-platform.vntana.com/v1/products/$PRODUCT_UUID/download" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -o model.glb
```

---

## Content Management

### Add Tags to Product
```bash
# 1. Create or get tag UUID
curl -X POST "https://api-platform.vntana.com/v1/tags" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Furniture", "clientUuid": "workspace-uuid"}'

# 2. Assign tag to product
curl -X POST "https://api-platform.vntana.com/v1/products/$PRODUCT_UUID/tags" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tagUuids": ["tag-uuid-1", "tag-uuid-2"]}'
```

### Add Annotations
```bash
curl -X POST "https://api-platform.vntana.com/v1/annotations" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productUuid": "product-uuid",
    "title": "Feature Highlight",
    "description": "Details about this feature",
    "position": {"x": 0.5, "y": 1.0, "z": 0.5}
  }'
```

### Add Hotspots
```bash
curl -X POST "https://api-platform.vntana.com/v1/hotspots" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productUuid": "product-uuid",
    "title": "Clickable Area",
    "position": {"x": 0.5, "y": 1.0, "z": 0.5}
  }'
```

---

## Webhook Integration

### Create Webhook
```bash
curl -X POST "https://api-platform.vntana.com/v1/webhooks" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["product.created", "product.updated", "conversion.completed"],
    "active": true
  }'
```

### Common Webhook Events
- `product.created` - New product added
- `product.updated` - Product metadata changed
- `product.deleted` - Product removed
- `conversion.completed` - 3D conversion finished
- `conversion.failed` - Conversion error

### Webhook Payload Example
```json
{
  "event": "conversion.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "productUuid": "uuid-here",
    "productName": "Product Name",
    "format": "GLB"
  }
}
```

---

## Public API (No Auth Required)

### Search Public Products
```bash
curl -X POST "https://api.vntana.com/products/organizations/$ORG_SLUG/clients/$CLIENT_SLUG" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 0,
    "size": 10
  }'
```

### Get Showroom
```bash
curl -X POST "https://api.vntana.com/showrooms/organizations/$ORG_SLUG" \
  -H "Content-Type: application/json" \
  -d '{"uuid": "showroom-uuid"}'
```

---

## Embedding 3D Content

### Get Embed URL
```bash
# Product embed URL format:
https://app.vntana.com/embed/{organizationSlug}/{clientSlug}/{productUuid}

# With parameters:
?autoplay=true&rotation=false&zoom=true
```

### iFrame Example
```html
<iframe
  src="https://app.vntana.com/embed/org/client/product-uuid"
  width="800"
  height="600"
  frameborder="0"
  allow="xr-spatial-tracking">
</iframe>
```

---

## Error Handling

### Common Error Responses

```json
// 401 Unauthorized - Token invalid or expired
{"success": false, "errors": [{"code": "NOT_AUTHORIZED"}]}

// 404 Not Found - Resource doesn't exist
{"success": false, "errors": [{"code": "NOT_FOUND"}]}

// 422 Validation Error
{"success": false, "errors": [{"code": "MISSING_NAME", "field": "name"}]}
```

### Retry Strategy
1. For `401`: Re-authenticate and retry
2. For `429` (rate limit): Wait and retry with backoff
3. For `5xx`: Retry with exponential backoff

---

## Related Documentation

- [Endpoint Cheatsheet](./endpoint-cheatsheet.md) - All endpoints at a glance
- [Error Codes](./error-codes.md) - Complete error reference
- [Authentication Guide](../guides/authentication/api-authentication.md) - Detailed auth docs
- [Admin API Swagger](../swagger/vntana-admin-api-docs.yaml) - Full API spec
