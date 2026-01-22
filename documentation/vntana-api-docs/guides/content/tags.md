# Tags and Tag Groups

> **Source URL:** https://help.vntana.com/api-tags

## Overview

Tags are a great way to add metadata to Assets and create filters when searching. Key characteristics:

- **Workspace-specific:** Tags are created within and unique to a Workspace
- **Single instance:** A Tag like "Woven" can only exist once per Workspace, but can be applied to multiple Assets
- **Cross-workspace:** Tags must be created separately in each Workspace where needed
- **Multi-entity:** Tags can be applied to Assets, Configurators, and Projects (they share the same Tag pool)

**Note:** A Tag applied to a Configurator or Project doesn't automatically apply to associated Assets.

**Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/tags/search | Search for existing tags |
| POST | /v1/tags/create | Create a new tag |
| GET | /v1/tag-groups/clients/{clientUuid} | Get tag groups |
| POST | /v1/tag-groups/create | Create a tag group |

## Creating a Tag

### Step 1: Check if Tag Exists (Recommended)

Before creating, verify the Tag doesn't already exist:

```bash
curl -X POST "https://api-platform.vntana.com/v1/tags/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientUuid": "workspace-uuid",
    "page": 1,
    "searchTerm": "Tag Name",
    "size": 10
  }'
```

**Note:** You can skip this step if creating a batch of Tags and don't need the UUID immediately. The create endpoint will return an error if the Tag already exists.

### Step 2: Create the Tag

```bash
curl -X POST "https://api-platform.vntana.com/v1/tags/create" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientUuid": "workspace-uuid",
    "name": "Some Tag",
    "tagGroupUuid": "tag-group-uuid"
  }'
```

### Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `clientUuid` | Yes | Workspace UUID |
| `name` | Yes | Tag name |
| `tagGroupUuid` | No | Tag Group to assign (defaults to UNASSIGNED) |

### Response

A successful request returns the new Tag's UUID:

```json
{
  "success": true,
  "errors": [],
  "response": {
    "uuid": "new-tag-uuid",
    "name": "Some Tag"
  }
}
```

The returned UUID can be used in:
- Asset creation requests
- Configurator creation requests
- Project creation requests
- Local storage to avoid future API calls

## Tag Groups

Tag Groups organize related Tags within a Workspace. Benefits:
- Retrieve a Tag Group to get all associated Tags' names and UUIDs at once
- Avoid searching for each Tag individually

**Important:** Tag Groups do not override the single-instance rule. The same Tag cannot exist in multiple Tag Groups.

### Get Tag Groups

```bash
curl -X GET "https://api-platform.vntana.com/v1/tag-groups/clients/{clientUuid}?page=0&size=10" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

**Note:** For this endpoint, the first page is `0` (not `1`), and `page` and `size` are required.

### Tag Group Response

```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "tag-group-uuid",
        "name": "Tag Group Name",
        "tags": [
          {
            "uuid": "tag-uuid-1",
            "name": "Some Tag 1"
          },
          {
            "uuid": "tag-uuid-2",
            "name": "Some Tag 2"
          }
        ]
      }
    ]
  }
}
```

### Create Tag Group

```bash
curl -X POST "https://api-platform.vntana.com/v1/tag-groups/create" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientUuid": "workspace-uuid",
    "name": "Group Name"
  }'
```

**Note:** Tag Groups are optional. Tags created without specifying a Tag Group are placed in the default "UNASSIGNED" Tag Group.

## Common Patterns

### Batch Create Tags

```bash
# Create multiple tags in sequence
for tag in "Woven" "Leather" "Synthetic"; do
  curl -X POST "https://api-platform.vntana.com/v1/tags/create" \
    -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"clientUuid\": \"$CLIENT_UUID\", \"name\": \"$tag\"}"
done
```

### Get All Tags via Tag Groups

```bash
# Retrieve all tag groups with their tags
curl -X GET "https://api-platform.vntana.com/v1/tag-groups/clients/$CLIENT_UUID?page=0&size=100" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| 400 Bad Request | Tag already exists | Search for existing tag to get UUID |
| 404 Not Found | Invalid clientUuid | Verify workspace UUID |

## Related

- [Annotations](./annotations.md)
- [Hotspots](./hotspots.md)
- [Product Creation](../products/product-creation.md)
- [Searching Products](../products/searching-products.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
