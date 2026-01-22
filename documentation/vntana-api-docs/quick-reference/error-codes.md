# VNTANA API Error Codes Reference

This document provides a comprehensive reference for error codes returned by the VNTANA Admin API.

## HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Request successful |
| 401 | Unauthorized | Invalid or missing `X-AUTH-TOKEN` header |
| 403 | Forbidden | Insufficient permissions for the requested operation |
| 404 | Not Found | Resource doesn't exist (product, organization, etc.) |
| 409 | Conflict | Resource conflict (e.g., duplicate name, already exists) |
| 422 | Unprocessable Entity | Validation failed (missing required fields, invalid values) |

## Error Response Format

All API responses follow this standard format:

```json
{
  "success": false,
  "errors": ["ERROR_CODE_1", "ERROR_CODE_2"],
  "response": null
}
```

- **success**: Boolean indicating request success
- **errors**: Array of error code strings (empty on success)
- **response**: Response data (null on error, object on success)

---

## Common Error Scenarios

### Authentication Errors

These errors occur when authentication or authorization fails.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `NOT_AUTHORIZED` | 401/403 | User lacks permission | Verify API token and user permissions |
| `INVALID_OPERATION_FOR_ROLE` | 403 | Operation not allowed for user's role | Check role-based access requirements |
| `USER_ACCESS_DENIED` | 403 | Access denied for this user | Verify user has access to the resource |
| `MISSING_PERMISSIONS` | 403 | Required permissions not granted | Contact organization admin for permissions |
| `MISSING_DELETE_PERMISSION` | 403 | Cannot delete without proper permission | Request delete permissions |

---

## Validation Errors

### Missing Required Fields

These errors indicate a required field was not provided in the request.

| Error Code | Description |
|------------|-------------|
| `MISSING_UUID` | Resource UUID not provided |
| `MISSING_UUIDS` | Multiple UUIDs not provided |
| `MISSING_NAME` | Name field required |
| `MISSING_ORGANIZATION_UUID` | Organization UUID required |
| `MISSING_CLIENT_UUID` | Client/Workspace UUID required |
| `MISSING_USER_UUID` | User UUID required |
| `MISSING_PRODUCT_UUID` | Product UUID required |
| `MISSING_PRODUCTS_UUIDS` | Product UUIDs array required |
| `MISSING_STATUS` | Status field required |
| `MISSING_PAGE` | Pagination page number required |
| `MISSING_SIZE` | Pagination page size required |
| `MISSING_BLOB_ID` | Blob ID for file upload required |
| `MISSING_TEXT` | Text content required |
| `MISSING_DIMENSIONS` | Dimension data required |

### Invalid Field Values

These errors indicate a field value failed validation.

| Error Code | Description |
|------------|-------------|
| `INVALID_PAGE` | Page number out of valid range |
| `INVALID_SIZE` | Page size out of valid range |
| `INVALID_UUID` | Malformed UUID format |
| `INVALID_PRODUCT_UUID` | Invalid product UUID |
| `INVALID_TAG_UUID` | Invalid tag UUID |
| `INVALID_LOCATION_UUID` | Invalid location UUID |
| `INVALID_ATTRIBUTE_KEY` | Attribute key contains invalid characters |
| `INVALID_ATTRIBUTE_VALUE` | Attribute value invalid |
| `INVALID_FORMAT` | Data format invalid |
| `INVALID_PASSWORD` | Password doesn't meet requirements |
| `INVALID_STATUS` | Status value not recognized |
| `INVALID_PRODUCTS_SIZE` | Products count exceeds limit or is zero |
| `INVALID_TEXT_SIZE` | Text exceeds maximum length |
| `NAME_TOO_LONG` | Name exceeds maximum character limit |
| `NAME_MAX_LENGTH_512` | Name exceeds 512 characters |
| `INVALID_SORT_FIELD` | Sort field not supported |
| `INVALID_SORT_ORDER` | Sort order must be ASC or DESC |
| `INVALID_SEARCH_FIELD` | Search field not supported |
| `INVALID_SEARCH_QUERY` | Search query format invalid |
| `INVALID_SEARCH_TERM_SIZE` | Search term too long or too short |

---

## Resource Errors

