# VNTANA API Endpoint Cheatsheet

## Quick Reference

### Admin API Base URL
`https://api-platform.vntana.com`

### Public API Base URL
`https://api.vntana.com`

### Authentication
- **Admin API**: `X-AUTH-TOKEN` header required (organization-specific token)
- **Public API**: Uses org/client slugs in path (no authentication header required)

---

## Admin API Endpoints (237 endpoints)

### Operations about Webhooks
| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | /v1/webhooks/{uuid} | Get the webhook by uuid |
| PUT | /v1/webhooks/{uuid} | Update the webhook |
| DELETE | /v1/webhooks/{uuid} | Delete the webhook |
| POST | /v1/webhooks/ | Save the webhook |
| PATCH | /v1/webhooks/{webhookUuid}/secret | Update secret by Uuid |
| GET | /v1/webhooks/organization/{organizationUuid} | get the webhook by organizationUuid |

### Operations about Events
| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | /v1/webhooks/events/ | Get all events |

### Operations about environment maps
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/viewer/environment-maps | Update existing environment map for organization or workspace level |
| POST | /v1/viewer/environment-maps | Create new environment map for organization or workspace level |
| POST | /v1/viewer/environment-maps/upload/images | Upload the environment map image to be used with the create or update |
| GET | /v1/viewer/environment-maps/{uuid} | Return environment map details by uuid |
| DELETE | /v1/viewer/environment-maps/{uuid} | Deletes environment map by uuid |
| GET | /v1/viewer/environment-maps/by-organization | Get the list of environment maps (global environment maps and organization specific) |

### Operations about viewer presets
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/viewer-presets | Update existing viewer preset for organization or workspace level |
| POST | /v1/viewer-presets | Create new viewer preset for organization or workspace level |
| POST | /v1/viewer-presets/search | Search viewer presets by name, client uuid and preset type |
| GET | /v1/viewer-presets/{uuid} | Return viewer preset details by preset uuid |
| DELETE | /v1/viewer-presets/{uuid} | Deletes viewer preset by uuid |
| GET | /v1/viewer-presets/default | Returns the default viewer configs for the provided workspace |
| GET | /v1/viewer-presets/by-organization | Return the entire list of viewer presets (system presets, organization and workspace presets) |

### Operations about variant groups
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/variant-groups | Update a variant group |
| POST | /v1/variant-groups | Create a new variant group |
| DELETE | /v1/variant-groups | Delete variant group |
| PUT | /v1/variant-groups/update-status | Update a variant group status |
| PUT | /v1/variant-groups/add-products | Add products to the variant group |
| POST | /v1/variant-groups/search | Search variant groups by filter |
| GET | /v1/variant-groups/{uuid} | Get variant group by uuid |
| GET | /v1/variant-groups/{uuid}/thumbnail | Load variant groups thumbnail |

### Operations about users
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/users/access-privilege | Update user access to entity |
| POST | /v1/users/search-grants | Search user grants |
| POST | /v1/users/granted-access | Get granted access |
| GET | /v1/users | Get users list in organization |
| GET | /v1/users/grants | Get user grants |
| GET | /v1/users/account-details | Get account details |
| GET | /v1/users/account-details/{userUuid} | Get account details by user uuid |
| DELETE | /v1/users/revoke-access | Revoke user access |

### Operations about tags
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/tags/update | Update the tag |
| POST | /v1/tags/search | Search tags |
| POST | /v1/tags/create | Create a new tag |
| POST | /v1/tags/clients/search | Search tags in many clients |
| POST | /v1/tags/check-usages | Check the usage of tags |
| GET | /v1/tags/groups/{uuid} | Retrieve tags by tag group |
| DELETE | /v1/tags/{uuid} | Delete the tag |

### Operations about tag groups
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/tag-groups/update | Create a new tag |
| POST | /v1/tag-groups/generate | Generate tag group name |
| POST | /v1/tag-groups/create | Create a new tag |
| GET | /v1/tag-groups/clients/{clientUuid} | Retrieve tag groups for client |
| DELETE | /v1/tag-groups/delete | Delete tag groups |

