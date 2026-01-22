# Product Creation (Asset Creation and Updating)

> **Source URL:** https://help.vntana.com/api-product-creation
> **API Base URL:** `https://api-platform.vntana.com`

## API Changes

**Effective July 13th, 2023:** The asset creation/update parameter `autoPublish` was replaced with `publishToStatus`. See the [Publish Status](#publish-status) section for details.

**Terminology Note:** In the API documentation, "Client" refers to workspaces on the Platform within an Organization. The Client nomenclature is a legacy reference being replaced with Workspace.

## Overview

A key integration with the Platform is access to the core VNTANA feature: management of your Digital Assets. With the API endpoints for Asset creation, you can automate:

- Uploading files for Optimization
- Updating existing Assets
- Downloading stored files

When coupled with Webhooks that monitor conversion status of newly created 3D Assets, you can reduce API calls and more directly track optimization status.

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

**Authentication Steps Summary:**

1. Log in using an Authentication Key or email/password → Returns `x-auth-token` in Response Headers
2. Retrieve list of Organizations and store the needed Organization's UUID (skip if already stored)
3. Generate a Refresh Token for the Organization → Returns Refresh Token as `x-auth-token`
4. Retrieve list of Workspaces and store the needed UUID (skip if already stored)
5. Generate a Refresh Token for the Workspace (Organization Admin/Owner users skip this step)
6. Use the final Refresh Token for subsequent API calls

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/products` | Create a new asset container |
| PUT | `/v1/products` | Update an existing asset |
| POST | `/v1/storage/upload/clients/products/asset/sign-url` | Generate signed URL for file upload |
| GET | `/v1/pipelines` | Retrieve available pipelines |

## Creating an Asset

The process involves three key steps:

### Step 1: Create the Asset Container

```bash
curl -X POST "https://api-platform.vntana.com/v1/products" \
  -H "X-AUTH-TOKEN: Bearer {refreshToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{{name}}",
    "clientUuid": "{{clientUuid}}",
    "pipelineUuid": "{{pipelineUuid}}",
    "publishToStatus": "DRAFT",
    "status": "DRAFT",
    "description": "",
    "assetType": "THREE_D",
    "attributes": {},
    "locationsUuids": [],
    "tagsUuids": [],
    "presetUuid": "",
    "projectsUuids": [],
    "project": null,
    "modelOpsParameters": {
      "DRACO_COMPRESSION": {
        "enabled": "true"
      },
      "OPTIMIZATION": {
        "desiredOutput": "AUTO",
        "obstructedGeometry": "true",
        "poly": "50000",
        "forcePolygonCount": "false",
        "bakeSmallFeatures": "true"
      },
      "PIVOT_POINT_ALIGNMENT": {
        "pivotPoint": "bottom-center"
      },
      "TEXTURE_COMPRESSION": {
        "lossless": "true",
        "maxDimension": "2048",
        "aggression": "3",
        "useKTX": "false",
        "bakeAmbientOcclusion": "true",
        "ambientOcclusionStrength": "1",
        "ambientOcclusionRadius": "5",
        "ambientOcclusionResolution": "1024"
      },
      "OUTPUT_LAYER": {
        "fbxPbr": "true"
      }
    }
  }'
```

**Request Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Asset name |
| `clientUuid` | string | Yes | Workspace UUID |
| `pipelineUuid` | string | Yes | Processing pipeline UUID |
| `publishToStatus` | string | No | "DRAFT", "LIVE_INTERNAL", or "LIVE_PUBLIC" |
| `status` | string | No | "DRAFT" or "LIVE_INTERNAL" (for empty assets) |
| `description` | string | No | Asset description |
| `assetType` | string | No | "THREE_D" for 3D assets |
| `attributes` | object | No | Custom metadata key-value pairs |
| `locationsUuids` | array | No | Location UUIDs to associate |
| `tagsUuids` | array | No | Tag UUIDs to apply |
| `presetUuid` | string | No | Preset configuration UUID |
| `projectsUuids` | array | No | Project UUIDs to link |
| `project` | object | No | New project to create and link (null to skip) |
| `modelOpsParameters` | object | No | Optimization settings |

**Response:**

```json
{
  "success": true,
  "errors": [],
  "response": {
    "uuid": "asset-uuid-here",
    "name": "Test Creation",
    "productSessionUuId": "session-uuid-here"
  }
}
```

### Step 2: Generate Signed URL

```bash
curl -X POST "https://api-platform.vntana.com/v1/storage/upload/clients/products/asset/sign-url" \
  -H "X-AUTH-TOKEN: Bearer {refreshToken}" \
  -H "Origin: https://api-platform.vntana.com" \
  -H "Content-Type: application/json" \
  -d '{
    "clientUuid": "{{clientUuid}}",
    "productUuid": "{{productUuid}}",
    "resourceSettings": {
      "contentType": "application/octet-stream",
      "originalName": "filename.glb"
    }
  }'