### Product Errors

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `PRODUCT_NOT_FOUND` | 404 | Product UUID doesn't exist | Verify product UUID |
| `PRODUCT_NOT_UPDATABLE` | 409 | Product is locked or in conversion | Wait for conversion to complete |
| `PRODUCT_CHANGE_IS_UNAVAILABLE` | 409 | Product cannot be modified | Check product state |
| `PRODUCT_ALREADY_LIVE` | 409 | Product is already published | Unpublish before modifying |
| `PRODUCT_ALREADY_REVIEWED` | 409 | Product review already completed | No further review actions allowed |
| `PRODUCT_IS_NOT_PUBLISHED` | 422 | Product must be published first | Publish the product |
| `PRODUCT_REVIEW_ACTION_NOT_ALLOWED` | 403 | Review action not permitted | Check review workflow permissions |
| `PRODUCT_ASSOCIATED_TO_VARIANT_GROUP` | 409 | Product is part of variant group | Remove from variant group first |
| `PRODUCT_CREATION_LIMIT_REACHED` | 422 | Maximum products reached | Upgrade subscription or delete products |
| `ACTIVE_PRODUCTS_LIMIT_EXCEEDED` | 422 | Active product limit exceeded | Archive or delete products |
| `CANT_PUBLISH_PRODUCT_WITHOUT_REVIEW` | 422 | Review required before publishing | Complete review workflow |
| `SOURCE_PRODUCT_NOT_FOUND` | 404 | Source product for copy not found | Verify source product UUID |
| `THUMBNAIL_NOT_FOUND` | 404 | Thumbnail image not found | Upload thumbnail first |

### Conversion Errors

| Error Code | Description |
|------------|-------------|
| `RECONVERT_NOT_ALLOWED` | Product cannot be reconverted |
| `CONVERSION_TERMINATE_NOT_ALLOWED` | Cannot terminate current conversion |

**Conversion Status Values:**
- `PENDING` - Waiting in queue
- `CONVERTING` - Currently processing
- `COMPLETED` - Successfully converted
- `FAILED` - Conversion failed
- `NO_ASSET` - No asset to convert
- `TERMINATED` - User terminated conversion
- `NOT_APPLICABLE` - Conversion not needed

### Malware Scanning Errors

| Error Code | Description |
|------------|-------------|
| `FORBIDDEN_OPERATION_WITH_FAILED_OR_SCANNING_MALWARE_STATUS` | Cannot perform operation while malware scan in progress or failed |
| `INVALID_PRODUCT_MALWARE_STATUS_UPDATE` | Invalid malware status update |

**Malware Processing Status Values:**
- `NOT_SCANNED` - Not yet scanned
- `NO_FILE` - No file to scan
- `SCANNING` - Scan in progress
- `FAILED` - Scan failed
- `SUCCEEDED` - Scan passed
- `RESCAN` - Queued for rescan

---

### Organization/Workspace Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `ORGANIZATION_NOT_FOUND` | 404 | Organization UUID doesn't exist |
| `CLIENT_NOT_FOUND` | 404 | Workspace (client) not found |
| `CLIENT_ORGANIZATION_NOT_FOUND` | 404 | Client organization not found |
| `SLUG_ALREADY_EXISTS` | 409 | Organization/workspace slug taken |
| `SLUG_NOT_VALID` | 422 | Slug format invalid |

---

### Project Errors

| Error Code | Description |
|------------|-------------|
| `PROJECT_NOT_FOUND` | Project UUID doesn't exist |
| `PARENT_PROJECT_NOT_FOUND` | Parent project UUID doesn't exist |
| `PROJECT_IS_NOT_PUBLISHED` | Project must be published |
| `PROJECT_UPDATE_NOT_ALLOWED` | Cannot update this project |
| `INVALID_PARENT_UUID` | Parent UUID invalid or causes circular reference |
| `PRODUCTS_NOT_IN_SAME_ORGANIZATION_OR_CLIENT` | All products must belong to same org/workspace |

**Project Status Values:**
- `DRAFT` - Not published
- `WAITING_REVIEW` - Pending review
- `APPROVED` - Review approved
- `REJECTED` - Review rejected
- `LIVE_INTERNAL` - Published internally
- `LIVE_PUBLIC` - Published publicly

---

### Variant Group Errors

| Error Code | Description |
|------------|-------------|
| `VARIANT_GROUP_NOT_FOUND` | Variant group UUID doesn't exist |
| `VARIANT_GROUP_ALREADY_HAS_THE_SAME_STATUS` | Status unchanged |
| `HAS_NOT_LIVE_PRODUCT` | Variant group has no live products |
| `NO_3D_PRODUCTS` | Variant group requires 3D products |