### Operations about showrooms
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/showrooms | Update a showroom |
| POST | /v1/showrooms | Create a new showroom |
| DELETE | /v1/showrooms | Delete a showroom |
| POST | /v1/showrooms/{uuid}/sharelinks | Get sharelinks for showroom |
| POST | /v1/showrooms/upload/images | Upload showroom images |
| POST | /v1/showrooms/search | Search showrooms [DEPRECATED]. Use /v2/showrooms/search |
| POST | /v1/showrooms/get-by-uuid | Get showroom by uuid [DEPRECATED]. Use /v2/showrooms/get-by-uuid |
| POST | /v1/showrooms/combined-sharelink | Get combined sharelink |
| GET | /v1/showrooms/{uuid}/products-attributes | Get products attributes |
| GET | /v1/showrooms/images/{blobId} | Get showroom image |
| DELETE | /v1/showrooms/bulk | Bulk delete showrooms |

### showroom-tag-resource
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/showrooms/tags | Update showroom tag |
| POST | /v1/showrooms/tags | Create showroom tag |
| POST | /v1/showrooms/tags/search | Search showroom tags |
| DELETE | /v1/showrooms/tags/{uuid} | Delete showroom tag |

### Operations about share links
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/showrooms/sharelinks | Update share link |
| POST | /v1/showrooms/sharelinks | Create share link |
| PUT | /v1/showrooms/sharelinks/update-status | Update share link status |
| POST | /v1/showrooms/sharelinks/{uuid}/place-order | Place order |
| POST | /v1/showrooms/sharelinks/order-report/generate | Generate order report |
| POST | /v1/showrooms/sharelinks/order-item | Create order item |
| POST | /v1/showrooms/sharelinks/bulk | Bulk operations on share links |
| GET | /v1/showrooms/sharelinks/{uuid} | Get share link by uuid |
| DELETE | /v1/showrooms/sharelinks/{uuid} | Delete share link |
| GET | /v1/showrooms/sharelinks/{uuid}/order | Get order for share link |
| GET | /v1/showrooms/sharelinks/{uuid}/combined-users | Get combined users for share link |
| GET | /v1/showrooms/sharelinks/order-report/{generationUuid}/signed-url | Get signed url for order report |

### Operations about showrooms v2
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v2/showrooms/search | Search showrooms by search term, where it looks up into showroom's name |
| POST | /v2/showrooms/get-by-uuid | Get showroom by uuid |

### Operations about showroom comments
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/showroom-comments | Update a showroom comment |
| POST | /v1/showroom-comments | Create a new showroom comment for a specific product |
| POST | /v1/showroom-comments/search | Get product comments list in showroom |
| DELETE | /v1/showroom-comments/{uuid} | Delete a showroom comment |

### Operations about projects
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/projects | Update an existing project |
| POST | /v1/projects | Create a new project |
| DELETE | /v1/projects | Delete projects |
| PUT | /v1/projects/status | Update project status |
| PUT | /v1/projects/parent | Update project's parent |
| PUT | /v1/projects/link-products | Link assets to a project |
| POST | /v1/projects/upload/images | Upload project cover image |
| POST | /v1/projects/search | Get projects list with its subprojects matching search filters |
| POST | /v1/projects/filter-parents-by-client | Get parent projects list by client uuid and other filters |
| GET | /v1/projects/{uuid} | Returns project information (including its products list) with subProjects |
| GET | /v1/projects/images/{blobId} | Download project cover image |
| DELETE | /v1/projects/unlink-products | Delete assets links from a project |

### Operations about products
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/products | Update product |
| POST | /v1/products | Create a new product |
| PUT | /v1/products/viewer-settings | Update viewer settings |
| PUT | /v1/products/update/send-for-review | Update product and send for review |
| PUT | /v1/products/status | Update products statuses |
| PUT | /v1/products/status/send-for-review | Update products status to waiting review |
| PUT | /v1/products/reviewed-status/{status} | Update reviewed products status |
| PUT | /v1/products/reconvert | Send product to reconversion |
| PUT | /v1/products/reconvert-publish | Send product to reconversion and publish |
| PUT | /v1/products/integration-attributes | Create integration attributes |
| POST | /v1/products/{uuid}/qr-code/generate | Generate QR Code |
| POST | /v1/products/regenerate-thumbnails | Regenerate thumbnails |
| POST | /v1/products/publish-to-facebook | Publish to Facebook |
| POST | /v1/products/move | Move products |
| POST | /v1/products/integration/publish | Publish to integration |
| POST | /v1/products/integration/bulk/publish | Bulk publish to integration |
| POST | /v1/products/create/send-for-review | Create a new product and send it for review |
| POST | /v1/products/contextual-search | Contextual search products |
| POST | /v1/products/clone | Clone product |
| POST | /v1/products/clients/{clientUuid}/search | Search products in one client |
| POST | /v1/products/clients/search | Search products |
| POST | /v1/products/asset-type/by-resource-data | Get asset type by resource data |
| GET | /v1/products/{uuid} | Get product by uuid |
| GET | /v1/products/{productUuid}/download/model | Download model |
| GET | /v1/products/{productUuid}/download/model/{blobId} | Download model by blob id |
| GET | /v1/products/{productUuid}/download/asset | Download asset |
| GET | /v1/products/{productUuid}/download/asset/{blobId} | Download asset by blob id |
| GET | /v1/products/{productUuid}/conversion-action-types/status | Returns conversion action types status |
| GET | /v1/products/{productUuid}/clients/{clientUuid}/thumbnails/{thumbnailBlobId} | Load product thumbnail through image resizing |
| GET | /v1/products/integration-attributes/{type}/{productUuid} | Get integration attributes |
| GET | /v1/products/integration-attributes/{productUuid} | Get integration attributes by product |
| GET | /v1/products/attribute-keys/all | Get all attribute keys |
| DELETE | /v1/products/hard-delete | Permanently delete product |
| DELETE | /v1/products/delete | Delete products |

