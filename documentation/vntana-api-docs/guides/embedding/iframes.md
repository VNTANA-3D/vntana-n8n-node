# VNTANA iFrames

> **Status:** Complete
> **Source URL:** https://help.vntana.com/vntana-iframes

## Overview

The VNTANA 3D Viewer can be integrated into your website by utilizing an iFrame or shared with others by simply utilizing an Asset or Variant Group's embed link. This guide covers both the Platform UI method and the API method for retrieving the necessary identifiers (organization slugs, workspace slugs, and asset UUIDs) and constructing the embed link for displaying VNTANA 3D models.

## Prerequisites

Before embedding VNTANA content via iFrames, ensure:

1. **Authentication:** You have a valid auth token from the login endpoint (for API method)
2. **Published Assets:** The asset must be published as "Live Public" on the VNTANA Platform
3. **Organization Access:** You have access to the organization containing the content

## Obtaining the Embed Code

### Method 1: Platform UI (Quickest)

1. Login to your account on the VNTANA Platform
2. Navigate to the correct Workspace
3. Click on **Asset Library** in the left-hand navigation menu
4. Select the Asset you want to view
5. In the **Share** tab from the Asset View Page, click on the **Copy** button to copy the entire Embed Code

The iFrame is now copied to your clipboard and can be used anywhere on your site.

### Method 2: API (Programmatic)

Use this method when building automated integrations or generating embed codes programmatically.

#### Step 1: Get Organizations

Retrieve the list of organizations you have access to, including their slugs needed for embed URLs.

**Request:**
```
Method: GET
Endpoint: /v1/organizations
Headers: { 'x-auth-token' : 'Bearer ' + x_auth_token}
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "string",
        "slug": "some-org-slug",
        "name": "Some Org",
        "role": "ORGANIZATION_ADMIN",
        "imageBlobId": "string",
        "created": "2020-01-31T19:17:23.972"
      }
    ]
  }
}
```

**Key fields:**
- `slug` - The organization slug needed for constructing embed URLs
- `uuid` - The organization's unique identifier
- `role` - Your permission level in this organization

#### Step 2: Get Workspaces

Retrieve workspaces (client organizations) within an organization.

**Request:**
```
Method: GET
Endpoint: /v1/clients/client-organizations
Headers: { 'x-auth-token' : 'Bearer ' + refreshToken}
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "totalCount": 1,
    "grid": [
      {
        "uuid": "string",
        "slug": "some-client-slug",
        "name": "Some Client",
        "role": "ORGANIZATION_ADMIN",
        "imageBlobId": "string",
        "created": "2020-01-31T19:17:23.972"
      }
    ]
  }
}
```

**Key fields:**
- `slug` - The workspace/client slug needed for embed URLs
- `uuid` - The workspace's unique identifier

#### Step 3: Get the Asset UUID

The Asset UUID can be obtained through two methods:

**Option A: Search via API**
Search for the asset using the products search endpoint:
```
POST /v1/products/search
```
See [Searching Products](../products/searching-products.md) for details.

**Option B: Webhook Notifications**
Set up a webhook that notifies you when an asset has completed converting. This method works great for automatically generating the iframe or embed link once an asset has finished processing.

See [Webhooks Guide](../webhooks/webhooks.md) for webhook setup.

**Option C: Platform UI**
The Asset UUID (labeled "Asset UUID") can be found on the Asset's Details tab in the VNTANA Platform.

## Publishing Assets (Required)

**Important:** The iframe/embed link will not be able to load the model if it is not first published on the VNTANA Platform.

To leverage the Admin API to generate and use the iFrame or embed link, your Asset must be in **Live Public** status:
- **If in Draft:** Won't be accessible via search endpoints
- **If in Live Internal:** Won't be shareable externally

### Publishing a Single Asset
1. Go to the asset's page in the VNTANA Platform
2. Click the **Change State** button in the top right corner
3. Select **Live Public**

### Publishing Multiple Assets at Once
1. From the Asset Library list view, check the assets you wish to publish
2. Select the **Change State** button in the top right
3. Select **Live Public**

## Constructing the Embed Link

To create the embed link you need:
- **Asset UUID** - From the Details tab or API
- **Workspace Slug (clientSlug)** - From Platform or API
- **Organization Slug** - From Platform or API

These can be obtained via the Admin API or stored locally at the time of creating an Asset.

**URL Format:**
```
https://embed.vntana.com/{org-slug}/{workspace-slug}/{asset-uuid}
```

**Example:**
```
https://embed.vntana.com/some-org-slug/some-client-slug/abc12345-6789-def0-1234-567890abcdef
```

## Embedding the iFrame

Set the constructed URL as the `src` property of an iframe element:

```html
<iframe
  class="lazyload"
  title="Description of my 3D Model"
  src="https://embed.vntana.com/some-org-slug/some-client-slug/abc12345-6789-def0-1234-567890abcdef"
  width="800"
  height="600"
  frameBorder="0"
  allow="fullscreen; xr-spatial-tracking"
  allowfullscreen>
</iframe>
```

### Customizable Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `width` | Set viewer width | `"800"` or `"100%"` |
| `height` | Set viewer height | `"600"` or `"500px"` |
| `frameBorder` | Remove default border | `"0"` |
| `allow` | Enable fullscreen and AR | `"fullscreen; xr-spatial-tracking"` |
| `class` | CSS class for additional styling | `"lazyload"` |
| `title` | Description for accessibility | `"3D Product Viewer"` |
| `src` | Embed link with specific product | Embed URL |

## Accessibility - Screen Reader Support

Add a `title` attribute to the iFrame for screen reader support:

```html
<iframe
  class="lazyload"
  title="Description of my 3D Model"
  frameBorder="0"
  src="https://embed.vntana.com/org/client/asset-uuid"
  width="400"
  height="250"
  allow="fullscreen">
</iframe>
```

The `title` attribute provides context for users who rely on assistive technologies.

## Embed Options / Styling Recommendations

### Size and Layout
- The `width` and `height` of the `<iframe>` can be changed to better fit your site
- Use percentage values for responsive layouts (e.g., `width="100%"`)

### Background
- Use the **transparent background** option to place the viewer over your own custom background design or color

### Viewer Buttons
- **(Legacy)** Buttons within the viewer can be hidden by selecting options in the Embed Options section
- These options are automatically used within v2 embed URLs, while old URLs rely on query params

### Analytics Domain
- A domain can be added to an iFrame to allow for domain-specific filtering of Analytics
- Only one domain can be added per Embed Code
- A single Asset can have its viewer embedded on multiple sites with different domains

## Swapping Assets

The asset can easily be swapped out for another asset by changing the `productUuid` value in the `src` URL. The productUuid can be found on the Asset's Details tab labeled "Asset UUID".

**Example - Swapping from Asset A to Asset B:**
```html
<!-- Asset A -->
<iframe src="https://embed.vntana.com/org/client/asset-uuid-A" ...></iframe>

<!-- Asset B (just change the UUID) -->
<iframe src="https://embed.vntana.com/org/client/asset-uuid-B" ...></iframe>
```

Note: The Client Slug and Organization Slug are static values for all Assets under the same Workspace and Organization.

## Complete Workflow Example

```javascript
// 1. Authenticate
const authResponse = await fetch('https://api-platform.vntana.com/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});
const { response: { token } } = await authResponse.json();

// 2. Get organizations
const orgsResponse = await fetch('https://api-platform.vntana.com/v1/organizations', {
  headers: { 'x-auth-token': `Bearer ${token}` }
});
const { response: { grid: orgs } } = await orgsResponse.json();
const orgSlug = orgs[0].slug;

// 3. Get workspaces
const clientsResponse = await fetch('https://api-platform.vntana.com/v1/clients/client-organizations', {
  headers: { 'x-auth-token': `Bearer ${token}` }
});
const { response: { grid: clients } } = await clientsResponse.json();
const clientSlug = clients[0].slug;

// 4. Get asset UUID (via search or webhook)
const assetUuid = 'your-asset-uuid-here';

// 5. Construct embed URL
const embedUrl = `https://embed.vntana.com/${orgSlug}/${clientSlug}/${assetUuid}`;

// 6. Create iframe element with accessibility support
const iframe = document.createElement('iframe');
iframe.src = embedUrl;
iframe.width = '800';
iframe.height = '600';
iframe.frameBorder = '0';
iframe.allow = 'fullscreen xr-spatial-tracking';
iframe.allowFullscreen = true;
iframe.title = 'Interactive 3D Product Viewer';
iframe.className = 'lazyload';

document.body.appendChild(iframe);
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| iFrame shows blank/error | Asset not published | Publish asset as "Live Public" |
| Asset not accessible via search | Asset in Draft status | Change state to Live Public |
| Asset not shareable externally | Asset in Live Internal status | Change state to Live Public |
| 404 error on embed URL | Wrong slug or UUID | Verify org slug, client slug, and asset UUID |
| Model doesn't load | Asset still converting | Wait for conversion to complete, or set up webhook notification |
| CORS errors | Cross-origin restrictions | Ensure embedding domain is allowed in VNTANA settings |
| Screen reader doesn't announce | Missing title attribute | Add `title="Description"` to iframe |

## Related

- [3D WebViewer HTML Component](./3d-webviewer-html.md)
- [Custom QR Codes](./custom-qr-codes.md)
- [Webhooks Guide](../webhooks/webhooks.md)
- [Searching Products](../products/searching-products.md)
- [Swagger Reference: Public API](/api-documentation/swagger/vntana-public-api-docs.yaml)
