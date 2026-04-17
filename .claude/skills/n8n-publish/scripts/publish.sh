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

# 5. Regenerate CHANGELOG.md — required by AGENTS.md release-notes policy
echo "5. Regenerating CHANGELOG.md from git tags..."
npx --yes --package=auto-changelog -- auto-changelog --commit-limit false
if ! git diff --quiet CHANGELOG.md; then
    git add CHANGELOG.md
    git commit -m "docs: update CHANGELOG for v$NEW_VERSION"
    git push origin main
    echo "   CHANGELOG updated and pushed."
else
    echo "   CHANGELOG already up to date."
fi
echo ""

# 6. Check for GitHub Release — REQUIRED (see AGENTS.md)
echo "6. Checking for GitHub Release v$NEW_VERSION..."
if gh release view "v$NEW_VERSION" >/dev/null 2>&1; then
    echo "   Release already exists: $(gh release view "v$NEW_VERSION" --json url -q .url)"
else
    echo ""
    echo "   ⚠️  GitHub Release for v$NEW_VERSION does NOT exist yet."
    echo "   Per AGENTS.md, every version must have a GitHub Release with:"
    echo "     - What's new (plain English, 1 paragraph)"
    echo "     - Breaking changes / upgrade notes (or 'No action required')"
    echo "     - Link to compare view"
    echo ""
    echo "   Create it now with:"
    echo "     gh release create v$NEW_VERSION --title \"v$NEW_VERSION — <summary>\" --notes-file <path>"
    echo ""
    echo "   Or open the web editor pre-filled:"
    echo "     https://github.com/VNTANA-3D/vntana-n8n-node/releases/new?tag=v$NEW_VERSION"
fi
echo ""

# 7. Wait briefly then verify npm registry reflects the new version
echo "7. Waiting ~45s for CI to publish..."
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
echo "Reminder: if you haven't already, create the GitHub Release (step 6)."