### render-resource
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/products/renders | Triggers render generation for a product |

### Bulk operations about products
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/bulk/products/reviewed-status/{status} | Bulk update reviewed products status |
| POST | /v1/bulk/products/send-for-review | Bulk send products for review |

### Operations about products data import/export
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/product-data/upload | Upload product data |
| POST | /v1/product-data/import | Import product data |
| POST | /v1/product-data/import/integration-attributes | Import integration attributes |
| POST | /v1/product-data/export | Export product data |
| GET | /v1/product-data/import/{generationUuid}/status | Get import status |
| GET | /v1/product-data/export/{generationUuid}/status | Get export status |

### Operations about presets
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/presets/organization | Update organization presets |
| POST | /v1/presets/organization | Create organization presets |
| PUT | /v1/presets/client | Update client presets |
| POST | /v1/presets/client | Create client presets |
| POST | /v1/presets/search | Search presets |
| POST | /v1/presets/check-usages | Check usage of preset's name |
| GET | /v1/presets/{uuid} | Get preset by uuid |
| DELETE | /v1/presets/organization/{uuid} | Delete organization preset |
| DELETE | /v1/presets/client/{uuid} | Delete client preset |

### Operations about locations
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/locations | Update the location |
| POST | /v1/locations | Create a new location |
| POST | /v1/locations/search | Search locations |
| POST | /v1/locations/check-usages | Check usage of locations. Returns true if any of location is used |
| GET | /v1/locations/{uuid} | Retrieve location by uuid |
| DELETE | /v1/locations/delete | Delete locations. Returns count of affected locations |

### Operations about invitations
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/invitations/user-invitation/showroom-sharelink | Update user invitation for showroom sharelink |
| POST | /v1/invitations/user-invitation/showroom-sharelink | Create user invitation for showroom sharelink |
| DELETE | /v1/invitations/user-invitation/showroom-sharelink | Delete user invitation for showroom sharelink |
| PUT | /v1/invitations/reject/{token} | Reject invitation |
| POST | /v1/invitations/users/accept/showroom-sharelink | Accept showroom sharelink invitation |
| POST | /v1/invitations/users/accept/organization | Accept user invitation to organization |
| POST | /v1/invitations/users/accept/client-organization | Accept user invitation to client organization |
| POST | /v1/invitations/users/accept-sign-up/showroom-sharelink | Accept showroom sharelink invitation and sign up |
| POST | /v1/invitations/users/accept-sign-up/organization | Accept user invitation to organization and sign up |
| POST | /v1/invitations/users/accept-sign-up/client-organization | Accept user invitation to client and sign up |
| POST | /v1/invitations/user-invitation/showroom-sharelink/resend | Resend showroom sharelink invitation |
| POST | /v1/invitations/user-invitation/showroom-sharelink/bulk | Bulk user invitations for showroom sharelink |
| POST | /v1/invitations/user-invitation/organization | Invite user to organization |
| POST | /v1/invitations/user-invitation/client-organization | Invite user to client organization |
| POST | /v1/invitations/organizations/accept | Accept organization invitation |
| POST | /v1/invitations/organizations/accept-sign-up | Accept organization invitation and sign up |
| POST | /v1/invitations/invited | Get all invited user invitations |
| GET | /v1/invitations/user-invitation/{token} | Get user invitation |
| GET | /v1/invitations/organization-invitation/{token} | Get organization invitation |

