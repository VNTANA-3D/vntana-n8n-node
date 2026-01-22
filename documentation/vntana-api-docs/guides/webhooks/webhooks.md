# Webhooks

> **Source URL:** https://help.vntana.com/webhooks

## Overview

With the Webhooks feature on the VNTANA Platform, you can subscribe to a number of events for automatic notification when these events fire. This allows for greater control over VNTANA Platform integration while reducing the need for repetitious API calls.

For example, by creating a Webhook linked to a particular Workspace, your services can be automatically notified when a new Asset has been created as well as when a 3D Asset has finished conversion, allowing you to handle the Asset's information without the need to continuously poll via API calls.

**API Base URL:** `https://api-platform.vntana.com`

**Note:** "Client" refers to workspaces on the Platform within an Organization. The Client nomenclature is a legacy reference being replaced with Workspace.

## Authentication

Requires `X-AUTH-TOKEN` header for webhook management. See [API Authentication](../authentication/api-authentication.md).

## Creating a Webhook (Platform UI)

1. Sign in to your VNTANA Platform account
2. Click 'Settings' at the bottom of the left navigation pane
3. Select 'Webhooks' from the Organization settings categories
4. Press '+ Add Webhook' button

**Webhook Form Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | The desired name of the Webhook (does not need to be unique) |
| URL | Yes | The full URL of the endpoint the Webhook will POST to |
| Description | No | A simple description of the Webhook |
| Select Workspaces | No | Set Workspaces the Webhook applies to. If none selected, applies to entire Organization |
| Events | Yes | Select all events the Webhook should monitor |

When created, a UUID and Secret Key are generated. The Secret Key verifies the signature from the Webhook.

## Webhook Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/webhooks/events | List all available events |
| POST | /v1/webhooks | Create webhook |
| GET | /v1/webhooks/{uuid} | Get webhook by UUID |
| GET | /v1/webhooks/organizations/{orgUuid} | Get all webhooks for organization |
| PUT | /v1/webhooks/{uuid} | Update webhook |
| DELETE | /v1/webhooks/{uuid} | Delete webhook |
| PATCH | /v1/webhooks/{uuid}/secret | Regenerate secret key |

## Available Events

### Product (Asset) Events

**Optimization Status Events:**

| Event | Description |
|-------|-------------|
| `asset.added` | Asset created |
| `asset.pending` | Asset queued for conversion |
| `asset.processing` | Asset currently converting |
| `asset.completed` | Asset conversion completed |
| `asset.terminated` | Asset conversion terminated |
| `asset.failed` | Asset conversion failed |

**Note:** For non-3D Assets, only `added` and `completed` are likely to trigger.

**Publish Status Events:**

| Event | Description |
|-------|-------------|
| `asset.published` | Asset published (LIVE_PUBLIC) |
| `asset.published_internal` | Asset published internally (LIVE_INTERNAL) |
| `asset.deactivated` | Asset moved to Draft state |

**Review Process Events:**

| Event | Description |
|-------|-------------|
| `asset.pending_approval` | Asset pending approval |
| `asset.rejected` | Asset rejected |
| `asset.approved` | Asset approved |

**Client Role Review Events:**

| Event | Description |
|-------|-------------|
| `asset.client.approved` | Client approved |
| `asset.client.rejected` | Client rejected |
| `asset.client.dropped` | Client dropped |
| `asset.client.hold` | Client on hold |
| `asset.client.review` | Client in review |

**Miscellaneous Events:**

| Event | Description |
|-------|-------------|
| `asset.deleted` | Asset deleted |
| `asset.cloned` | Asset cloned |
| `asset.moved` | Asset moved |
| `asset.attributes.updated` | Asset attributes updated |
| `asset.viewer_settings.updated` | Viewer settings updated |

### Project Events

| Event | Description |
|-------|-------------|
| `project.added` | Project created |
| `project.updated` | Project updated |
| `project.deleted` | Project deleted |
| `project.published` | Project published |
| `project.published_internal` | Project published internally |

