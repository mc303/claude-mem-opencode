#!/bin/bash

set -e

VERSION=${1:-latest}

echo "=========================================="
echo "opencode-mem Installation"
echo "=========================================="
echo ""

# Check if claude-mem is installed
echo "[1/5] Checking claude-mem installation..."
if ! command -v claude-mem &> /dev/null; then
    echo "⚠️  claude-mem is not installed globally."
    echo "    Install with: npm install -g claude-mem"
    echo "    Or continue without claude-mem (memory features will be disabled)"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    CLAUDE_MEM_VERSION=$(claude-mem --version 2>/dev/null || echo "unknown")
    echo "✅ claude-mem v$CLAUDE_MEM_VERSION found"
fi

# Install opencode-mem globally
echo ""
echo "[2/5] Installing opencode-mem v$VERSION..."
npm install -g opencode-mem@$VERSION

# Verify installation
echo ""
echo "[3/5] Verifying installation..."
if ! command -v opencode-mem &> /dev/null; then
    echo "❌ Installation failed"
    exit 1
fi
echo "✅ opencode-mem installed successfully"

# Test compatibility
echo ""
echo "[4/5] Testing compatibility with claude-mem..."
if command -v claude-mem &> /dev/null; then
    if opencode-mem check-compatibility 2>&1 | grep -q "Compatible"; then
        echo "✅ Compatible with claude-mem"
    else
        echo "⚠️  Compatibility warnings detected"
    fi
else
    echo "ℹ️  claude-mem not installed, skipping compatibility test"
fi

# Print next steps
echo ""
echo "[5/5] Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Start claude-mem worker: claude-mem worker start"
echo "  2. Use in OpenCode: (see README.md for integration instructions)"
echo "  3. Check compatibility: opencode-mem check-compatibility"
echo ""
echo "Documentation: https://github.com/your-org/opencode-mem"
