# Integrations: n8n Workflow Automation

The VNTANA n8n community node enables workflow automation for your 3D content management. Connect VNTANA to 1000+ other applications via n8n to automate uploads, downloads, status updates, and more.

## What You Can Do

| Resource | Operations |
|----------|------------|
| Product | Search, Download Model, Upload 3D Model, Upload Asset, Update Status |
| Render | Download, Upload |
| Attachment | Upload |
| Organization | List |
| Workspace | List |
| Pipeline | List |

---

## Installation

### n8n Cloud

1. Go to **Settings** > **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-vntana`
4. Click **Install**

### Self-Hosted n8n

```bash
npm install n8n-nodes-vntana
```

Then restart your n8n instance.

### Requirements

- n8n version 1.0.0 or higher
- Node.js 18.x or higher (for self-hosted)

---

## Authentication

VNTANA uses a two-step authentication flow. The node handles this automatically using your email, password, and organization UUID.

### Setting Up Credentials

1. In n8n, go to **Credentials** > **New Credential**
2. Search for **VNTANA API**
3. Fill in the required fields:

| Field | Required | Description |
|-------|----------|-------------|
| Email | Yes | Your VNTANA account email address |
| Password | Yes | Your VNTANA account password |
| Organization UUID | Yes | Found in Platform Settings (see below) |
| Default Workspace UUID | No | Workspace to use when not specified in operations |
| API Base URL | No | Custom API URL (defaults to api-platform.vntana.com) |

### Finding Your Organization UUID

1. Log into the [VNTANA Platform](https://platform.vntana.com)
2. Go to **Settings** > **Organization**
3. Copy the **Organization UUID**

### Finding Workspace UUIDs

You can find workspace UUIDs in two ways:

**Option 1: VNTANA Platform**
1. Go to **Settings** > **Workspaces**
2. Select a workspace
3. Copy the UUID from the workspace settings

**Option 2: Using the Node**
1. Use the **Organization** > **List** operation to verify your organization
2. Use the **Workspace** > **List** operation to get all workspace UUIDs

---

## Operations Reference

### Product Operations

#### Search

Find products in a workspace with optional filters.

| Field | Required | Description |
|-------|----------|-------------|
| Workspace UUID | Yes | Target workspace (leave empty to use default from credentials) |
| Return All | No | Return all results or limit to a specific number |
| Limit | No | Maximum number of results (1-100, default: 10) |

**Available Filters:**

| Filter | Description |
|--------|-------------|
| Search Term | Text to search in product names and descriptions |
| Status | Filter by product status (Draft, Live Public, etc.) |
| Conversion Status | Filter by processing status (Completed, Converting, etc.) |
| Name | Filter by exact product name |
| Tag UUIDs | Comma-separated tag UUIDs |

**Example Use Case:** Find all products with "Live Public" status that have completed optimization.

---

#### Download Model

Download a 3D model file in various formats.

| Field | Required | Description |
|-------|----------|-------------|
| Product UUID | Yes | UUID of the product to download |
| Workspace UUID | Yes | Target workspace |
| Format | Yes | Output format (see table below) |
| Binary Property | No | Name for output binary data (default: `data`) |

**Supported Download Formats:**

| Format | Description |
|--------|-------------|
| GLB | Binary glTF - recommended for web |
| USDZ | Apple AR format - for iOS AR Quick Look |
| FBX | Autodesk format - for 3D software |
| OBJ | Wavefront OBJ - universal interchange |
| STEP | CAD format - for engineering |

**Output:** Binary data that can be connected to file nodes or other processors.

---

#### Upload 3D Model

Upload and optimize a 3D model file. Creates a new product with the uploaded model.

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Name for the new product |
| Pipeline UUID | Yes | Optimization pipeline to use (use Pipeline > List to get available pipelines) |
| Workspace UUID | Yes | Target workspace |
| Binary Property | Yes | Name of the input binary data (default: `data`) |
| Optimization Mode | Yes | "Preset" (recommended) or "Advanced" |

**Optimization Presets:**

| Preset | Polygons | Max Texture | Draco | Best For |
|--------|----------|-------------|-------|----------|
| Web Optimized | 50,000 | 2048px | Yes | Web 3D viewers, configurators |
| High Quality | 100,000 | 4096px | No | High-fidelity visualization |
| Mobile | 25,000 | 1024px | Yes | Mobile devices, AR |
| Preserve Original | - | - | No | Format conversion only |

**Advanced Settings** (when Optimization Mode = Advanced):

| Setting | Default | Description |
|---------|---------|-------------|
| Enable Draco Compression | Yes | Compress mesh for smaller file size |
| Target Polygon Count | 50,000 | Target polygon count (1,000 - 1,000,000) |
| Force Polygon Count | No | Force exact count (may reduce quality) |
| Remove Obstructed Geometry | Yes | Remove hidden internal geometry |
| Bake Small Features | Yes | Convert small details to normal maps |
| Pivot Point | Bottom Center | Model origin position |
| Max Texture Resolution | 2048 | Maximum texture size (512-4096) |
| Texture Compression | 3 | Compression level (1=minimal, 10=maximum) |
| Lossless Texture Compression | Yes | Preserve texture quality |
| Use KTX2 Format | No | GPU-optimized textures |
| Bake Ambient Occlusion | Yes | Add soft shadows |
| AO Strength | 1 | Shadow intensity (0-2) |
| AO Radius | 5 | Shadow spread (1-20) |
| AO Resolution | 1024 | AO texture size |

**Additional Options:**

| Option | Description |
|--------|-------------|
| Description | Product description text |
| Status | Initial status (Draft, Live Internal, Live Public) |
| Tag UUIDs | Comma-separated tag UUIDs to apply |
| Project UUIDs | Comma-separated project UUIDs to link |

---

#### Upload Asset

Upload non-3D files (images, videos, documents, audio) as products.

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Name for the new product |
| Asset Type | Yes | Type of file being uploaded |
| Workspace UUID | Yes | Target workspace |
| Binary Property | Yes | Name of the input binary data |

**Asset Types:**

| Type | Supported Formats |
|------|-------------------|
| Image | JPG, PNG, GIF, WebP, SVG, TIFF, BMP |
| Video | MP4, MOV, WebM, AVI, MKV |
| Document | PDF, DOCX, XLSX, CSV, TXT |
| Audio | MP3, WAV, AAC, FLAC, OGG |

**Additional Options:** Same as Upload 3D Model (Description, Status, Tags, Projects).

---

#### Update Status

Change the status of one or more products. Supports batch updates.

| Field | Required | Description |
|-------|----------|-------------|
| Product UUID(s) | Yes | Single UUID or comma-separated list for batch |
| Status | Yes | Target status |
| Workspace UUID | Yes | Target workspace |

**Status Values:**

| Status | Description |
|--------|-------------|
| Draft | Product is in progress, not visible externally |
| Live Internal | Visible to organization members only |
| Live Public | Publicly visible via embed codes and links |

**Example:** Update multiple products to Live Public:
```
Product UUIDs: abc-123, def-456, ghi-789
Status: Live Public
```

---

### Render Operations

#### Download

Download render images or turntable videos from a product.

| Field | Required | Description |
|-------|----------|-------------|
| Product UUID | Yes | Source product |
| Workspace UUID | Yes | Target workspace |
| Entity Type | Yes | "Render (Still Image)" or "Turntable (Video)" |
| Download All | No | Download all renders or just the first one |
| Binary Property | No | Output property name (default: `data`) |

When **Download All** is enabled, multiple binary outputs are created: `data_0`, `data_1`, etc.

---

#### Upload

Upload a render image or video to an existing product.

| Field | Required | Description |
|-------|----------|-------------|
| Product UUID | Yes | Target product |
| Workspace UUID | Yes | Target workspace |
| Binary Property | Yes | Name of input binary data |

**Options:**

| Option | Description |
|--------|-------------|
| File Name | Override the original file name |
| Content Type | Override the MIME type |

---

### Attachment Operations

#### Upload

Upload any file as an attachment to a product. Useful for supplementary files like documentation, source files, or reference materials.

| Field | Required | Description |
|-------|----------|-------------|
| Product UUID | Yes | Target product |
| Workspace UUID | Yes | Target workspace |
| Binary Property | Yes | Name of input binary data |

**Options:** Same as Render Upload (File Name, Content Type).

---

### Organization, Workspace, and Pipeline Operations

These operations help you discover UUIDs needed for other operations.

#### Organization: List

Returns all organizations you have access to. Each organization includes:
- UUID
- Name
- Slug

#### Workspace: List

Returns all workspaces in your organization. Each workspace includes:
- UUID
- Name
- Slug

#### Pipeline: List

Returns all available optimization pipelines. Each pipeline includes:
- UUID
- Name
- Description

Use Pipeline List to find the correct Pipeline UUID for Upload 3D Model operations.

---

## Common Workflows

### Workflow 1: Bulk Download 3D Models

Automatically download all GLB files from a workspace.

```
[VNTANA Search] → [Loop Over Items] → [VNTANA Download Model] → [Write Binary File]
```

1. **VNTANA (Search):** Get products with status "COMPLETED"
2. **Loop Over Items:** Process each product
3. **VNTANA (Download Model):** Download as GLB format
4. **Write Binary File:** Save to local directory

### Workflow 2: Upload and Optimize 3D Models

Automatically process new 3D files from a folder.

```
[Watch Folder] → [Read Binary File] → [VNTANA Upload 3D Model] → [Slack Notification]
```

1. **Watch Folder Trigger:** Monitor for new .glb/.fbx files
2. **Read Binary File:** Load the file data
3. **VNTANA (Upload 3D Model):** Upload with "Web Optimized" preset
4. **Slack/Email:** Notify team when complete

### Workflow 3: Sync Product Status from External System

Update VNTANA product status based on external approvals.

```
[Schedule Trigger] → [HTTP Request: Get Approvals] → [VNTANA Update Status]
```

1. **Schedule Trigger:** Run daily at 9 AM
2. **HTTP Request:** Fetch approved product IDs from your system
3. **VNTANA (Update Status):** Set approved products to "Live Public"

### Workflow 4: Export Renders for Marketing

Download all product renders for use in marketing materials.

```
[VNTANA Search] → [Loop Over Items] → [VNTANA Render Download] → [Google Drive Upload]
```

1. **VNTANA (Search):** Find products with "Live Public" status
2. **Loop:** Process each product
3. **VNTANA (Render Download):** Download all renders
4. **Google Drive:** Upload to shared marketing folder

---

## Reference Tables

### Product Status Values

| Value | Display Name | Description |
|-------|--------------|-------------|
| DRAFT | Draft | Work in progress, not visible |
| LIVE_INTERNAL | Live Internal | Visible to organization only |
| LIVE_PUBLIC | Live Public | Publicly accessible |
| APPROVED | Approved | Approved in review workflow |
| REJECTED | Rejected | Rejected in review workflow |
| WAITING_REVIEW | Waiting Review | Pending approval |

### Conversion Status Values

| Value | Display Name | Description |
|-------|--------------|-------------|
| PENDING | Pending | Upload received, processing queued |
| CONVERTING | Converting | Optimization in progress |
| COMPLETED | Completed | Ready for use |
| FAILED | Failed | Processing error occurred |
| NO_ASSET | No Asset | Product has no uploaded file |

### Supported 3D Input Formats

VNTANA accepts these 3D formats for upload:

| Format | Extension | Notes |
|--------|-----------|-------|
| glTF Binary | .glb | Recommended |
| glTF | .gltf | With separate bin/texture files |
| FBX | .fbx | Autodesk format |
| OBJ | .obj | Wavefront (with .mtl) |
| USD/USDZ | .usd, .usda, .usdc, .usdz | Pixar Universal Scene Description |
| STEP | .stp, .step | CAD format |
| STL | .stl | 3D printing format |
| PLY | .ply | Point cloud format |
| 3DS | .3ds | Legacy Autodesk format |

---

## Troubleshooting

### Authentication Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | Wrong email or password | Verify login works at platform.vntana.com |
| "Organization not found" | Invalid Organization UUID | Use Organization > List to verify UUID |
| "Authentication failed" | Token expired or invalid | Re-enter credentials in n8n |

### Workspace Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Workspace required" | Missing Workspace UUID | Provide UUID or set default in credentials |
| "Access denied" | No access to workspace | Check workspace permissions in VNTANA |

### Upload Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Upload fails | File too large | Check file is under 30GB |
| "Invalid format" | Unsupported file type | See supported formats table |
| "Pipeline not found" | Invalid Pipeline UUID | Use Pipeline > List to get valid UUID |

### Download Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Product not found" | Invalid Product UUID | Verify UUID with Search operation |
| "Format not available" | Model not converted to that format | Wait for conversion to complete |
| Empty download | No file attached | Check product has an uploaded asset |

### Common Error Messages

| Error | Meaning |
|-------|---------|
| `success: false` | API request failed - check `errors` array for details |
| "Rate limited" | Too many requests - add delays between operations |
| "Network error" | Connection issue - check internet/firewall |

---

## Resources

- [VNTANA Platform](https://platform.vntana.com) - Log in to your account
- [VNTANA Help Center](https://help.vntana.com) - Full documentation
- [VNTANA API Documentation](https://help.vntana.com/api-documentation) - API reference
- [n8n Community](https://community.n8n.io) - n8n support and discussions
- [GitHub Repository](https://github.com/VNTANA-3D/vntana-n8n-node) - Source code and issue tracking

---

## Version History

| Version | Changes |
|---------|---------|
| 0.2.x | Added Update Status operation, render/attachment support |
| 0.1.x | Initial release with Search, Download, Upload operations |
