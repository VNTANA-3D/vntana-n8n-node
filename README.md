# n8n-nodes-vntana

This is an n8n community node for [VNTANA](https://www.vntana.com/), a product content platform that automates and scales 3D content. It enables n8n workflows to interact with VNTANA's Admin API for automating workflows with 3D products, renders, and attachments.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install n8n-nodes-vntana
```

### Manual Installation

1. Clone or download this repository
2. Run `npm install` and `npm run build`
3. Link the package: `npm link`
4. In your n8n custom nodes directory (`~/.n8n/custom`):
   ```bash
   npm init -y  # if not already initialized
   npm link n8n-nodes-vntana
   ```
5. Restart n8n

## Credentials

To use this node, you need to configure VNTANA API credentials:

| Field | Required | Description |
|-------|----------|-------------|
| **Email** | Yes | Email address for your VNTANA account |
| **Password** | Yes | Password for your VNTANA account |
| **Organization Slug** | Yes | The slug from your platform URL (e.g. `acme-corp` in `app.vntana.com/acme-corp/...`) |
| **Default Workspace UUID** | No | Default workspace to use when not specified in an operation |
| **API Base URL** | No | Override the default API host (for staging/test environments) |

### Obtaining Credentials

Enter your email, password, and your organization's slug. The node handles the rest:

1. Logs in with email/password to get an initial auth token.
2. Resolves your Organization UUID by matching the slug against the orgs returned by `GET /v1/organizations`.
3. Refreshes the token with that UUID to get an org-specific token.
4. Uses that org-specific token on every subsequent request, refreshing automatically when it expires.

For detailed authentication steps, see [VNTANA API Authentication](https://help.vntana.com/api-authentication).

## Operations

### Product

| Operation | Description |
|-----------|-------------|
| **Search** | Search for products in a workspace with filters |
| **Download Model** | Download a 3D model file (GLB, USDZ, FBX, OBJ, STEP) |

#### Search Filters
- Search term (text search)
- Status (Draft, Live Public, Live Internal, Approved, Rejected, Waiting Review)
- Conversion status (Pending, Converting, Completed, Failed, No Asset)
- Name (exact match)
- Tag UUIDs

### Render

| Operation | Description |
|-----------|-------------|
| **Download** | Download renders (still images or turntable videos) for a product |
| **Upload** | Upload a render image/video to a product |

### Attachment

| Operation | Description |
|-----------|-------------|
| **Upload** | Upload an attachment file to a product |

## Usage Examples

### Search Products

1. Add the VNTANA node to your workflow
2. Select **Product** resource and **Search** operation
3. Enter your Workspace UUID
4. Optionally add filters (search term, status, etc.)
5. Execute to retrieve matching products

### Download a 3D Model

1. Add the VNTANA node to your workflow
2. Select **Product** resource and **Download Model** operation
3. Enter the Product UUID and Workspace UUID
4. Select the format (GLB, USDZ, FBX, OBJ, or STEP)
5. Execute to download the model as binary data

### Upload a Render

1. Add a node that provides binary data (e.g., HTTP Request, Read Binary File)
2. Add the VNTANA node
3. Select **Render** resource and **Upload** operation
4. Enter the Product UUID and Workspace UUID
5. Specify the binary property name containing your file
6. Execute to upload the render to VNTANA

## Compatibility

- **n8n version**: 1.0.0+
- **Node.js version**: 18.x+

## Resources

- [VNTANA Documentation](https://help.vntana.com/)
- [VNTANA API Reference](https://help.vntana.com/api-documentation)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## Development

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Watch mode for development
npm run dev

# Lint the code
npm run lint

# Fix lint issues
npm run lintfix
```

## License

[MIT](LICENSE)