---

### Tag Errors

| Error Code | Description |
|------------|-------------|
| `TAG_NOT_FOUND` | Tag UUID doesn't exist |
| `TAG_GROUP_NOT_FOUND` | Tag group UUID doesn't exist |
| `TAG_ALREADY_EXISTS_FOR_CLIENT_AND_NAME` | Tag name exists in this workspace |
| `TAG_ALREADY_EXISTS_FOR_ORGANIZATION_AND_NAME` | Tag name exists in this organization |
| `ALREADY_EXISTS_FOR_CLIENT_AND_NAME` | Tag group name exists in this workspace |

---

### Location Errors

| Error Code | Description |
|------------|-------------|
| `LOCATION_NOT_FOUND` | Location UUID doesn't exist |
| `LOCATION_ALREADY_EXISTS_FOR_CLIENT_AND_NAME` | Location name exists in this workspace |
| `LANGUAGE_UUID_NOT_FOUND` | Language UUID doesn't exist |
| `REGION_UUID_NOT_FOUND` | Region UUID doesn't exist |
| `TAG_UUID_NOT_FOUND` | Tag UUID doesn't exist for location |

---

### Showroom Errors

| Error Code | Description |
|------------|-------------|
| `SHOWROOM_NOT_FOUND` | Showroom UUID doesn't exist |
| `INCORRECT_PASSWORD` | Showroom password incorrect |
| `DUPLICATED_PRODUCTS_UUIDS` | Duplicate products in showroom |
| `DUPLICATED_VARIANT_GROUPS_UUIDS` | Duplicate variant groups in showroom |
| `PRODUCTS_NOT_IN_SAME_ORGANIZATION` | All products must be from same organization |
| `INVALID_LAYOUT_ATTRIBUTE_PRODUCTS_PER_ROW` | Invalid products per row setting |
| `INVALID_LAYOUT_ATTRIBUTE_BACKGROUND_COLOR` | Invalid background color format |
| `INVALID_LAYOUT_ATTRIBUTE_DIVIDER_COLOR` | Invalid divider color format |
| `INVALID_LAYOUT_ATTRIBUTE_TEXT_COLOR` | Invalid text color format |
| `INVALID_LAYOUT_ATTRIBUTE_IMAGE_STYLE` | Invalid image style setting |

---

### Share Link Errors

| Error Code | Description |
|------------|-------------|
| `SHARELINK_NOT_FOUND` | Share link UUID doesn't exist |
| `PRODUCT_NOT_FOUND_IN_SHOWROOM` | Product not in showroom |
| `VARIANT_GROUP_NOT_FOUND_IN_SHOWROOM` | Variant group not in showroom |
| `PRODUCT_NOT_FOUND_IN_VARIANT_GROUP` | Product not in variant group |
| `ORDER_NOT_FOUND` | Order UUID doesn't exist |
| `ORDER_REPORT_GENERATION_ERROR` | Failed to generate order report |
| `ORDER_REPORT_UPLOAD_ERROR` | Failed to upload order report |
| `ORDER_REPORT_TYPE_NOT_SUPPORTED` | Report type not supported |
| `ORDER_REPORT_NOT_FOUND` | Order report not found |

**Share Link Status Values:**
- `DRAFT` - Not published
- `LIVE` - Active and accessible
- `EXPIRED` - No longer accessible

---

### Preset Errors

| Error Code | Description |
|------------|-------------|
| `PRESET_NOT_FOUND` | Preset UUID doesn't exist |
| `PRESET_ALREADY_IN_ORGANIZATION` | Preset already exists in organization |
| `INCORRECT_PRESET_TYPE` | Preset type mismatch |
| `INVALID_PRESET_NAME` | Preset name format invalid |
| `INVALID_MODEL_OPS_PARAMETERS` | ModelOps parameters invalid |
| `ORGANIZATION_PRESET_ALREADY_EXISTS_BY_REQUESTED_NAME` | Org preset name taken |
| `CLIENT_PRESET_ALREADY_EXISTS_BY_REQUESTED_NAME` | Workspace preset name taken |
| `PRESET_NAME_EXISTS_IN_CLIENTS` | Preset name exists in workspaces |

---

### Viewer Settings Errors

