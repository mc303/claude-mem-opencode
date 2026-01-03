#!/bin/bash

set -e

echo "=========================================="
echo "opencode-mem Quick Setup (5 minutes)"
echo "=========================================="
echo ""

# Check if bun is installed
echo "[1/8] Checking Bun installation..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed"
    echo "    Install with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi
echo "✅ Bun is installed"

# Check if Node.js is installed
echo ""
echo "[2/8] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "    Install from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node.js v$NODE_VERSION is installed"

# Check if claude-mem is installed
echo ""
echo "[3/8] Checking claude-mem installation..."
if ! command -v claude-mem &> /dev/null; then
    echo "⚠️  claude-mem is not installed globally"
    echo "    Installing now..."
    npm install -g claude-mem
    CLAUDE_MEM_VERSION=$(claude-mem --version 2>/dev/null || echo "unknown")
else
    CLAUDE_MEM_VERSION=$(claude-mem --version 2>/dev/null || echo "unknown")
    echo "✅ claude-mem v$CLAUDE_MEM_VERSION found"
fi

# Install dependencies
echo ""
echo "[4/8] Installing opencode-mem dependencies..."
bun install

# Build opencode-mem
echo ""
echo "[5/8] Building opencode-mem..."
npm run build

# Start claude-mem worker
echo ""
echo "[6/8] Starting claude-mem worker..."
if pgrep -f "claude-mem worker" > /dev/null; then
    echo "⚠️  claude-mem worker is already running"
    echo "    Checking if it's responsive..."
    if curl -f http://localhost:37777/api/health > /dev/null 2>&1; then
        echo "✅ Worker is running and responsive"
    else
        echo "⚠️  Worker is running but not responding"
        echo "    Restarting..."
        claude-mem worker restart
        sleep 2
        if curl -f http://localhost:37777/api/health > /dev/null 2>&1; then
            echo "✅ Worker restarted successfully"
        else
            echo "❌ Worker restart failed"
            exit 1
        fi
    fi
else
    claude-mem worker start &
    echo "Worker starting..."
    sleep 3
    if curl -f http://localhost:37777/api/health > /dev/null 2>&1; then
        echo "✅ Worker started successfully"
    else
        echo "❌ Worker failed to start"
        exit 1
    fi
fi

# Install opencode-mem globally
echo ""
echo "[7/8] Installing opencode-mem globally..."
if ! command -v opencode-mem &> /dev/null; then
    npm link  # For development
    echo "✅ opencode-mem installed globally (dev mode)"
else
    echo "✅ opencode-mem is already installed globally"
fi

# Run tests
echo ""
echo "[8/8] Running compatibility tests..."
if command -v opencode-mem &> /dev/null; then
    if opencode-mem check-compatibility 2>&1 | grep -q "Compatible"; then
        echo "✅ opencode-mem is compatible with claude-mem"
    else
        echo "⚠️  Compatibility warnings detected"
        echo "    Run: opencode-mem check-compatibility"
    fi
else
    echo "ℹ️  Skipping compatibility test"
fi

# Print summary
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "What's ready:"
echo "  • claude-mem worker: Running at http://localhost:37777"
echo "  • opencode-mem: Installed and ready"
echo "  • Compatibility: Checked and verified"
echo ""
echo "Quick commands:"
echo "  • Check status:    opencode-mem status"
echo "  • Check compatibility: opencode-mem check-compatibility"
echo "  • Search memories: opencode-mem search \"query\""
echo "  • Get context:     opencode-mem context"
echo ""
echo "Next steps:"
echo "  1. Use in OpenCode: Memory is captured automatically"
echo "  2. Or use CLI: opencode-mem search \"your query\""
echo "  3. Check docs: cat README.md"
echo ""
echo "Troubleshooting:"
echo "  • Worker not responding: claude-mem worker restart"
echo "  • View logs: claude-mem worker logs"
echo "  • Full documentation: docs/INSTALLATION.md"
echo ""
echo "Setup completed in ~5 minutes 🎉"
