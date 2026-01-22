# n8n Node Development Documentation

This directory contains the official n8n documentation, specifically for creating custom nodes.

## Quick Reference

### Node Building Approaches

**Declarative Style** (Recommended for REST APIs)
- JSON-based syntax, simpler to write
- Uses `routing` key instead of `execute()` method
- More future-proof
- Location: `docs/integrations/creating-nodes/build/declarative-style-node.md`

**Programmatic Style** (Required for complex nodes)
- Use for: trigger nodes, GraphQL APIs, external dependencies, data transformation
- Requires `execute()` method
- Location: `docs/integrations/creating-nodes/build/programmatic-style-node.md`

## Required File Structure

```
n8n-nodes-<name>/
├── package.json                    # npm package config with n8n object
├── nodes/
│   └── <NodeName>/
│       ├── <NodeName>.node.ts      # Main node file (class implementing INodeType)
│       ├── <NodeName>.node.json    # Codex file (metadata)
│       └── <nodename>.svg          # Node icon
└── credentials/
    └── <NodeName>Api.credentials.ts # Authentication config
```

## Node Base File Structure (Declarative)

```typescript
import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class MyNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Node',           // GUI name
    name: 'myNode',                   // Internal name (camelCase)
    icon: 'file:mynode.svg',
    group: [],                        // [] for standard, ['trigger'] for triggers
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Node description',
    defaults: { name: 'My Node' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      { name: 'myNodeApi', required: true }
    ],
    requestDefaults: {
      baseURL: 'https://api.example.com',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Item', value: 'item' },
        ],
        default: 'item',
      },
      // Operations per resource
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['item'] },
        },
        options: [
          {
            name: 'Get',
            value: 'get',
            action: 'Get an item',
            description: 'Get a single item',
            routing: {
              request: {
                method: 'GET',
                url: '=/items/{{$parameter["itemId"]}}',
              },
            },
          },
        ],
        default: 'get',
      },
      // Input fields
      {
        displayName: 'Item ID',
        name: 'itemId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            resource: ['item'],
            operation: ['get'],
          },
        },
      },
    ],
  };
}
```

## Credentials File Structure

```typescript
import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class MyNodeApi implements ICredentialType {
  name = 'myNodeApi';
  displayName = 'My Node API';
  documentationUrl = 'https://docs.example.com';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
  ];

  // Authentication methods:
  // - header: { Authorization: '=Bearer {{$credentials.apiKey}}' }
  // - qs: { api_key: '={{$credentials.apiKey}}' }
  // - body: { username: '...', password: '...' }
  // - auth: { username: '...', password: '...' } (Basic Auth)

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      header: {
        'X-AUTH-TOKEN': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.example.com',
      url: '/test-endpoint',
    },
  };
}
```

## UI Element Types

| Type | Description |
|------|-------------|
| `string` | Text input (use `typeOptions: { password: true }` for passwords, `rows: 4` for multiline) |
| `number` | Numeric input (supports `minValue`, `maxValue`, `numberPrecision`) |
| `boolean` | Toggle switch |
| `options` | Single-select dropdown |
| `multiOptions` | Multi-select dropdown |
| `dateTime` | Date picker |
| `json` | JSON editor |
| `collection` | Optional fields container (for "Additional Fields") |
| `fixedCollection` | Grouped related fields |
| `resourceLocator` | ID/URL/List selector for external resources |

## Routing in Declarative Nodes

```typescript
routing: {
  request: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: '=/path/{{$parameter["id"]}}',  // Expression with = prefix
    qs: {                                 // Query string parameters
      param: '={{$parameter["paramValue"]}}',
    },
    body: {                               // Request body
      field: '={{$parameter["fieldValue"]}}',
    },
  },
  output: {
    postReceive: [
      {
        type: 'set',
        properties: {
          value: '={{ { "success": $response } }}',
        },
      },
    ],
  },
}
```

## package.json Requirements

```json
{
  "name": "n8n-nodes-mynode",
  "version": "0.1.0",
  "description": "n8n node for MyService",
  "keywords": ["n8n-community-node-package"],
  "license": "MIT",
  "main": "index.js",
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/MyNodeApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/MyNode/MyNode.node.js"
    ]
  },
  "scripts": {
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch",
    "lint": "eslint nodes credentials --ext .ts",
    "lintfix": "eslint nodes credentials --ext .ts --fix"
  }
}
```

## Testing Locally

```bash
# 1. Install n8n globally
npm install n8n -g

# 2. Build and link your node
npm run build
npm link

# 3. Link to n8n (in ~/.n8n/custom/)
cd ~/.n8n/custom
npm init  # if custom dir doesn't exist
npm link n8n-nodes-mynode

# 4. Start n8n
n8n start
```

## Key Documentation Files

| File | Description |
|------|-------------|
| `docs/integrations/creating-nodes/overview.md` | Getting started |
| `docs/integrations/creating-nodes/plan/choose-node-method.md` | Declarative vs programmatic |
| `docs/integrations/creating-nodes/build/declarative-style-node.md` | Full declarative tutorial |
| `docs/integrations/creating-nodes/build/reference/ui-elements.md` | All UI components |
| `docs/integrations/creating-nodes/build/reference/credentials-files.md` | Auth configuration |
| `docs/integrations/creating-nodes/build/reference/node-base-files/standard-parameters.md` | Node parameters |
| `docs/integrations/creating-nodes/test/run-node-locally.md` | Local testing |

## Best Practices

1. **Naming**: Class name must match filename (e.g., `MyNode` class in `MyNode.node.ts`)
2. **Icons**: SVG format, 60x60px recommended, placed in node directory
3. **Credentials name**: Must match between node's `credentials` array and credentials file's `name` property
4. **Operations**: Always include `action` property for future compatibility
5. **Additional Fields**: Use `collection` type with `displayOptions` for optional parameters
6. **Error handling**: Use `noDataExpression: true` on resource/operation selectors
