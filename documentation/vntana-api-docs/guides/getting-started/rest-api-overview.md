# REST API Overview

The VNTANA Platform exposes features via API in both Public and Admin API sets, enabling complete integration into workflows, e-commerce sites, and custom applications.

## API Types

| API | Purpose | Authentication |
|-----|---------|----------------|
| **Public API** | Limited commands to access Asset information | No authentication required |
| **Admin API** | Full range of commands for complete integration | Always requires authentication |

## Base URLs

| API | Base URL |
|-----|----------|
| Public API | `https://api.vntana.com` |
| Admin API | `https://api-platform.vntana.com` |

## Authentication

The Admin API always requires proper authentication. This can be achieved using:

- **VNTANA Platform email and password** - For development and testing
- **Authentication Key** - Recommended for integrations (can be stored locally for quick authentication)

### Authentication Flow

1. **Retrieve x-auth-token** using login credentials
2. **Generate a Refresh Token** for the specific Organization
3. **Generate a Workspace Refresh Token** (if not Organization Owner/Admin)

**Note:** Organization Owners and Admins only need the Organization-level Refresh Token. Other users must generate Workspace-specific Refresh Tokens to interact with each Workspace.

See [API Authentication](../authentication/api-authentication.md) for detailed instructions.

### Generating an Authentication Key

Authentication Keys are recommended for API integrations as they can be stored locally for quick authentication.

**Steps:**
1. Log in to VNTANA Platform
2. Click profile icon in upper right corner
3. Navigate to "My Profile" page
4. Click the **Authentication Key** tab
5. Click **Generate** button
6. Copy the generated token

**Note:** If you lose your token, regenerate it on the Platform.

See [Generate Auth Key](../authentication/generate-auth-key.md) for detailed instructions.

## Request/Response Format

All API requests and responses use JSON format.

### Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-AUTH-TOKEN` | Yes (Admin API) | Authentication token |
| `Content-Type` | Yes | `application/json` |

## Organizations and Workspaces

### Organizations

Organizations are the highest level of structure on the VNTANA Platform:
- Act as containers for Workspaces, Webhooks, and Users
- Not all users can access all content (varies by User Access level)

### Workspaces

Workspaces are containers for Assets, Projects, and associated entities:
- Called "Workspaces" on the Platform, but `client` in the API (legacy nomenclature)
- Contain Assets, Projects, Tags, and Attachments
- Users can be limited to specific Workspaces
- Users without full Organization access must generate Workspace-specific Refresh Tokens

**UUIDs:** Organization and Workspace UUIDs are needed for many API operations (authentication, creating Assets, etc.). These can be stored locally or retrieved via API.

See [Organizations and Clients](../organizations/organizations-clients.md) for details.

## Assets (Products)

### Searching Assets

You can search for Assets using various parameters and retrieve Asset information including UUIDs:
- UUIDs are needed for downloading 3D assets or generating iFrames
- Webhooks can send asset info on events (creation, optimization complete)

See [Searching Products](../products/searching-products.md) for details.

### Creating Assets

Asset creation is a three-step process:

1. **Create the Asset** - Initialize the asset record
2. **Get a signed-url** - Request an upload URL
3. **Upload the 3D file** - Send the file to the signed URL

When creating assets, you can add:
- Tags and Attributes
- Configurator/Variant Group assignment
- Optimization settings (cannot load saved Presets via API)

You can also update existing assets (metadata or re-upload 3D file).

See [Product Creation](../products/product-creation.md) for details.

### Downloading Assets

Both Public and Admin APIs can download:

| Format Type | Options |
|-------------|---------|
| 3D Formats | Original, GLB, FBX, USDZ |
| Preview Image | PNG |

See [Download Model](../products/download-model.md) for details.

## Projects

Projects provide organizational capabilities within Workspaces:
- Organize Assets by linking through Projects
- Projects can contain Assets and sub-Projects (like directories)
- View as grid or folder tree on the Platform

**API capabilities:**
- Create, update, and search Projects
- Link/unlink Assets to Projects
- Asset creation endpoint includes Project linking option

## Tags and Tag Groups

Tags provide Workspace-specific identifying information for Assets:
- Can indicate unique identifiers (SKU) or properties (material type)
- Tag Groups help organize Tags for easier retrieval
- Used for searching/filtering Assets or Configurators

See [Tags](../content/tags.md) for details.

## Annotations

Annotations allow you to place comments on 3D assets in 3D space:
- Highlight problem areas or link resources to components
- **Not publicly viewable** (annotations will not show in embed links or iFrames)

**API capabilities:** Create, retrieve, add attachments

**Important:** When creating annotations via API, `dimensions` must be passed as stringified JSON with escaped quotes:

```json
"{\"position\": \"0.0m 0.0m 0.0m\", \"normal\": \"0.0m 0.0m 0.0m\"}"
```

See [Annotations](../content/annotations.md) for details.

## Comments

Comments enable team communication on the Platform regarding Assets:
- Not shown in 3D space (unlike Annotations)
- Can be linked to: Asset, Configurator, or Annotation

**API capabilities:** Create, edit, delete, add attachments

See [Comments](../content/comments.md) for details.

## Attachments

Attachments allow you to upload files directly to Assets:
- Can also attach to Comments and Annotations
- Use cases: renders, reference materials, supplementary documentation

See [Upload Attachments](../content/upload-attachments.md) for details.

## Webhooks

Webhooks combined with the Admin API improve integration capabilities by:
- Subscribing to events (asset created, optimization complete, etc.)
- Reducing API calls needed for automation

**API capabilities:**
- Create and update Webhooks
- Retrieve Secret Key for validation
- Regenerate Secret Key

See [Webhooks](../webhooks/webhooks.md) for details.

## Related Guides

### Getting Started
- [Postman Collection](./postman.md) - Test API calls with Postman

### Authentication
- [API Authentication](../authentication/api-authentication.md) - Complete authentication workflow
- [Generate Auth Key](../authentication/generate-auth-key.md) - Create authentication keys
- [Refresh Token Usage](../authentication/refresh-token-usage.md) - Token refresh workflow

### Products
- [Product Creation](../products/product-creation.md) - Create and upload assets
- [Searching Products](../products/searching-products.md) - Search and filter assets
- [Retrieve Product UUID](../products/retrieve-product-uuid.md) - Get asset identifiers
- [Download Model](../products/download-model.md) - Download 3D files

### Content
- [Tags](../content/tags.md) - Tag management
- [Annotations](../content/annotations.md) - 3D annotations
- [Comments](../content/comments.md) - Team comments
- [Upload Attachments](../content/upload-attachments.md) - File attachments

### Organization
- [Organizations and Clients](../organizations/organizations-clients.md) - Organization structure

### Integration
- [Webhooks](../webhooks/webhooks.md) - Event-driven integration
- [3D WebViewer](../embedding/3d-webviewer-html.md) - Embed 3D content

### Reference
- [Endpoint Cheatsheet](../../quick-reference/endpoint-cheatsheet.md) - All endpoints at a glance
- [Error Codes](../../quick-reference/error-codes.md) - Error troubleshooting
- [Swagger: Admin API](../../swagger/vntana-admin-api-docs.yaml) - Full Admin API specification
- [Swagger: Public API](../../swagger/vntana-public-api-docs.yaml) - Full Public API specification
