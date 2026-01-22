# API – Showrooms

> **Source URL:** https://help.vntana.com/api-showrooms

## Overview

Using the VNTANA Admin API, you can automate the full process of Showroom integration:
- Creation, publishing, and sharing of Showrooms
- Asset groupings and organization
- Images and styling
- Organization-level Showroom tags
- Customer-specific share links with order counts

**Note:** In the API, "Client" refers to workspaces within an Organization. This is legacy nomenclature being replaced with "Workspace".

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/showrooms | Create showroom |
| PUT | /v1/showrooms | Update showroom |
| POST | /v2/showrooms/search | Search showrooms |
| POST | /v2/showrooms/get-by-uuid | Get showroom details |
| GET | /v1/showrooms/{uuid}/products-attributes | Get showroom attributes |
| POST | /v1/showrooms/tags | Create showroom tag |
| POST | /v1/showrooms/tags/search | Search showroom tags |
| POST | /v1/showrooms/upload/images | Upload showroom image |
| GET | /v1/showrooms/images/{blobId} | Download showroom image |
| POST | /v1/showrooms/sharelinks | Create share link |
| PUT | /v1/showrooms/sharelinks | Update share link |
| GET | /v1/showrooms/sharelinks/{uuid} | Get share link by UUID |
| POST | /v1/showrooms/{uuid}/sharelinks | Search share links |
| POST | /v1/showrooms/combined-sharelink | Get combined showroom and share link data |
| POST | /v1/showrooms/sharelinks/order-item | Add order count to asset |
| GET | /v1/showrooms/sharelinks/{uuid}/order | Get order counts |

## Creating a Showroom

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Showroom",
    "tagsUuids": ["tag-uuid-1", "tag-uuid-2"],
    "logoBlobId": "logo-image-uuid",
    "groups": [
      {
        "title": "Group 1",
        "dividers": ["TOP", "BOTTOM"],
        "visible": true,
        "productsInfo": [
          {"productUuid": "asset-uuid-1", "visible": true, "order": 1},
          {"productUuid": "asset-uuid-2", "visible": true, "order": 2}
        ]
      }
    ],
    "layoutAttributes": {
      "PRODUCTS_PER_ROW": 3,
      "TEXT_COLOR": "#000000",
      "FONT_FAMILY": "Roboto",
      "BACKGROUND_COLOR": "#ffffff",
      "BACKGROUND_IMAGE_BLOB_ID": null,
      "DIVIDER_COLOR": "#000000",
      "IMAGE_STYLE": null
    }
  }'
```

### Request Parameters

| Parameter | Description |
|-----------|-------------|
| `name` | Showroom name visible on view page |
| `tagsUuids` | List of organization-level tag UUIDs |
| `logoBlobId` | UUID of uploaded logo image |
| `groups` | Asset groupings (see below) |
| `layoutAttributes` | Styling options (see below) |

### Groups Object

| Field | Description |
|-------|-------------|
| `title` | Group identifier, visible above first entry |
| `dividers` | `TOP`, `BOTTOM`, or both |
| `visible` | Whether group is visible in share links |
| `productsInfo` | Array of assets in group |
| `productsInfo.productUuid` | Asset UUID |
| `productsInfo.visible` | Asset visibility in share links |
| `productsInfo.order` | Position in group (starts at 1) |

### Layout Attributes

| Attribute | Description | Values |
|-----------|-------------|--------|
| `PRODUCTS_PER_ROW` | Max assets per row | 3, 4, or 5 |
| `TEXT_COLOR` | Font color | Hex value |
| `FONT_FAMILY` | Font family | Default: "Roboto" |
| `BACKGROUND_COLOR` | Background color | Hex value |
| `BACKGROUND_IMAGE_BLOB_ID` | Background image UUID | Optional |
| `DIVIDER_COLOR` | Divider color | Hex value |
| `IMAGE_STYLE` | Image display style | Cover, Contain, Tile |

### Response

```json
{"success": true, "response": {"uuid": "showroom-uuid"}}
```

## Updating a Showroom

Same as create but with PUT method and `uuid` in body:

```bash
curl -X PUT "https://api-platform.vntana.com/v1/showrooms" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid": "showroom-uuid", "name": "Updated Name", ...}'
```

**Important:** When updating, pass ALL data the Showroom should contain. Existing assets not included will be removed.

## Retrieving Showroom Data

### Search Showrooms

```bash
curl -X POST "https://api-platform.vntana.com/v2/showrooms/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 10, "searchTerm": "name"}'
```

**Note:** This is a v2 endpoint.

### Get Showroom by UUID (Detailed)

Returns complete data including assets:

```bash
curl -X POST "https://api-platform.vntana.com/v2/showrooms/get-by-uuid" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid": "showroom-uuid"}'
```

## Showroom Tags

Organization-level tags (unlike workspace-level asset tags). Must be created before adding to showrooms.

### Create Tag

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/tags" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Tag Name"}'
```

