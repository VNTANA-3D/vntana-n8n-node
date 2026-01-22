# Annotations

> **Source URL:** https://help.vntana.com/api-annotations

## Overview

Annotations are a means for teams to communicate about Assets. Unlike Comments, Annotations exist in 3D space within the viewer, allowing direct correlation between the message and a specific part of the 3D model.

**Use cases:**
- Point out issues with 3D models
- Highlight incorrect patterns in portions of an asset
- Track resolved vs unresolved issues without deleting annotations

**Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

**Authentication Steps Summary:**
1. Log in using Authentication Key or email/password → Returns `x-auth-token`
2. Retrieve Organizations list and store needed UUID (skip if stored)
3. Generate Refresh Token for Organization
4. Retrieve Workspaces list and store needed UUID (skip if stored)
5. Generate Refresh Token for Workspace (Org Admin/Owner skip this)
6. Use final Refresh Token for API calls

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/annotations | Create annotation |
| POST | /v1/annotations/search | Search annotations for an asset |
| POST | /v1/annotations/resolve | Resolve/unresolve annotation |

## Creating an Annotation

First, retrieve the Asset UUID. See [Searching Products](../products/searching-products.md).

**Note:** Assets in Draft status are not searchable via API. They must be Live Internal or Live Public.

### Create Annotation Request

```bash
curl -X POST "https://api-platform.vntana.com/v1/annotations" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attachments": [],
    "clientUuid": "workspace-uuid",
    "dimensions": "{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}",
    "productUuid": "asset-uuid",
    "text": "The annotation message"
  }'
```

### Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `attachments` | Yes | List of attachments (can be empty `[]`) |
| `clientUuid` | Yes | Workspace UUID containing the Asset |
| `dimensions` | Yes | Stringified JSON with 3D position and normals |
| `productUuid` | Yes | Asset UUID for the annotation |
| `text` | Yes | Text content of the annotation |

### Attachments Structure

If attaching a file:
```json
{
  "attachments": [
    {
      "blobId": "file-uuid",
      "name": "attachment-name",
      "productUuid": "asset-uuid"
    }
  ]
}
```

Attachments can be images showing how the model should look, or JSON files with additional information. Files must be uploaded first via the Attachments API.

### Dimensions Format

**IMPORTANT:** The `dimensions` parameter must be a stringified JSON object with escaped quotes:

```
"{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}"
```

Every interior double quote must be escaped with `\` or the front-end won't parse the data correctly.

### Response

```json
{
  "success": true,
  "response": {
    "uuid": "new-annotation-uuid"
  }
}
```

## Retrieving Annotations

Get annotations for a specific Asset:

```bash
curl -X POST "https://api-platform.vntana.com/v1/annotations/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 0,
    "size": 10,
    "productUuid": "asset-uuid"
  }'
```

**Note:** For this endpoint, page `0` is the first page of results.

### Response

```json
{
  "success": true,
  "response": {
    "annotations": {
      "grid": [
        {
          "uuid": "annotation-uuid",
          "text": "Annotation message",
          "dimensions": "string",
          "productUuid": "asset-uuid",
          "userUuid": "creator-uuid",
          "resolved": false,
          "commentsCount": 0,
          "number": 1,
          "created": "2022-06-30T06:10:55.346Z",
          "updated": "2022-06-30T06:10:55.346Z",
          "attachments": {
            "grid": [
              {
                "uuid": "attachment-uuid",
                "blobId": "file-uuid",
                "name": "filename",
                "entityType": "COMMENT",
                "entityUuid": "string",
                "type": "PRODUCT"
              }
            ],
            "totalCount": 1
          }
        }
      ],
      "totalCount": 1,
      "nextNumber": 2
    },
    "mentions": {
      "grid": [
        {
          "email": "user@example.com",
          "fullName": "User Name",
          "imageBlobId": "string"
        }
      ]
    }
  }
}
```

## Resolving Annotations

Mark annotations as resolved to indicate the issue has been addressed, without deleting the record:

```bash
curl -X POST "https://api-platform.vntana.com/v1/annotations/resolve" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolved": true,
    "uuid": "annotation-uuid"
  }'
```

Set `resolved` to `false` to reopen an annotation.

### Response

```json
{
  "success": true,
  "response": {
    "uuid": "annotation-uuid"
  }
}
```

## Common Patterns

### Add Annotation at Specific 3D Position

```bash
# Position annotation at x=1.5, y=2.0, z=0.5 with upward normal
curl -X POST "https://api-platform.vntana.com/v1/annotations" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attachments": [],
    "clientUuid": "'"$CLIENT_UUID"'",
    "dimensions": "{\"position\": \"1.5m 2.0m 0.5m\", \"normal\": \"0.0m 1.0m 0.0m\"}",
    "productUuid": "'"$PRODUCT_UUID"'",
    "text": "Check texture alignment here"
  }'
```

### Get All Unresolved Annotations

```bash
# Search annotations, then filter by resolved: false
curl -X POST "https://api-platform.vntana.com/v1/annotations/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page": 0, "size": 100, "productUuid": "asset-uuid"}'
# Filter results where resolved == false
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Asset UUID doesn't exist | Verify UUID via search |
| 400 Bad Request | Invalid dimensions format | Check JSON escaping |
| 403 Forbidden | Asset in Draft state | Publish asset first |

## Related

- [Comments](./comments.md)
- [Hotspots](./hotspots.md)
- [Tags](./tags.md)
- [Upload Attachments](./upload-attachments.md)
- [Searching Products](../products/searching-products.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