### Workspace Events

| Event | Description |
|-------|-------------|
| `workspace.added` | New Workspace created in Organization |

### User Events

| Event | Description |
|-------|-------------|
| `user.added` | User added to Organization |
| `user.revoked` | User removed from Organization |

### Showroom Events

| Event | Description |
|-------|-------------|
| `showroom.order.placed` | Order placed on Share link |
| `showroom.product.added` | Product added to Showroom |
| `showroom.product.removed` | Product removed from Showroom |
| `showroom.user.added` | User added to Showroom |
| `showroom.order.item.added` | Item added to order |

### Viewer Preset Events

| Event | Description |
|-------|-------------|
| `viewer_preset.added` | Viewer preset created |
| `viewer_preset.updated` | Viewer preset updated |
| `viewer_preset.deleted` | Viewer preset deleted |

### Render Events

| Event | Description |
|-------|-------------|
| `renders.pending` | Render queued |
| `renders.processing` | Render in progress |
| `renders.completed` | Render completed |
| `renders.failed` | Render failed |
| `turntable.pending` | Turntable queued |
| `turntable.processing` | Turntable in progress |
| `turntable.completed` | Turntable completed |
| `turntable.failed` | Turntable failed |

## Signature Verification

The Webhook passes two headers and data in the request body:

- `X-VNTANA-SIGNATURE`: HMAC-256 hashed signature
- `X-TIMESTAMP`: UTC time in ISO8601 format
- Request Body: Event payload

**Signature Formula:**
```
X-VNTANA-SIGNATURE = HMAC_SHA256(X-TIMESTAMP + "#" + payload)
```

To verify a webhook request, concatenate the timestamp, a "#" separator, and the raw request body, then compute the HMAC-SHA256 hash using your webhook's secret key. Compare this computed hash to the `X-VNTANA-SIGNATURE` header value.

## Code Examples

### Create Webhook (API)

```bash
curl -X POST "https://api-platform.vntana.com/v1/webhooks" \
  -H "X-AUTH-TOKEN: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Asset Events",
    "url": "https://your-endpoint.com/webhook",
    "description": "Monitor asset conversion",
    "organizationUuid": "org-uuid",
    "userEmail": "user@example.com",
    "disable": false,
    "clients": ["workspace-slug"],
    "events": [
      {
        "name": "product.added",
        "description": "Occurs when a new product is created.",
        "uuid": "1a426e7d-5e41-480c-b00f-9f46ca12e5ca"
      },
      {
        "name": "product.completed",
        "description": "Occurs when a product completes conversion.",
        "uuid": "d2c84a34-5abc-4d3e-bcaf-45b5a740463d"
      }
    ]
  }'
```

### Get Available Events

```bash
curl -X GET "https://api-platform.vntana.com/v1/webhooks/events" \
  -H "X-AUTH-TOKEN: $TOKEN"
```

### Endpoint Implementation (Python/Flask)

```python
from flask import Flask, request
import hmac, hashlib

app = Flask(__name__)

def verify_signature(timestamp, payload, signature, secret):
    message = timestamp + "#"
    message = message.encode() + payload
    ret_signature = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return ret_signature == signature

@app.route('/vntana-webhooks', methods=['POST'])
def vntana_webhooks():
    secret = "YOUR_WEBHOOK_SECRET"

    if verify_signature(
        request.headers['x-timestamp'],
        request.data,
        request.headers['x-vntana-signature'],
        secret
    ):
        payload = request.json
        event = payload['event']

        if event == 'product.completed':
            product = payload['product']
            print(f"Product {product['uuid']} completed conversion")
        elif event == 'product.published':
            # Handle published product
            pass

        return "Success", 200
    return "Access Denied", 403
```

### Endpoint Implementation (Node.js/Express)

