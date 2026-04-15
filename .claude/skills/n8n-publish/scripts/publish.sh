#!/bin/bash
# Release n8n-nodes-vntana: bump version, push tag, let GitHub Actions npm publish.
# Does NOT run `npm publish` locally — CI owns the npm token.

set -e

REPO_PATH="/Users/benconway/GitHub/VNTANA-n8n-node"
VERSION_TYPE="${1:-patch}"

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Version type must be patch, minor, or major"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
fi

echo "=== n8n-nodes-vntana Release Script ==="
echo "Version bump: $VERSION_TYPE"
echo "(npm publish runs in GitHub Actions on tag push)"
echo ""

cd "$REPO_PATH"

# Ensure Node >= 20 — @n8n/node-cli breaks on Node 18.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    source "$HOME/.nvm/nvm.sh"
    nvm use 22 > /dev/null
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "Error: Node >= 20 required (have $(node --version)). Try: nvm use 22"
    exit 1
fi

# 1. Fast tests (unit + integration — e2e needs live VNTANA API)
echo "1. Running unit + integration tests..."
npx vitest run tests/unit tests/integration
echo "   Done."
echo ""

# 2. Build (typechecks + produces dist artifacts CI will publish)
echo "2. Building package..."
npm run build
echo "   Done."
echo ""

# 3. Bump version (creates commit + tag)
echo "3. Bumping version ($VERSION_TYPE)..."
npm version "$VERSION_TYPE"
NEW_VERSION=$(node -p "require('./package.json').version")
echo "   New version: $NEW_VERSION"
echo ""

# 4. Push main + tag — GitHub Actions picks up the tag and publishes to npm
echo "4. Pushing main + tags to GitHub (triggers CI publish)..."
git push origin main --tags
echo "   Done. CI is now publishing."
echo ""

# 5. Wait briefly then verify npm registry reflects the new version
echo "5. Waiting ~45s for CI to publish..."
sleep 45
PUBLISHED=$(npm view "n8n-nodes-vntana@$NEW_VERSION" version 2>/dev/null || true)
if [ "$PUBLISHED" = "$NEW_VERSION" ]; then
    echo "   Verified: n8n-nodes-vntana@$NEW_VERSION is live on npm."
else
    echo "   Not yet on npm — CI may still be running."
    echo "   Check: https://github.com/VNTANA-3D/vntana-n8n-node/actions"
fi
echo ""

echo "=== Complete ==="
echo "Tagged v$NEW_VERSION. CI handles npm publish."
