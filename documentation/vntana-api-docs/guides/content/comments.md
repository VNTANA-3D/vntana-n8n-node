# Comments

> **Source URL:** https://help.vntana.com/api-comments

## Overview

Comments allow team members to communicate on the VNTANA Platform. Comments can be added to multiple entity types:
- **Assets** (Products)
- **Projects**
- **Configurators**
- **Annotations**

Using the Admin API, you can automatically create Comments on Assets upon notification of status changes via Webhooks.

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
| POST | /v1/comments/create | Create a comment |
| POST | /v1/comments/search | Search comments for an entity |

## Entity Types

Comments can be attached to different entity types:

| Entity Type | Value | Search Endpoint |
|-------------|-------|-----------------|
| Asset | `PRODUCT` | `/v1/products/clients/search` |
| Project | `PROJECT` | `/v1/projects/search` |
| Configurator | `VARIANT_GROUP` | `/v1/variant-groups/search` |
| Annotation | `ANNOTATION` | `/v1/annotations/search` |

**Note:** To search for Assets and Projects, they must be in Live Internal or Live Public status. Draft entities are not returned.

## Creating a Comment

First, retrieve the entity UUID (Asset, Project, Configurator, or Annotation).

### Create Comment Request

```bash
curl -X POST "https://api-platform.vntana.com/v1/comments/create?message=Your%20comment%20text&entityUuid=entity-uuid&entityType=PRODUCT" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `message` | Yes | Text content of the comment |
| `entityUuid` | Yes | UUID of the entity to comment on |
| `entityType` | Yes | `PRODUCT`, `PROJECT`, `VARIANT_GROUP`, or `ANNOTATION` |

### Response

```json
{
  "success": true,
  "response": {
    "uuid": "new-comment-uuid"
  }
}
```

The returned `uuid` is needed to edit or delete the comment.

## Retrieving Comments

Get comments for a specific entity:

```bash
curl -X POST "https://api-platform.vntana.com/v1/comments/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "PRODUCT",
    "entityUuid": "entity-uuid",
    "page": 1,
    "size": 10
  }'
```

### Response

```json
{
  "success": true,
  "response": {
    "comments": {
      "grid": [
        {
          "uuid": "comment-uuid",
          "message": "Comment text here",
          "entityType": "PRODUCT",
          "entityUuid": "asset-uuid",
          "userUuid": "author-uuid",
          "created": "2022-06-30T05:35:01.132Z",
          "updated": "2022-06-30T05:35:01.132Z",
          "attachments": {
            "grid": [
              {
                "uuid": "attachment-uuid",
                "blobId": "file-uuid",
                "name": "filename",
                "entityType": "COMMENT",
                "type": "PRODUCT"
              }
            ],
            "totalCount": 1
          }
        }
      ],
      "totalCount": 1
    },
    "mentions": {
      "grid": [
        {
          "uuid": "user-uuid",
          "email": "user@example.com",
          "fullName": "User Name",
          "imageBlobId": "avatar-uuid",
          "inOrganization": true
        }
      ],
      "totalCount": 1
    }
  }
}
```

## Searching Entities for Comments

### Search Assets

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

### Search Configurators

```bash
curl -X POST "https://api-platform.vntana.com/v1/variant-groups/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientUuids": ["workspace-uuid"],
    "page": 1,
    "size": 10,
    "searchTerm": "configurator name"
  }'
```

**Configurator Response:**
```json
{
  "success": true,
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "configurator-uuid",
        "clientUuid": "workspace-uuid",
        "name": "Configurator Name",
        "description": "Description",
        "productsUuids": ["product-uuid-1", "product-uuid-2"],
        "status": "LIVE",
        "tags": [{"uuid": "tag-uuid", "name": "Tag Name"}]
      }
    ]
  }
}
```

### Search Annotations

```bash
curl -X POST "https://api-platform.vntana.com/v1/annotations/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "productUuid": "asset-uuid"
  }'
```

**Note:** Searches are fuzzy and return results based on relevance. Iterate over results to match exact names.

## Common Patterns

### Webhook-Based Comment Creation

1. Set up webhook for status change events (e.g., `product.completed`)
2. Receive webhook with entity UUID
3. Automatically create a comment noting the status change

```bash
# Create comment when asset completes processing
curl -X POST "https://api-platform.vntana.com/v1/comments/create?message=Asset%20optimization%20completed&entityUuid=$PRODUCT_UUID&entityType=PRODUCT" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

### Get All Comments for an Asset

```bash
curl -X POST "https://api-platform.vntana.com/v1/comments/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entityType": "PRODUCT", "entityUuid": "asset-uuid", "page": 1, "size": 100}'
```

## Postman Collection

A Postman collection is available for testing comment creation and retrieval:
1. Set global variables in Pre-request Script
2. Deselect endpoints you don't need
3. For individual runs: re-enable X-AUTH-TOKEN header and set parameters

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 404 Not Found | Entity UUID doesn't exist | Verify UUID via search |
| 400 Bad Request | Invalid entityType | Use PRODUCT, PROJECT, VARIANT_GROUP, or ANNOTATION |

## Related

- [Annotations](./annotations.md)
- [Hotspots](./hotspots.md)
- [Searching Products](../products/searching-products.md)
- [Webhooks](../webhooks/webhooks.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
