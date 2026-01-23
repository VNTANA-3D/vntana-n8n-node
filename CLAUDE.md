# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository builds an n8n community node for VNTANA's 3D content management platform. The goal is to enable n8n workflows to interact with VNTANA's Admin API for managing 3D products, organizations, and workspaces.

**Scope:** Minimal MVP focusing on Products and Authentication operations.

## Architecture

### Target Structure
```
n8n-nodes-vntana/
├── package.json
├── nodes/
│   └── Vntana/
│       ├── Vntana.node.ts        # Main node (declarative style)
│       ├── Vntana.node.json      # Codex metadata
│       └── vntana.svg            # Node icon
└── credentials/
    └── VntanaApi.credentials.ts  # Auth configuration
```

### Node Style
Use **declarative style** - JSON-based routing instead of `execute()` method. This is recommended for REST APIs and is more future-proof.

## VNTANA API Details

**Base URL:** `https://api-platform.vntana.com`

**Authentication:** Header-based using `X-AUTH-TOKEN`
- VNTANA uses two-step auth: login → refresh-token with organizationUuid
- For n8n, store the org-specific token directly in credentials

**Key Endpoints for MVP:**
| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get Product | GET | `/v1/products/{uuid}` |
| Search Products | POST | `/v1/products/clients/search` |
| Update Product | PUT | `/v1/products` |
| Delete Product | DELETE | `/v1/products/delete` |
| Update Status | PUT | `/v1/products/status` |
| List Organizations | GET | `/v1/organizations` |
| List Workspaces | GET | `/v1/clients/client-organizations` |

**Response Format:** All responses use `{ success: boolean, errors: [], response: {...} }`

## Commands

```bash
# Build
npm run build              # tsc && gulp build:icons

# Development
npm run dev                # tsc --watch

# Lint
npm run lint               # eslint nodes credentials --ext .ts
npm run lintfix            # eslint with --fix

# Local testing
npm link                   # After build
cd ~/.n8n/custom && npm link n8n-nodes-vntana
n8n start
```

## Reference Documentation

Detailed API and n8n docs are in `documentation/`:
- `documentation/vntana-api-docs/CLAUDE.md` - Full VNTANA API reference
- `documentation/n8n-docs/CLAUDE.md` - n8n node development patterns
- `documentation/vntana-api-docs/swagger/` - OpenAPI specs (237 Admin API endpoints)
