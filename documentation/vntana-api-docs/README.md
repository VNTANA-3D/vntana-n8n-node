# VNTANA API Documentation

Official API documentation for VNTANA's REST APIs. This repository contains OpenAPI/Swagger specifications, integration guides, and quick references for building applications with VNTANA's 3D content management platform.

## 📚 What's Inside

- **OpenAPI/Swagger Specs** - Machine-readable API specifications for both Admin and Public APIs
- **Integration Guides** - Step-by-step tutorials for common workflows
- **Quick References** - Endpoint cheatsheets and error code documentation
- **Code Examples** - Practical examples for authentication, product management, embedding, and more

## 🚀 Quick Start

### 1. Choose Your API

| API | Base URL | Authentication | Use Case |
|-----|----------|----------------|----------|
| **Admin API** | `https://api-platform.vntana.com` | `X-AUTH-TOKEN` header | Full CRUD operations, user management, analytics |
| **Public API** | `https://api.vntana.com` | Organization/client slugs | Read-only access, embedding, public content |

### 2. Authenticate

```bash
# Login to get auth token
curl -X POST "https://api-platform.vntana.com/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -X GET "https://api-platform.vntana.com/v1/products" \
  -H "X-AUTH-TOKEN: your-token-here"
```

See the [Authentication Guide](./guides/authentication/api-authentication.md) for details.

### 3. Explore the Docs

- **[Getting Started](./guides/getting-started/)** - API overview and Postman setup
- **[Products](./guides/products/)** - Create, search, and manage 3D products
- **[Embedding](./guides/embedding/)** - Embed 3D viewers in your applications
- **[Webhooks](./guides/webhooks/)** - Set up event-driven integrations
- **[Quick Reference](./quick-reference/)** - Endpoint cheatsheet and error codes

## 📖 Documentation Structure

```
├── swagger/                          # OpenAPI specifications
│   ├── vntana-admin-api-docs.yaml   # Admin API (237 endpoints)
│   └── vntana-public-api-docs.yaml  # Public API (18 endpoints)
├── guides/                           # Integration guides
│   ├── authentication/               # Auth flows and token management
│   ├── products/                     # Product CRUD operations
│   ├── content/                      # Tags, annotations, hotspots
│   ├── embedding/                    # 3D viewer integration
│   ├── webhooks/                     # Event notifications
│   └── ...                          # Analytics, organizations, showrooms
└── quick-reference/                  # Quick lookups
    ├── endpoint-cheatsheet.md       # All endpoints at a glance
    └── error-codes.md               # HTTP status codes and errors
```

## 🔑 Key Features

### Admin API (237 endpoints across 35 categories)
- **Products** - Upload, convert, and manage 3D models
- **Content** - Add annotations, hotspots, tags, and comments
- **Organizations** - Manage users, clients, and permissions
- **Analytics** - Track views, downloads, and engagement
- **Webhooks** - Subscribe to real-time events

### Public API (18 endpoints across 6 categories)
- **Search** - Query products and showrooms
- **Embed** - Retrieve content for embedding
- **AR/QR** - Generate QR codes for AR experiences
- **Public Access** - Access published content without authentication

## 💡 Common Use Cases

### Upload and Convert 3D Models
```
1. Authenticate → POST /v1/auth/login
2. Get upload URL → POST /v1/files/signed-link
3. Upload file to signed URL
4. Create product → POST /v1/products
5. Check conversion status → GET /v1/products/{uuid}
```
[Full Guide](./guides/products/product-creation.md)

### Embed 3D Content
```
1. Get product UUID
2. Choose embedding method (iFrame, Web Component, QR Code)
3. Add to your application
```
[Embedding Guides](./guides/embedding/)

### Set Up Webhooks
```
1. Create webhook → POST /v1/webhooks
2. Configure events (product.created, conversion.completed, etc.)
3. Implement endpoint to receive payloads
```
[Webhook Guide](./guides/webhooks/webhooks.md)

## 🛠️ API Specifications

Both APIs are documented using OpenAPI 3.0 specification:

- **[Admin API Spec](./swagger/vntana-admin-api-docs.yaml)** - Full specification with all 237 endpoints
- **[Public API Spec](./swagger/vntana-public-api-docs.yaml)** - Public-facing endpoints

You can import these specs into:
- [Postman](https://www.postman.com/) - API testing and development
- [Swagger Editor](https://editor.swagger.io/) - Visual documentation
- [OpenAPI Generator](https://openapi-generator.tech/) - Generate client SDKs

## 🔍 Finding What You Need

| I want to... | Go to... |
|--------------|----------|
| See all available endpoints | [Endpoint Cheatsheet](./quick-reference/endpoint-cheatsheet.md) |
| Understand error codes | [Error Codes Reference](./quick-reference/error-codes.md) |
| Get started quickly | [REST API Overview](./guides/getting-started/rest-api-overview.md) |
| Set up authentication | [Authentication Guide](./guides/authentication/api-authentication.md) |
| Upload 3D models | [Product Creation](./guides/products/product-creation.md) |
| Search for products | [Searching Products](./guides/products/searching-products.md) |
| Add metadata to products | [Tags](./guides/content/tags.md), [Annotations](./guides/content/annotations.md) |
| Embed 3D viewers | [3D WebViewer](./guides/embedding/3d-webviewer-html.md) |
| Integrate with webhooks | [Webhooks Guide](./guides/webhooks/webhooks.md) |

## 🐛 Troubleshooting

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Token expired or invalid | Re-authenticate using `/v1/auth/login` |
| `403 Forbidden` | User lacks permission | Check user roles and organization access |
| `404 Not Found` | Resource doesn't exist | Verify UUID and organization context |
| `422 Unprocessable Entity` | Validation failed | Check required fields in request body |

See [Error Codes Reference](./quick-reference/error-codes.md) for complete list.

## 📦 Supported 3D Formats

### Input Formats
GLB, GLTF, FBX, OBJ, STEP, JT, STL, 3DS, COLLADA, and more

### Output Formats
- **GLB** - Web-optimized 3D models
- **USDZ** - Apple AR Quick Look
- **Optimized variants** - Multiple LODs and quality levels

## 🔗 Additional Resources

- **[VNTANA Platform](https://vntana.com)** - Main website
- **[Help Center](https://help.vntana.com)** - User documentation
- **[API Base URLs]** - Admin: `https://api-platform.vntana.com` | Public: `https://api.vntana.com`

## 📄 License

Documentation is provided for VNTANA platform users and developers.

---

**Questions?** Contact us at [support@vntana.com](mailto:support@vntana.com) or open an issue in this repository.

**Last Updated:** 2026-01-22