| Error Code | Description |
|------------|-------------|
| `VIEWER_SETTINGS_NOT_FOUND` | Viewer settings not found |
| `INVALID_VIEWER_SETTINGS_CONFIG` | Viewer settings config invalid |
| `INVALID_VALUE_FOR_VIEWER_SETTINGS` | Viewer setting value invalid |
| `INVALID_ENVIRONMENT_MAP` | Environment map invalid |

---

### Viewer Preset Errors

| Error Code | Description |
|------------|-------------|
| `VIEWER_PRESET_NOT_FOUND` | Viewer preset UUID doesn't exist |
| `VIEWER_PRESET_NAME_ALREADY_EXISTS` | Viewer preset name taken |
| `VIEWER_PRESET_SYSTEM_DEFAULT_CANNOT_BE_DELETED` | Cannot delete system default preset |
| `INVALID_VIEWER_PRESET_VALUE` | Viewer preset value invalid |
| `INVALID_FORMAT_VIEWER_PRESET_VALUE` | Viewer preset value format invalid |
| `INVALID_FORMAT_VIEWER_PRESET_CONFIG` | Viewer preset config format invalid |
| `VIEWER_PRESET_VALUE_TOO_LONG` | Viewer preset value exceeds limit |

---

### Environment Map Errors

| Error Code | Description |
|------------|-------------|
| `ENVIRONMENT_MAP_NOT_FOUND` | Environment map UUID doesn't exist |
| `NAME_ALREADY_EXISTS` | Environment map name taken |
| `TYPE_UPDATE_CONFLICT` | Cannot change environment map type |
| `CONFLICT_DEFAULT_ENVIRONMENT_MAP` | Cannot modify default environment map |
| `BLOB_ID_CONFLICT` | Blob ID already in use |
| `BLOB_UPDATE_ERROR` | Failed to update blob |
| `REPLACEMENT_ENVIRONMENT_MAP_NOT_FOUND` | Replacement map not found |
| `INVALID_REPLACEMENT_ENVIRONMENT_MAP` | Replacement map invalid |

**Environment Map Types:**
- `SYSTEM` - System-level (read-only)
- `ORGANIZATION` - Organization-level
- `CLIENT` - Workspace-level

**Environment Map Categories:**
- `CLO` - CLO environment maps
- `BROWZWEAR` - Browzwear environment maps
- `KHRONOS` - Khronos standard maps
- `CUSTOM` - Custom uploaded maps
- `OTHER` - Other sources

---

### Hotspot Errors

| Error Code | Description |
|------------|-------------|
| `HOTSPOT_NOT_FOUND` | Hotspot UUID doesn't exist |
| `PRODUCT_DOES_NOT_EXIST` | Product for hotspot not found |
| `ORGANIZATION_UUID_MISMATCH` | Hotspot org doesn't match product org |
| `MISMATCH_HOTSPOT_TYPE` | Hotspot type mismatch |
| `INVALID_CONFIG_DIMENSIONS_VALUE` | Hotspot dimensions config invalid |
| `INVALID_CONFIG_CAMERA_VALUE` | Hotspot camera config invalid |
| `INVALID_DIMENSIONS_SIZE` | Dimensions data exceeds limit |
| `INVALID_CAMERA_SIZE` | Camera data exceeds limit |
| `INVALID_ADDITIONAL_SETTINGS_SIZE` | Additional settings exceeds limit |

---

### Annotation/Comment Errors

| Error Code | Description |
|------------|-------------|
| `ANNOTATION_NOT_FOUND` | Annotation UUID doesn't exist |
| `ANNOTATION_DELETED` | Annotation was deleted |
| `ALREADY_RESOLVED` | Annotation already resolved |
| `PRODUCT_ORGANIZATION_UUID_NOT_MATCH` | Product doesn't match annotation org |
| `INVALID_ATTACHMENTS_SIZE` | Too many attachments |

---

### Integration Attribute Errors

| Error Code | Description |
|------------|-------------|
| `INTEGRATION_ATTRIBUTES_NOT_FOUND` | Integration attributes not found |
| `INTEGRATION_ATTRIBUTES_UPDATE_NOT_ALLOWED` | Cannot update integration attributes |
| `INVALID_INTEGRATION_ATTRIBUTE_KEY` | Integration attribute key invalid |
| `FACEBOOK_CONTENT_ID_UPDATE_NOT_ALLOWED` | Cannot update Facebook content ID |
| `ORIGIN_PRODUCT_NOT_FOUND` | Origin product not found |
| `INVALID_ASIN_FORMAT` | Amazon ASIN format invalid |

