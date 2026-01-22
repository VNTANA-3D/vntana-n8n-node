# API - Searching for Assets

> **Source URL:** https://help.vntana.com/api-searching-for-products

## Overview

Using the Admin API, you can search for your Assets to update them, download files, or construct share links/iframes. VNTANA offers various search parameters including Attributes, Tags, and Conversion Status.

**Prerequisites:** You must be authenticated before searching. See [API Authentication](../authentication/api-authentication.md).

## User Role Limitations

| Role | /v1/products/clients/search | /v1/products/client/{clientUuid}/search | /v1/products/contextual-search |
|------|:---------------------------:|:---------------------------------------:|:------------------------------:|
| Organization Owner | ✓ | ✓ | ✓ |
| Organization Admin | ✓ | ✓ | ✓ |
| Workspace Admin | ✗ | ✓ | ✗ |
| Content Manager | ✗ | ✓ | ✗ |
| Guest | ✗ | ✗ | ✗ |

**Note:** Workspace Admin and Content Manager users can only use the single-workspace endpoint as they must specify a workspace they have access to.

---

## Generic Search

Two endpoints are available for searching within Workspaces:

### Single Workspace Search
```
POST /v1/products/clients/{clientUuid}/search
```
Searches only within the specified Workspace.

### Multi-Workspace Search
```
POST /v1/products/clients/search
```
Searches across multiple Workspaces. Pass a list of `clientUuids` in the request body.

### Request Structure

```bash
curl -X POST "https://api-platform.vntana.com/v1/products/clients/search" \
  -H "X-AUTH-TOKEN: Bearer {refresh_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "clientUuids": ["workspace-uuid"],
    "organizationUuid": "org-uuid",
    "name": "string",
    "searchTerm": "string",
    "status": ["LIVE_PUBLIC"],
    "tagsUuids": ["tag-uuid"],
    "conversionStatuses": ["COMPLETED"],
    "sorts": {
      "NAME": "ASC"
    },
    "matchTypes": {
      "TAGS_UUIDS": "MATCH_ANY"
    }
  }'
```

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Which page of paginated results to return |
| `size` | int | Number of results per page |
| `organizationUuid` | string | Organization to search |
| `clientUuids` | list | **Multi-workspace only:** Workspaces to search |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Filter by Asset name |
| `searchTerm` | string | Generic search across Asset metadata |
| `status` | list | Filter by publish status: `WAITING_REVIEW`, `APPROVED`, `REJECTED`, `LIVE_INTERNAL`, `LIVE_PUBLIC`, `DRAFT` |
| `tagsUuids` | list | Filter by tag UUIDs |
| `tagName` | string | Filter by tag name |
| `locationsUuids` | list | Filter by location UUIDs |
| `locationName` | string | Filter by location name |
| `variantGroupsUuids` | list | Filter by Variant Group UUIDs |
| `variantGroupName` | string | Filter by Variant Group name |
| `conversionStatuses` | list | Filter by conversion status: `PENDING`, `CONVERTING`, `COMPLETED`, `FAILED`, `NO_ASSET`, `TERMINATED` |
| `description` | string | Filter by description content |
| `attributesKeys` | list | Filter by attribute keys |
| `attributesValues` | list | Filter by attribute values |
| `hasAttributes` | boolean | Only return Assets with attributes |
| `assetTypes` | list | Filter by type: `THREE_D`, `IMAGE`, `VIDEO`, `DOCUMENT`, `PROJECT`, `MATERIAL`, `AUDIO`, `NATIVE`, `TRIM`, `AVATAR`, `NO_ASSET` |
| `projectsUuids` | list | Filter by Project UUIDs |
| `productsUuids` | list | Filter by specific Asset UUIDs |

### Sorts

Sort results by various fields:

```json
{
  "sorts": {
    "NAME": "ASC"
  }
}
```

**Available sort fields:**
- `NAME` - Asset name
- `CREATED` - Creation date
- `UPDATED` - Last update date
- `CONVERSION_STATUS` - Conversion status
- `WORKSPACE_SLUG` - Workspace slug
- `TAGS` - Tag names
- `ORIGINAL_POLY_COUNT` - Original polygon count
- `OPTIMIZED_POLY_COUNT` - Optimized polygon count
- `ORIGINAL_FILE_SIZE` - Original file size
- `OPTIMIZED_FILE_SIZE` - Optimized file size
- `PIPELINE_NAME` - Pipeline name

**Sort order:** `ASC` (lowest first) or `DESC` (highest first)