### Operations about hotspots
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/hotspots | Update hotspot by request |
| POST | /v1/hotspots | Create hotspot by request |
| POST | /v1/hotspots/upload/images | Upload image for hotspot |
| POST | /v1/hotspots/search | Search hotspots by provided parameters |
| GET | /v1/hotspots/images/{blobId} | Load image for hotspot |
| DELETE | /v1/hotspots/{uuid} | Delete hotspot by uuid |

### Operations about comments
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/comments | Update product comment |
| POST | /v1/comments | Create a new product comment |
| DELETE | /v1/comments | Delete comment |
| PUT | /v1/comments/update | Update comment |
| POST | /v1/comments/search | Search comments |
| POST | /v1/comments/create | Create a new comment |
| GET | /v1/comments/images/{blobId} | Download attachment for comment |

### Operations about clients
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/clients | Update client |
| POST | /v1/clients | Create a new client |
| POST | /v1/clients/slug-availability | Check slug availability |
| GET | /v1/clients/{uuid} | Get client details |
| DELETE | /v1/clients/{uuid} | Delete client |
| GET | /v1/clients/images/{uuid} | Get client image |
| GET | /v1/clients/client-organizations | Get client list of current organizations |
| GET | /v1/clients/client-organizations/users/{userUuid} | Get client list of current organizations for user |

### Operations about annotations
| Method | Endpoint | Summary |
|--------|----------|---------|
| PUT | /v1/annotations | Update annotation |
| POST | /v1/annotations | Create a new annotation |
| DELETE | /v1/annotations | Delete annotation |
| POST | /v1/annotations/search | Search annotations |
| POST | /v1/annotations/resolve | Resolve annotation |
| GET | /v1/annotations/images/{blobId} | Upload attachment for annotation |

### Operations about analytics
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/metrics/query | Query metrics |
| POST | /v1/metrics/query/most-viewed-products | Query most viewed products |
| POST | /v1/metrics/query/avg-num-of-interactions | Query average number of interactions |

### Operations about analytics 2.0
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v2/analytics/events | Submit analytics events |
| POST | /v2/analytics/sessions | Submit analytics sessions |
| POST | /v2/analytics/query | Query analytics data |

### Operations about authentication
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/auth/refresh-token | Login to organization by retrieving new organization specific token |
| POST | /v1/auth/logout | Logout from platform and expire token |
| POST | /v1/auth/login | Login to platform. After login, the list of organizations becomes available |
| POST | /v1/auth/login/token | Login to platform using personal access token |

### Operations about attachments
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/attachments | Creates product related attachment resource, after uploading the file |
| POST | /v1/attachments/variant-group | Creates variant group attachment entity, after uploading the file |
| POST | /v1/attachments/upload | Upload attachment resource |
| POST | /v1/attachments/upload/product-attachment | Upload product attachment resource |
| POST | /v1/attachments/search | Search attachments resources |
| DELETE | /v1/attachments/{productUuid}/{uuid} | Delete product attachment resource |
| DELETE | /v1/attachments/variant-group/{variantGroupUuid}/{uuid} | Delete variant group attachment resource |

### Operations about assets
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/assets | Create Asset |

### Operations about files upload
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/storage/upload/clients/resource/sign-url | Creates an upload session with a signed URL for the specified storeType |
| POST | /v1/storage/upload/clients/products/asset/sign-url | Create asset upload sign url session |

### Operations about files load/download
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/storage/download/clients/sign-url | Create client resource download sign url session |
| GET | /v1/storage/load/clients/{clientUuid}/thumbnail/{blobId} | Download asset thumbnail by product UUID |
| GET | /v1/storage/load/asset/thumbnail | Download asset thumbnail |
| GET | /v1/storage/load/asset/optimized | Download optimized asset |
| GET | /v1/storage/load/asset/model | Download asset model |

### Operations about organizations
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /v1/organizations/slug-availability | Check slug availability |
| GET | /v1/organizations | Get available organizations list |
| GET | /v1/organizations/subscription-details | Get logged in organization subscription details |
| GET | /v1/organizations/images/{uuid} | Get organization image |
| GET | /v1/organizations/current | Get logged in organization details |

### Operations about pipelines
| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | /v1/pipelines | Get all pipelines |
| GET | /v1/pipelines/{uuid} | Get pipeline by uuid |

### Operations about languages
| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | /v1/languages | Get all languages |
| GET | /v1/languages/{uuid} | Get language by uuid |

