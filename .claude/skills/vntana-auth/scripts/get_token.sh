#!/bin/bash
# Get VNTANA X-AUTH-TOKEN using two-step authentication
# Reads credentials from .env file in current directory or specified path

set -e

# Find .env file
ENV_FILE="${1:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
    # Try project root
    ENV_FILE="/Users/benconway/GitHub/VNTANA-n8n-node/.env"
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: .env file not found" >&2
    exit 1
fi

# Load credentials from .env
source "$ENV_FILE"

BASE_URL="${VNTANA_BASE_URL:-https://api-platform.vntana.com}"

# Step 1: Login to get initial token
LOGIN_RESPONSE=$(curl -s -i -X POST "${BASE_URL}/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${VNTANA_EMAIL}\", \"password\": \"${VNTANA_PASSWORD}\"}")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -i "x-auth-token:" | cut -d' ' -f2 | tr -d '\r')

if [[ -z "$LOGIN_TOKEN" ]]; then
    echo "Error: Login failed - no token received" >&2
    echo "$LOGIN_RESPONSE" >&2
    exit 1
fi

# Step 2: Refresh token with organization UUID
REFRESH_RESPONSE=$(curl -s -i -X POST "${BASE_URL}/v1/auth/refresh-token" \
    -H "X-AUTH-TOKEN: Bearer ${LOGIN_TOKEN}" \
    -H "organizationUuid: ${VNTANA_ORGANIZATION_UUID}")

REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -i "x-auth-token:" | cut -d' ' -f2 | tr -d '\r')

if [[ -z "$REFRESH_TOKEN" ]]; then
    echo "Error: Token refresh failed" >&2
    echo "$REFRESH_RESPONSE" >&2
    exit 1
fi

# Output the token
echo "$REFRESH_TOKEN"