**Note:** The API implements natural sort for logical ordering (e.g., 11, 100, 1010 instead of 100, 1010, 11).

### Match Types

Control how search parameters are matched:

```json
{
  "matchTypes": {
    "TAGS_UUIDS": "MATCH_ANY"
  }
}
```

**Fields:**
- `TAGS_UUIDS` - Match tag UUIDs
- `SEARCH_TERM` - Match search term
- `NAME` - Match asset name
- `ATTRIBUTES_KEYS` - Match attribute keys
- `ATTRIBUTES_VALUES` - Match attribute values

**Values:**
- `MATCH_ALL` - Must match all values
- `MATCH_ANY` - Match any value
- `MATCH_EXACT` - Exact match only
- `MATCH_FUZZY` - Fuzzy/approximate match

**Important:** Match types require valid values in corresponding parameters (e.g., `TAGS_UUIDS` match type requires `tagsUuids` parameter).

### Extended Filters

#### Date Ranges

```json
{
  "createdDateRange": {
    "startDate": "2023-07-01T00:00:00",
    "endDate": null
  },
  "updatedDateRange": {
    "startDate": "2023-01-01T00:00:00",
    "endDate": "2023-12-31T23:59:59"
  }
}
```

Format: ISO 8601 (`YYYY-MM-DDThh:mm:ssZ`). Set `endDate` to `null` for open-ended range.

#### Numeric Ranges

```json
{
  "optimizedFileSizeRange": {
    "minValue": 10000000,
    "maxValue": null
  },
  "optimizedPolyCountRange": {
    "minValue": 75000,
    "maxValue": 500000
  }
}
```

File sizes are in bytes. Set `maxValue` to `null` for open-ended range.

**Available ranges:**
- `originalFileSizeRange` / `optimizedFileSizeRange`
- `originalPolyCountRange` / `optimizedPolyCountRange`

**Note:** Including these filters will exclude Assets without the corresponding data (e.g., non-3D assets for poly count).

---

## Contextual Search

ElasticSearch-based search with query string support for advanced searches across the entire Organization.

### Endpoint
```
POST /v1/products/contextual-search
```

### Request

```bash
curl -X POST "https://api-platform.vntana.com/v1/products/contextual-search" \
  -H "X-AUTH-TOKEN: Bearer {refresh_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "query": "furniture",
    "clientsUuids": [],
    "fields": ["name"],
    "sortField": "created",
    "sortOrder": "desc"
  }'
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `page` | Yes | Page number |
| `size` | Yes | Results per page |
| `query` | Yes | ElasticSearch query string |
| `clientsUuids` | No | Limit to specific Workspaces (empty = entire Organization) |
| `fields` | No | Fields to search within |
| `sortField` | No | Field to sort by |
| `sortOrder` | No | `asc` or `desc` |

### Query Capabilities

The `query` parameter supports:

| Feature | Example |
|---------|---------|
| Search all data | `furniture` |
| Specific field | `description:furniture` |
| Logical AND | `jewelry AND furniture` |
| Logical OR | `jewelry OR furniture` |
| Logical NOT | `NOT furniture` |
| Trailing wildcard | `test*` |
| Relational operators | `created:>2024-01-01` |
| Phrase search | `"this is a cat"` |
| Precedence | `(fruits OR vegetables) AND (NOT avocado)` |
| Date ranges | `created:[2024-08-01 TO 2024-08-23]` |
| Exists check | `_exists_:projects` |

**Note:** Leading wildcards (e.g., `*ing`) are disabled for performance.

### Field vs Query

**Recommendation:** Include fields directly in the query for best results.

**Correct:**
```json
{
  "query": "asset.assetOriginalSize:<10000"
}
```

**Incorrect:**
```json
{
  "query": "<10000",
  "fields": ["asset.assetOriginalSize"]
}
```

**UUIDs must include field name:**
```json
{
  "query": "uuid:4ba64907-f9f4-41e2-8d1e-415650b3c1e1"
}
```

### Available Query Fields

Common searchable fields include:
- `name` - Asset name
- `description` - Asset description
- `uuid` - Asset UUID
- `created` - Creation date
- `updated` - Last update date
- `tags` - Tag names
- `asset.assetOriginalSize` - Original file size
- `asset.assetOptimizedSize` - Optimized file size
- `client.slug` - Workspace slug
- `conversionStatus` - Conversion status

---

## Related

- [API Authentication](../authentication/api-authentication.md)
- [Retrieve Product UUID](./retrieve-product-uuid.md)
- [Product Creation](./product-creation.md)
- [Tags](../content/tags.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
