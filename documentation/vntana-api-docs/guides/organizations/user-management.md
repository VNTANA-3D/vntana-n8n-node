# User Management

> **Source:** https://help.vntana.com/user-management

## Overview

The VNTANA Platform has a number of different levels of User Access for you and others to properly manage the contents of your Organization. These allow you to invite and assign individuals to specific Workspaces, invite Guests to view the contents of a Workspace, or simply add more Admins to manage the Organization as a whole.

## Authentication

Requires `X-AUTH-TOKEN` header. See [API Authentication](../authentication/api-authentication.md).

## Levels of User Access

| Access Level | General Permissions |
|--------------|---------------------|
| **Organization Owner** | Full access to Organization |
| **Organization Admin** | Full access excluding Billing |
| **Workspace Admin** | Full access to select Workspaces |
| **Content Manager** | Limited access to Workspace features. Create, Update, Delete assets. |
| **Guest** | Can only view Workspaces they've been added to |
| **Restricted Access User – Project** | Can only access Projects invited to. **Edit:** Can edit Project, view, download, and share linked Assets (if Live), and edit linked Assets (separate option at invite). **View:** Can only view Project and contents, download and share linked Assets (if Live). |
| **Restricted Access User – Asset** | Can only access Assets invited to. **Edit:** Can edit, download, and share (if Live) the Assets. **View:** Can only view, download, and share (if Live). |

## Viewing a User's Access Level

1. Navigate to the **Settings** page of your Organization
2. Select **Users** from the list of Manage Organization options
3. View the list of all Users with their name, email, and role

**Note:** All Workspace-level and lower roles are displayed as "Multi-Workspace Access User" on this page. Click on a user to see detailed information about their roles in specific Workspaces.

## Inviting Users

### Inviting a User to the Organization

1. From the **Users** page, click **+ Invite New User** button (top right)
2. Enter the user's email address
3. Set their Role/Access Level:
   - **Organization Admin**: Full org access (excluding billing)
   - **Workspace Access User**: Select specific Workspace(s) and role:
     - Workspace Admin
     - Content Manager
     - Guest

The user will receive an invite email to accept and set their name and password.

### Inviting Users to Projects

Project invites are handled individually from the Project itself:

1. Navigate to the Project page
2. Click **Share** button (upper right corner)
3. Enter user's email and select role:
   - **Edit**: Can edit Project, view/download/share linked Assets
   - **View**: Can only view Project and contents
4. Optional: Check "Edit Assets" to allow editing Assets within the Project (even with Project Edit role, users cannot modify Assets without this option)

### Inviting Users to Assets

**Bulk Invite (Multiple Assets):**
1. Select one or more assets from the Asset Library list
2. Click **Share** button (upper right corner)
3. Enter email and select role (Edit or View)
4. Optional: Use the **Public Link** section for a shareable link with download links (no platform access required)

**Individual Asset Invite:**
1. Navigate to the Asset's page
2. Click the **Share** tab
3. Scroll to **Invite Users** section
4. Enter email and role, then click **Invite**

## Revoke or Change User Access

1. From the Users page, click on the user's name
2. View breakdown of their role(s)
3. Make changes as needed

**Note:** Only Organization Owners and Admins can change a user's role.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/users | List users in organization |
| POST | /v1/users/invite | Invite a new user |
| PUT | /v1/users/{uuid} | Update user role |
| DELETE | /v1/users/{uuid} | Remove user from organization |

## Code Examples

```bash
# List all users in organization
curl -X GET "https://api-platform.vntana.com/v1/users" \
  -H "X-AUTH-TOKEN: your-token"

# Invite a new user
curl -X POST "https://api-platform.vntana.com/v1/users/invite" \
  -H "X-AUTH-TOKEN: your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "role": "WORKSPACE_ADMIN",
    "workspaceUuids": ["workspace-uuid-here"]
  }'

# Update user role
curl -X PUT "https://api-platform.vntana.com/v1/users/{uuid}" \
  -H "X-AUTH-TOKEN: your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "CONTENT_MANAGER"
  }'

# Remove user from organization
curl -X DELETE "https://api-platform.vntana.com/v1/users/{uuid}" \
  -H "X-AUTH-TOKEN: your-token"
```

## Response Examples

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uuid": "user-uuid-123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "ORGANIZATION_ADMIN",
        "status": "ACTIVE"
      }
    ]
  }
}
```

## Webhook Events

Subscribe to user events for automated notifications:

| Event | Description |
|-------|-------------|
| `user.added` | User added to Organization |
| `user.revoked` | User removed from Organization |

See [Webhooks](../webhooks/webhooks.md) for setup instructions.

## Common Patterns

### Onboarding New Team Members
1. Invite user with appropriate role via UI or API
2. User receives email and sets up account
3. Assign to specific Workspaces as needed
4. Optionally grant Project or Asset-level access for granular control

### Managing External Collaborators
1. Use **Guest** role for view-only access
2. Use **Restricted Access User** for specific Project/Asset access
3. Revoke access when collaboration ends

## Error Handling

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Unauthorized | Token expired or invalid, re-authenticate |
| 403 | Forbidden | User lacks permission (must be Owner or Admin) |
| 404 | Not Found | User UUID doesn't exist |
| 409 | Conflict | User already exists in organization |
| 422 | Validation Error | Check required fields (email, role) |

## Related

- [Organizations & Workspaces](./organizations-clients.md)
- [API Authentication](../authentication/api-authentication.md)
- [Webhooks](../webhooks/webhooks.md)
- [Swagger Reference: Admin API](/api-documentation/swagger/vntana-admin-api-docs.yaml)