```javascript
import * as express from 'express';
import * as crypto from 'crypto';

const app = express();

app.post('/webhook', express.json({type: 'application/json'}), (request, response) => {
    const data = request.body;
    const {headers} = request;

    // Verify signature
    const hash = crypto
        .createHmac('SHA256', 'YOUR_SECRET')
        .update(`${headers['x-timestamp']}#${JSON.stringify(data)}`)
        .digest('hex');

    if (hash !== headers['x-vntana-signature']) {
        return response.status(401).send();
    }

    switch (data.event) {
        case 'product.completed':
            console.log('Product uuid:', data.product.uuid);
            console.log('Product name:', data.product.name);
            break;
        case 'client.added':
            console.log('Client uuid:', data.client.uuid);
            break;
    }

    return response.json({received: true});
});

app.listen(8000);
```

## Webhook Payload Examples

### Product Event

```json
{
  "event": "product.added",
  "organization": {
    "uuid": "org-uuid"
  },
  "product": {
    "uuid": "product-uuid",
    "name": "TestWebhooks",
    "description": "This is a test",
    "tags": [],
    "attributes": {
      "sku": "2345",
      "color": "white"
    },
    "status": "DRAFT",
    "autoPublish": false,
    "pipelineUuid": "pipeline-uuid"
  },
  "client": {
    "uuid": "workspace-uuid"
  }
}
```

### Workspace Event

```json
{
  "event": "client.added",
  "client": {
    "uuid": "workspace-uuid",
    "name": "test name",
    "slug": "test-name"
  },
  "organization": {
    "uuid": "org-uuid",
    "name": "Organization Name",
    "slug": "org-slug"
  }
}
```

### User Event

```json
{
  "event": "user.revoked",
  "user": {
    "uuid": "user-uuid",
    "email": "user@example.com",
    "role": "CLIENT_ORGANIZATION_CONTENT_MANAGER"
  },
  "organization": {
    "uuid": "org-uuid",
    "name": "Organization Name",
    "slug": "org-slug"
  },
  "client": {
    "uuid": "workspace-uuid",
    "name": "workspace-name",
    "slug": "workspace-slug"
  }
}
```

### Showroom Event

```json
{
  "event": "showroom.product.added",
  "organization": {
    "uuid": "org-uuid"
  },
  "showroom": {
    "uuid": "showroom-uuid",
    "name": "Test",
    "products": [
      {
        "uuid": "product-uuid",
        "name": "Product Name",
        "status": "LIVE_PUBLIC",
        "tags": [],
        "attributes": {}
      }
    ]
  }
}
```

### Viewer Preset Event

```json
{
  "event": "viewer_preset.added",
  "organization": {
    "uuid": "org-uuid"
  },
  "viewerPreset": {
    "uuid": "preset-uuid",
    "value": "...",
    "type": "CLIENT",
    "name": "Preset Name",
    "default": false
  },
  "client": {
    "uuid": "workspace-uuid"
  }
}
```

## Error Handling

If issues prevent the Webhook from making a successful request:

1. Webhook retries a certain number of times
2. Email sent to the Webhook creator's email
3. If not addressed, Webhook is eventually disabled with another email notification

**Common issues:**

- Incorrect URL receiving 500 HTTP response
- Endpoint unreachable
- If created via API, ensure email is correct for correspondence

## Example Integration Workflow

**Goal:** Automatically add newly created Assets to Configurators and generate embed links.

1. **Create Webhook** subscribing to `product.added` and `product.completed`
2. **Endpoint handles events:**
   - On `product.completed`: Check if Configurator exists
   - If not, create Configurator via `/v1/variant-groups`
   - Add Asset to Configurator
3. **Generate embed link:**
   ```
   https://embed.vntana.com/variant?uuid={configuratorUuid}&clientSlug={workspaceSlug}&organizationSlug={orgSlug}
   ```

## Related

- [REST API Overview](../getting-started/rest-api-overview.md)
- [API Authentication](../authentication/api-authentication.md)
- [Showrooms](../showrooms/api-showrooms.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
