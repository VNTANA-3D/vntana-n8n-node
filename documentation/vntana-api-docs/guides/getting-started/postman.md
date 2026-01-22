# Using the Postman Collections

> **Source:** https://help.vntana.com/postman

## Overview

All Postman examples provided in VNTANA guides are set with the capability to run as a full collection or as individual endpoints. They require some configuration before running, including valid VNTANA account credentials and Organization/Workspace slugs.

## Initial Setup

### Step 1: Set Global Variables

1. Go to the **Collection View** for the Postman collection you wish to run
2. Set the Global Variable `url` to the VNTANA Admin API base URL:
   ```
   https://api-platform.vntana.com
   ```

### Step 2: Configure Pre-request Script Variables

Navigate to the **Pre-request Script** tab of the Collection. Check what variables need to be set before it can run.

**Common variables to set:**
- `email` - Your VNTANA account email
- `password` - Your VNTANA account password (or use `authenticationKey`)
- `organizationSlug` - Your Organization slug
- `clientSlug` - Your Workspace slug

**Note:** Variables can also be set in the **Variables** tab if preferred. Not all variables are needed for every collection.

## Running Collections

### Running as a Full Collection

1. Click the **three dots** by the collection name
2. Select **Run collection**
3. Select which endpoints to run:
   - Only select **one** of the Login endpoints (email/password OR auth key)
   - If you have Organization-level access, **deselect** 'Refresh Token Client'
4. Click **Run [Collection Name]**

**Important Notes:**
- Running as a collection will NOT show full output of any endpoints
- For full response output, run endpoints individually

### Running Individual Endpoints

To run endpoints individually:
1. Comment out or delete any Pre-request Scripts
2. Manually set the required values for each endpoint
3. Ensure Header parameters (e.g., `x-auth-token`) are set correctly

### Using Pre-request Scripts

If running as a collection with Pre-request Scripts:
- Ensure Pre-request Scripts for each endpoint are **NOT commented out**
- Ensure Header parameters needed for the endpoint (e.g., `x-auth-token`) are **deactivated**
- This allows each endpoint to set required data for the next endpoint

## File Upload Configuration

For endpoints that upload files (e.g., Asset creation):

### Body Configuration
- Pass the file as **binary** data in the Body
- Do NOT use 'form-data'

### Postman Settings for External Files
To upload files stored outside the Postman workspace:
1. Go to **File > Settings**
2. Select the **General** tab
3. Scroll to **Working directory**
4. Toggle **Allow reading files outside working directory**

Alternatively, place files in the Postman workspace folder.

## User Access Level Considerations

| User Access Level | Skip 'Refresh Token Client'? |
|-------------------|------------------------------|
| Organization Owner | Yes |
| Organization Admin | Yes |
| Workspace Admin | No |
| Content Manager | No |
| Guest | No |

See [User Management](../organizations/user-management.md) for more information on access levels.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Collection won't run | Check that Global Variables are set, especially `url` |
| Authentication fails | Verify email/password or authenticationKey is correct |
| 403 FORBIDDEN | Check user access level; may need Workspace-specific token |
| File upload fails | Ensure file is passed as binary, not form-data; check Postman file access settings |
| Missing response data | Run endpoint individually to see full response |

## Available Postman Collections

VNTANA provides Postman collections for various API workflows:

- **User Authentication** - Login and token generation
- **Organizations & Workspaces** - Retrieve org/workspace data
- **Asset Management** - Create, search, update assets
- **Tags** - Create and manage tags
- **Webhooks** - Configure webhook subscriptions
- **Analytics** - Retrieve metrics data

Collections are provided in the relevant API documentation guides.

## Related

- [REST API Overview](./rest-api-overview.md)
- [API Authentication](../authentication/api-authentication.md)
- [Refresh Token Usage](../authentication/refresh-token-usage.md)
- [User Management](../organizations/user-management.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
