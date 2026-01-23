# Generate Authentication Key

> **Source URL:** https://help.vntana.com/generate-authentication-key

## Overview

An authentication token can be generated via your account on the VNTANA Platform allowing for user authentication via the API without the need to use and/or store a user email and password. This is the recommended method for API authentication as it avoids storing credentials in your code.

## Prerequisites

- Active VNTANA Platform account
- Access to the VNTANA Platform web interface

## Step-by-Step Guide

### Step 1: Navigate to Profile

Log in to the VNTANA Platform and click on your **profile icon** in the upper right corner of the webpage.

### Step 2: Access Authentication Key Tab

On the Profile page, three tabs will appear:
- **Profile** - Basic account info
- **Password** - Change password
- **Authentication Key** - Generate/view your API token

Click on the **Authentication Key** tab.

### Step 3: Generate Token

The first time you visit this tab, you will see a **Generate** button. Click it to generate the Authentication Token for your user account.

**To copy your token:**
- Click the **copy icon** on the right of the generated token, OR
- Manually select and copy the token

## Using the Authentication Key

Once generated, use the key to authenticate API requests instead of email/password.

> **Terminology Note:** The VNTANA Platform UI calls this an "Authentication Key", but the API expects it as `personal-access-token` in the request body.

### API Login with Auth Key

**Endpoint:** `POST /v1/auth/login/token`

**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "personal-access-token": "your-authentication-key-here"
}
```

**Response:**
```json
{
  "success": true,
  "errors": [],
  "response": {
    "email": "user@example.com"
  }
}
```

The `x-auth-token` is returned in the **Response Headers** for use in subsequent requests.

## Code Examples

```bash
# Login with authentication key (personal access token)
curl -X POST "https://api-platform.vntana.com/v1/auth/login/token" \
  -H "Content-Type: application/json" \
  -d '{"personal-access-token": "your-auth-key-here"}' \
  -D - # Output headers to see x-auth-token
```

## Best Practices

- **Store securely:** Treat your authentication key like a password. Do not commit it to version control or share it publicly.
- **Use environment variables:** Store your key in environment variables rather than hardcoding it.
- **Regenerate if compromised:** If you suspect your key has been exposed, regenerate it immediately on the Platform.

## Authentication Key vs Email/Password

| Method | Pros | Cons |
|--------|------|------|
| **Authentication Key** | No credentials in code; easy to regenerate if compromised; recommended for automation | Must store key securely |
| **Email/Password** | Familiar flow | Requires storing sensitive credentials; less secure for automation |

## Important Notes

- **Lost token:** If you lose your token, you must re-generate it on the Platform by following the same steps. The old token will be invalidated.
- **One token per user:** Each user account has one authentication key at a time.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid or expired authentication key | Regenerate your key on the Platform |
| `400 Bad Request` | Malformed request body | Ensure JSON is valid and `personal-access-token` field is present |

## Related

- [API Authentication](./api-authentication.md)
- [Refresh Token Usage](./refresh-token-usage.md)
- [Organizations & Workspaces](../organizations/organizations-clients.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