```

### Step 3: Upload File

```bash
curl -X PUT "{signed-url-from-previous-step}" \
  -H "Origin: https://api-platform.vntana.com" \
  -H "Content-Length: {file-size-in-bytes}" \
  --data-binary @/path/to/file.glb
```

## Project Linking

The `/v1/products` endpoint can accept data on Projects to automatically link the Asset:

- `projectsUuids`: List of existing project UUIDs to link
- `project`: Create a new project and link (pass `null` to exclude)

**Project Data Structure:**

```json
{
  "name": "string",
  "description": "string",
  "parentUuid": "string",
  "thumbnailUuid": "string",
  "status": "DRAFT",
  "locationsUuids": [],
  "tagsUuids": [],
  "attributes": {},
  "productsUuids": ["string"],
  "publishProductsToStatus": true,
  "subProjects": [],
  "clientUuid": "string"
}
```

## Retrieving Pipelines

The `pipelineUuid` is required for asset creation. To retrieve available pipelines:

```bash
curl -X GET "https://api-platform.vntana.com/v1/pipelines" \
  -H "X-AUTH-TOKEN: Bearer {refreshToken}"
```

**Common Pipelines:**

- No Baking
- 3D Scan
- Apparel - Tiled Textures
- Browzwear
- Convert Only
- Custom Jewelry
- Force Baking
- Industrial
- Keyshot
- Preserve UVs
- Preserve Meshes and UVs
- Preserve Nodes and Materials

## Updating an Asset

Update existing Assets (not currently being processed) to:

- Add metadata (tags, attributes, description)
- Change data (name, etc.)
- Upload a new/fixed 3D model

```bash
curl -X PUT "https://api-platform.vntana.com/v1/products" \
  -H "X-AUTH-TOKEN: Bearer {refreshToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "{{assetUuid}}",
    "name": "Updated Name",
    "deleteAsset": false
  }'
```

**Note:** The body is similar to asset creation but requires the Asset's `uuid`. Set `deleteAsset: true` to clear the existing file before uploading a new one.

## Publish Status

Three states with different functionality and cost implications:

| Status | Cost | Capabilities |
|--------|------|--------------|
| **DRAFT** | Free | Unlimited assets, view on Platform, download original only, viewer will NOT load externally |
| **LIVE_INTERNAL** | Paid | View on Platform, download original AND optimized, full Admin API access, viewer will NOT load externally |
| **LIVE_PUBLIC** | Paid | Full functionality, view/share/embed externally, download all assets, generate public share links |

**Notes:**
- Live Internal and Live Public are not charged separately
- You can swap between them without additional charges

## Publishing Without 3D Asset

To create Assets before 3D files are available and still retrieve them via API, pass `status: "LIVE_INTERNAL"` in the creation body. This allows the empty Asset to behave like a Live Internal asset.

## Non-3D Asset Types

Enterprise accounts support standalone non-3D Assets including:

- Source files (.bw, .zprj)
- Image files
- Document files

Other account types can upload these as Attachments.

## Conversion Status

After upload, 3D models take time to optimize. Check status via:

- Search endpoint with `statuses` parameter
- Webhooks subscribing to product conversion events

**Note:** Only Live Internal or Live Public Assets appear in search results. Draft Assets are hidden.

## Postman Collections

VNTANA provides Postman collections for testing:

- **Create Asset Collection**: Tests the full creation workflow
- **Update Asset Collection**: Tests asset updates

**Postman Setup:**

1. Set global variables in the collection
2. Choose authentication method (key or email/password)
3. For file upload: Select 'binary' Body type
4. Enable "Allow reading files outside working directory" in File > Settings > General

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid or expired token | Re-authenticate and get new refresh token |
| `403 Forbidden` | Insufficient permissions | Check user role has asset creation rights |
| `404 Not Found` | Invalid workspace or pipeline UUID | Verify UUIDs exist and are accessible |
| `422 Unprocessable Entity` | Missing required fields | Check name, clientUuid, pipelineUuid are provided |

## Related

- [Webhooks](../webhooks/webhooks.md) - Monitor conversion status
- [Searching Products](./searching-products.md) - Find created assets
- [Retrieve Product UUID](./retrieve-product-uuid.md) - Get asset identifiers
- [API Authentication](../authentication/api-authentication.md) - Authentication workflow
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
