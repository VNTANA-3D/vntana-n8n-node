# VNTANA API Documentation

This directory contains comprehensive documentation for the VNTANA REST APIs, combining technical Swagger/OpenAPI specifications with practical usage guides.

## Directory Structure

```
api-documentation/
├── CLAUDE.md              # This file - API documentation guide
├── swagger/               # OpenAPI/Swagger specifications
│   ├── vntana-admin-api-docs.yaml    # Admin API (237 endpoints)
│   └── vntana-public-api-docs.yaml   # Public API (18 endpoints)
├── guides/                # Practical usage guides
│   ├── authentication/    # Auth workflows and token management
│   ├── getting-started/   # API overview and setup
│   ├── products/          # Product CRUD operations
│   ├── content/           # Tags, annotations, hotspots, etc.
│   ├── organizations/     # Org and user management
│   ├── showrooms/         # Showroom configuration
│   ├── analytics/         # Analytics data retrieval
│   ├── webhooks/          # Event-driven integrations
│   └── embedding/         # 3D viewer embedding options
└── quick-reference/       # Auto-generated reference materials
    ├── endpoint-cheatsheet.md   # All endpoints at a glance
    └── error-codes.md           # Error codes and troubleshooting
```

## When to Use Each API

### Admin API (`vntana-admin-api-docs.yaml`)
- **Base URL:** `https://api-platform.vntana.com`
- **Auth:** `X-AUTH-TOKEN` header required
- **Use for:** Full CRUD operations, user management, analytics, webhooks
- **Endpoints:** 237 across 35 categories

### Public API (`vntana-public-api-docs.yaml`)
- **Base URL:** `https://api.vntana.com`
- **Auth:** Organization/client slugs in URL path (no token needed for public content)
- **Use for:** Read-only access, embedding, public showrooms, search
- **Endpoints:** 18 across 6 categories

## Quick Start

### 1. Authentication Flow
```bash
# Step 1: Login to get auth token
curl -X POST "https://api-platform.vntana.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response includes token - use in subsequent requests
# Step 2: Use token in X-AUTH-TOKEN header
curl -X GET "https://api-platform.vntana.com/v1/products" \
  -H "X-AUTH-TOKEN: your-token-here"
```

See [Authentication Guide](./guides/authentication/api-authentication.md) for details.

### 2. Common Operations

| Task | Guide | Key Endpoint |
|------|-------|--------------|
| Create a product | [Product Creation](./guides/products/product-creation.md) | `POST /v1/products` |
| Search products | [Searching Products](./guides/products/searching-products.md) | `POST /v1/products/search` |
| Download a model | [Download Model](./guides/products/download-model.md) | `GET /v1/products/{uuid}/download` |
| Add annotations | [Annotations](./guides/content/annotations.md) | `POST /v1/annotations` |
| Set up webhooks | [Webhooks](./guides/webhooks/webhooks.md) | `POST /v1/webhooks` |
| Embed 3D viewer | [3D WebViewer](./guides/embedding/3d-webviewer-html.md) | Public API |

## Finding Information

### Looking for an Endpoint?
1. **Quick scan:** Check [endpoint-cheatsheet.md](./quick-reference/endpoint-cheatsheet.md)
2. **Detailed specs:** Open the relevant Swagger YAML file
3. **Usage examples:** Check the corresponding guide in `guides/`

### Troubleshooting Errors?
1. Check [error-codes.md](./quick-reference/error-codes.md) for error meanings
2. Common issues:
   - `401 Unauthorized` → Token expired or invalid, re-authenticate
   - `403 Forbidden` → User lacks permission for this action
   - `404 Not Found` → Resource UUID doesn't exist or wrong organization
   - `422 Unprocessable Entity` → Validation failed, check required fields

### Building an Integration?
1. Start with [REST API Overview](./guides/getting-started/rest-api-overview.md)
2. Set up [Postman](./guides/getting-started/postman.md) for testing
3. Implement [Authentication](./guides/authentication/api-authentication.md)
4. Follow the specific guide for your use case

## Common Workflows

### Product Upload Workflow
```
1. Authenticate → POST /v1/auth/login
2. Get upload URL → POST /v1/files/signed-link
3. Upload file to signed URL
4. Create product → POST /v1/products
5. Check conversion status → GET /v1/products/{uuid}
6. (Optional) Add metadata, tags, annotations
```

### Embedding 3D Content
```
1. Get product UUID (via search or direct)
2. Choose embedding method:
   - iFrame: Simple, uses VNTANA viewer
   - Web Component: Customizable, requires more setup
   - QR Code: For AR experiences
3. Follow the respective guide in guides/embedding/
```

### Webhook Integration
```
1. Create webhook → POST /v1/webhooks
2. Configure events (product.created, conversion.completed, etc.)
3. Implement endpoint to receive payloads
4. Verify webhook signatures
```

## Guide Status

Guides marked as "Awaiting content extraction" need content from VNTANA help pages. When content is available:

1. Open the source URL in a browser
2. Copy the page content
3. Paste into the corresponding guide file
4. Format using the standard template

### Content Status

| Category | Files | Status |
|----------|-------|--------|
| Authentication | 3 | Awaiting extraction |
| Getting Started | 2 | Awaiting extraction |
| Products | 4 | Awaiting extraction |
| Content | 6 | Awaiting extraction |
| Organizations | 2 | Awaiting extraction |
| Showrooms | 1 | Awaiting extraction |
| Analytics | 1 | Awaiting extraction |
| Webhooks | 1 | Awaiting extraction |
| Embedding | 3 | Awaiting extraction |
| **Quick Reference** | 2 | **Complete** (auto-generated) |

## API-Specific Notes

### Product Statuses
- `DRAFT` - Initial state, not published
- `LIVE` - Published and visible
- `APPROVED` - Approved for publishing
- `PENDING_APPROVAL` - Awaiting approval
- `ARCHIVED` - Hidden but not deleted

### Conversion Statuses
- `PENDING` - Queued for conversion
- `CONVERTING` - Currently processing
- `COMPLETED` - Ready for use
- `FAILED` - Conversion error occurred

### Supported 3D Formats
- Input: GLB, GLTF, FBX, OBJ, STEP, JT, and more
- Output: GLB, USDZ (for AR), various optimized formats

## Cross-References

- **Main Repository:** [/CLAUDE.md](../CLAUDE.md)
- **Sales Materials:** [/sales/CLAUDE.md](../sales/CLAUDE.md) - API-related pitch points
- **Projects:** [/projects/CLAUDE.md](../projects/CLAUDE.md) - API integration projects

---

**Last Updated:** 2026-01-22
**Update Notes:** Initial creation of API documentation structure with:
- Directory structure for guides and references
- Swagger files organized in `/swagger`
- 23 placeholder guide files for web documentation extraction
- Auto-generated endpoint cheatsheet (237 Admin + 18 Public endpoints)
- Auto-generated error codes reference