**Integration Types:**
- `AMAZON` - Amazon product integration
- `GOOGLE` - Google product integration
- `SHOPIFY` - Shopify product integration

---

### Attribute Errors

| Error Code | Description |
|------------|-------------|
| `ATTRIBUTE_UPDATE_NOT_ALLOWED` | Cannot update this attribute |
| `ATTRIBUTE_KEY_EXCEEDS_ALLOWED_LIMIT` | Attribute key too long |
| `ATTRIBUTE_VALUE_EXCEEDS_ALLOWED_LIMIT` | Attribute value too long |
| `MISSING_ATTRIBUTE_VALUE` | Attribute value required |

---

### Subscription/Billing Errors

| Error Code | Description |
|------------|-------------|
| `STRIPE_CUSTOMER_NOT_FOUND` | Stripe customer not found |
| `SUBSCRIPTION_MAX_PRODUCT_COUNT` | Product limit reached for subscription |
| `ACTIVE_PRODUCTS_REGISTRY_NOT_FOUND` | Active products registry not found |

---

### User Invitation Errors

| Error Code | Description |
|------------|-------------|
| `USER_NOT_FOUND` | User UUID doesn't exist |
| `IMAGE_NOT_FOUND` | User image not found |
| `ERROR_RETRIEVING_USERS` | Failed to retrieve users |
| `ERROR_RETRIEVING_INVITATION_USERS` | Failed to retrieve invited users |

---

## Asset Type Values

Products can have different asset types:

| Value | Description |
|-------|-------------|
| `THREE_D` | 3D model asset |
| `IMAGE` | Image asset |
| `VIDEO` | Video asset |
| `DOCUMENT` | Document asset |
| `PROJECT` | Project asset |
| `MATERIAL` | Material asset |
| `AUDIO` | Audio asset |
| `NATIVE` | Native format asset |
| `TRIM` | Trim asset |
| `AVATAR` | Avatar asset |
| `NO_ASSET` | No asset attached |

---

## Product Status Values

| Value | Description |
|-------|-------------|
| `DRAFT` | Not published |
| `WAITING_REVIEW` | Pending review |
| `APPROVED` | Review approved |
| `REJECTED` | Review rejected |
| `LIVE_INTERNAL` | Published internally |
| `LIVE_PUBLIC` | Published publicly |
| `CUSTOMER_REVIEW` | Customer review pending |
| `CUSTOMER_APPROVED` | Customer approved |
| `CUSTOMER_REJECTED` | Customer rejected |
| `CUSTOMER_DROPPED` | Customer dropped |
| `CUSTOMER_HOLD` | Customer on hold |
| `LIVE` | Published (general) |
| `INTERNAL` | Internal only |

---

## Conversion Format Values

| Value | Description |
|-------|-------------|
| `GLB` | GL Transmission Format Binary |
| `USDZ` | Universal Scene Description Zip |
| `OPTIMIZED` | VNTANA optimized format |
| `FBX` | Autodesk FBX format |
| `OBJ` | Wavefront OBJ format |
| `STEP` | STEP CAD format |

---

## Troubleshooting Guide

### 401 Unauthorized

1. Verify `X-AUTH-TOKEN` header is included
2. Check token has not expired
3. Ensure token is for correct organization
4. Try regenerating API token from VNTANA dashboard

### 403 Forbidden

1. Verify user has required role/permissions
2. Check operation is allowed for your subscription tier
3. Ensure resource belongs to your organization/workspace
4. Contact organization admin for permission changes

### 404 Not Found

1. Verify UUID is correct
2. Check resource exists and is not deleted
3. Ensure you have access to the resource's organization/workspace
4. Resources may be soft-deleted; check with admin

### 409 Conflict

1. Check for duplicate names/values
2. Verify resource is in correct state for operation
3. Wait for in-progress operations to complete
4. Remove conflicting relationships before retrying

### 422 Unprocessable Entity

1. Review all required fields are provided
2. Validate field formats (UUIDs, dates, enums)
3. Check values are within allowed ranges
4. Ensure referenced resources exist

---

*Last updated: 2026-01-22*
*Source: vntana-admin-api-docs.yaml*
