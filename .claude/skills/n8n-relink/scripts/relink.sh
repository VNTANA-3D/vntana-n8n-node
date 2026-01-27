#!/bin/bash
# Cleans up old n8n-nodes-vntana installations and relinks to the dev repo

set -e

REPO_PATH="/Users/benconway/GitHub/VNTANA-n8n-node"
N8N_NODES_DIR="$HOME/.n8n/nodes"
N8N_CUSTOM_DIR="$HOME/.n8n/custom"

echo "=== n8n-nodes-vntana Relink Script ==="
echo ""

# Step 1: Build the package
echo "1. Building package..."
cd "$REPO_PATH"
npm run build
echo "   Done."
echo ""

# Step 2: Clean up ~/.n8n/nodes if it has our package
if [ -d "$N8N_NODES_DIR/node_modules/n8n-nodes-vntana" ]; then
    echo "2. Removing old copy from ~/.n8n/nodes..."
    rm -rf "$N8N_NODES_DIR/node_modules/n8n-nodes-vntana"
    # Update package.json to remove the dependency
    if [ -f "$N8N_NODES_DIR/package.json" ]; then
        # Use node to safely remove the dependency
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('$N8N_NODES_DIR/package.json', 'utf8'));
            if (pkg.dependencies && pkg.dependencies['n8n-nodes-vntana']) {
                delete pkg.dependencies['n8n-nodes-vntana'];
                fs.writeFileSync('$N8N_NODES_DIR/package.json', JSON.stringify(pkg, null, 2));
                console.log('   Removed from package.json');
            }
        "
    fi
    echo "   Done."
else
    echo "2. No old copy in ~/.n8n/nodes (skipped)"
fi
echo ""

# Step 3: Clean up ~/.n8n/custom if it has our package
if [ -d "$N8N_CUSTOM_DIR/node_modules/n8n-nodes-vntana" ]; then
    echo "3. Removing old link from ~/.n8n/custom..."
    rm -rf "$N8N_CUSTOM_DIR/node_modules/n8n-nodes-vntana"
    echo "   Done."
else
    echo "3. No old link in ~/.n8n/custom (skipped)"
fi
echo ""

# Step 4: Create fresh link in ~/.n8n/nodes
echo "4. Creating fresh link in ~/.n8n/nodes..."
mkdir -p "$N8N_NODES_DIR/node_modules"
cd "$N8N_NODES_DIR"
npm link n8n-nodes-vntana
echo "   Done."
echo ""

# Step 5: Verify the link
echo "5. Verifying link..."
LINK_TARGET=$(readlink "$N8N_NODES_DIR/node_modules/n8n-nodes-vntana" 2>/dev/null || echo "NOT A LINK")
echo "   Link target: $LINK_TARGET"

# Check if dist has recent changes
DIST_FILE="$REPO_PATH/dist/nodes/Vntana/Vntana.node.js"
if [ -f "$DIST_FILE" ]; then
    DIST_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$DIST_FILE")
    echo "   Dist file last modified: $DIST_TIME"
fi
echo ""

echo "=== Complete ==="
echo ""
echo "Now restart n8n to pick up changes:"
echo "  - If running in terminal: Ctrl+C then 'n8n start'"
echo "  - If running via Docker: docker restart <container>"
echo "  - If running as service: sudo systemctl restart n8n"
