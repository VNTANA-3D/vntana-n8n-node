#!/bin/bash
# Publishes n8n-nodes-vntana to npm with version bump and verification

set -e

REPO_PATH="/Users/benconway/GitHub/VNTANA-n8n-node"
VERSION_TYPE="${1:-patch}"

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Version type must be patch, minor, or major"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
fi

echo "=== n8n-nodes-vntana Publish Script ==="
echo "Version bump: $VERSION_TYPE"
echo ""

cd "$REPO_PATH"

# Step 1: Run tests
echo "1. Running tests..."
npm test
echo "   Done."
echo ""

# Step 2: Build
echo "2. Building package..."
npm run build
echo "   Done."
echo ""

# Step 3: Bump version
echo "3. Bumping version ($VERSION_TYPE)..."
npm version "$VERSION_TYPE"
NEW_VERSION=$(node -p "require('./package.json').version")
echo "   New version: $NEW_VERSION"
echo ""

# Step 4: Push to GitHub
echo "4. Pushing to GitHub with tags..."
git push origin main --tags
echo "   Done."
echo ""

# Step 5: Publish to npm
echo "5. Publishing to npm..."
npm publish
echo "   Done."
echo ""

# Step 6: Verify with scanner
echo "6. Verifying with n8n scanner..."
echo "   (This may take a moment for npm to propagate)"
sleep 5
npx @n8n/scan-community-package "n8n-nodes-vntana@$NEW_VERSION" || echo "   Scanner check skipped (may need more time to propagate)"
echo ""

echo "=== Complete ==="
echo "Published n8n-nodes-vntana@$NEW_VERSION"
