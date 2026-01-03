#!/bin/bash

set -e

echo "=========================================="
echo "Building opencode-mem bundle for OpenCode"
echo "=========================================="
echo ""

# Clean previous build
echo "[1/4] Cleaning previous build..."
rm -rf dist/bundle
mkdir -p dist/bundle

# Build bundle
echo ""
echo "[2/4] Building bundle..."
bun build src/bundle/index.ts \
    --outfile dist/bundle/opencode-mem.js \
    --target node

# Verify bundle was created
if [ ! -f "dist/bundle/opencode-mem.js" ]; then
    echo "❌ Bundle failed - output file not found"
    exit 1
fi

# Copy skill files
echo ""
echo "[3/4] Copying skill files..."
mkdir -p dist/bundle/skill/operations
cp -r src/skill/* dist/bundle/skill/

# Verify skill files were copied
if [ ! -d "dist/bundle/skill" ]; then
    echo "❌ Skill files not copied"
    exit 1
fi

# Create package info
echo ""
echo "[4/4] Creating bundle info..."
cat > dist/bundle/package.json << EOF
{
  "name": "opencode-mem-bundle",
  "version": "$(node -p "require('../package.json').version")",
  "description": "OpenCode integration for claude-mem (bundled)",
  "main": "./opencode-mem.js",
  "files": [
    "opencode-mem.js",
    "skill/"
  ]
}
EOF

# Verify package.json was created
if [ ! -f "dist/bundle/package.json" ]; then
    echo "❌ Bundle package.json not created"
    exit 1
fi

# Get file sizes
BUNDLE_SIZE=$(du -h dist/bundle/opencode-mem.js | cut -f1)
TOTAL_SIZE=$(du -sh dist/bundle | cut -f1)

echo ""
echo "✅ Bundle created successfully!"
echo ""
echo "Output files:"
ls -lh dist/bundle/
echo ""
echo "Bundle statistics:"
echo "  • Main bundle: dist/bundle/opencode-mem.js ($BUNDLE_SIZE)"
echo "  • Total size: $TOTAL_SIZE"
echo "  • Skill files: $(find dist/bundle/skill -type f | wc -l) files"
echo ""
echo "To integrate with OpenCode:"
echo "  1. Copy dist/bundle/* to your OpenCode project"
echo "  2. Import: import { ClaudeMemIntegration } from './opencode-mem.js'"
echo "  3. Initialize: await integration.initialize()"
echo ""
echo "Or install globally:"
echo "  npm install -g opencode-mem"
echo ""
echo "Bundle complete! 🎉"