**Error:** `TAG_ALREADY_EXISTS_FOR_ORGANIZATION_AND_NAME` if duplicate.

### Search Tags

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/tags/search" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "Test Tag", "page": 1, "size": 10}'
```

## Showroom Images

Upload images for logos or backgrounds.

### Upload Image

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/upload/images" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response:** Returns `blobId` to use as `logoBlobId` or `BACKGROUND_IMAGE_BLOB_ID`.

### Download Image

```bash
curl -X GET "https://api-platform.vntana.com/v1/showrooms/images/$BLOB_ID" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -o image.jpg
```

## Showroom Attributes

Get attributes displayed from assets in showroom:

```bash
curl -X GET "https://api-platform.vntana.com/v1/showrooms/$SHOWROOM_UUID/products-attributes" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

**Response:** Returns attribute keys (not values, which vary per asset).

## Share Links

Customer-specific share links with styling and grouping.

### Create Share Link

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/sharelinks" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "showroomUuid": "showroom-uuid",
    "customerName": "Customer Name",
    "logoBlobId": null,
    "productAttributes": ["SKU", "MSRP"],
    "expirationDate": "2029-12-12"
  }'
```

**Note:** Creating a share link doesn't invite users. Invite via Platform UI.

### Update Share Link

```bash
curl -X PUT "https://api-platform.vntana.com/v1/showrooms/sharelinks" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid": "sharelink-uuid", "customerName": "Updated", ...}'
```

### Get Share Link by UUID

```bash
curl -X GET "https://api-platform.vntana.com/v1/showrooms/sharelinks/$SHARELINK_UUID" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

**Response includes:** `publicLink` (the shareable URL), `status` (DRAFT/LIVE), `usersCount`.

### Search Share Links

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/$SHOWROOM_UUID/sharelinks" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "size": 20}'
```

### Get Combined Showroom and Share Link Data

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/combined-sharelink" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shareLinkUuid": "sharelink-uuid"}'
```

Returns detailed data for share link, showroom, and all assets.

## Order Counts

Editor users can add order counts to assets, visible to showroom managers.

### Add Order Count

```bash
curl -X POST "https://api-platform.vntana.com/v1/showrooms/sharelinks/order-item" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shareLinkUuid": "sharelink-uuid",
    "orderItem": {"productUuid": "asset-uuid", "count": 5}
  }'
```

### Get Order Counts

```bash
curl -X GET "https://api-platform.vntana.com/v1/showrooms/sharelinks/$SHARELINK_UUID/order" \
  -H "X-AUTH-TOKEN: Bearer $REFRESH_TOKEN"
```

**Response includes:** `productOrderItems` array with counts, `createdBy`, `lastUpdatedBy`.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-authenticate |
| SHOWROOM_NOT_FOUND | Invalid showroomUuid | Verify UUID via search |
| SHARELINK_NOT_FOUND | Invalid shareLinkUuid | Verify UUID via search |
| TAG_ALREADY_EXISTS_FOR_ORGANIZATION_AND_NAME | Duplicate tag | Search for existing tag |

## Related

- [Organizations & Clients](../organizations/organizations-clients.md)
- [Searching Products](../products/searching-products.md)
- [Tags](../content/tags.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