### Operations about integrations
| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | /v1/products/integration-uploads/{type}/{productUuid} | Returns external integration uploads information |
| GET | /v1/integration-settings/amazon-marketplaces/{accountType} | Get Amazon marketplaces |

---

## Public API Endpoints (18 endpoints)

### Operations about variant groups
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /variant-groups/organizations/{organizationSlug}/clients/{clientSlug} | Get variant group details by uuid |
| GET | /variant-groups/organizations/{organizationSlug}/clients/{clientSlug}/{uuid}/thumbnail | Get variant group thumbnail by variant group uuid |

### Operations about showrooms
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /showrooms/organizations/{organizationSlug} | Get showroom by uuid legacy |
| POST | /showrooms/combined-sharelink | Get showroom for share link |
| GET | /showrooms/organizations/{organizationSlug}/{uuid} | Check showroom by uuid (deprecated) |
| GET | /showrooms/images/{uuid}/{blobId} | Get showroom image by blob id |

### Operations about assets
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /products/organizations/{organizationSlug}/clients/{clientSlug} | Search assets by defined parameters |
| GET | /products/{uuid}/organizations/{organizationSlug}/clients/{clientSlug} | Get asset details by uuid |
| GET | /assets/thumbnail/products/{productUuid}/organizations/{organizationSlug}/clients/{clientSlug} | Download asset thumbnail by asset uuid |
| GET | /assets/storage/download/test-session/{uuid} | Returns optimized GLB and USDZ signed-urls by test session uuid |
| GET | /assets/products/{productUuid}/organizations/{organizationSlug}/clients/{clientSlug}/{blobId} | Download asset model |
| GET | /assets/products/original-asset/{productUuid}/organizations/{organizationSlug}/clients/{clientSlug}/{blobId} | Download original asset by blob id |
| GET | /assets/organizations/{organizationSlug}/clients/{clientSlug}/thumbnail/{thumbnailUuid} | Download asset thumbnail by thumbnail uuid |

### Operations about assets' sharelinks
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /assets/sharelinks/by-uuid | Get public assets by sharelink uuid |

### Operations about hotspots
| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | /hotspots/search/organizations/{organizationSlug}/clients/{clientSlug} | Search hotspots of product by productUuid |
| GET | /hotspots/images/products/{productUuid}/organizations/{organizationSlug}/clients/{clientSlug}/{blobId} | Load hotspot image by blob id |

### Operations about viewer presets
| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | /viewer-presets/default/{organizationSlug} | Get default viewer preset by organization and client if provided |
| GET | /viewer-presets/default/system | Get system default viewer preset |

---

## Quick Tips

### Common Request Headers (Admin API)
```
X-AUTH-TOKEN: <your-organization-token>
Content-Type: application/json
```

### Authentication Flow

**Two login methods available:**

| Method | Endpoint | Request Body | Best For |
|--------|----------|--------------|----------|
| Email/Password | `POST /v1/auth/login` | `{"email": "...", "password": "..."}` | Interactive use, testing |
| Personal Access Token | `POST /v1/auth/login/token` | `{"personal-access-token": "..."}` | Automation (recommended) |

**Full flow:**
1. Login using one of the methods above to get initial `x-auth-token` (returned in response headers)
2. Call `POST /v1/auth/refresh-token` with `organizationUuid` header to get organization-specific token
3. Use the organization token in `X-AUTH-TOKEN: Bearer <token>` header for subsequent requests

> **Note:** Personal Access Tokens are called "Authentication Keys" in the Platform UI. Generate them from Profile → Authentication Key.

### Product Statuses
- `DRAFT` - Initial status, not published
- `LIVE` - Published and publicly accessible
- `WAITING_REVIEW` - Pending approval
- `APPROVED` / `REJECTED` - Review decision
- `CUSTOMER_REVIEW` / `CUSTOMER_APPROVED` / `CUSTOMER_REJECTED` - Customer review workflow

### Conversion Statuses
- `PENDING` - Waiting to be processed
- `CONVERTING` - Currently being processed
- `COMPLETED` - Processing finished successfully
- `FAILED` - Processing failed
- `NO_ASSET` - No asset to process
- `TERMINATED` - Processing was stopped
- `NOT_APPLICABLE` - Conversion not needed

### Common Query Parameters
- `page` - Page number (0-indexed)
- `size` - Items per page
- `searchTerm` - Full-text search
- `uuid` - Entity identifier

---

*Generated from VNTANA OpenAPI specifications*
*Admin API: 237 endpoints | Public API: 18 endpoints*
