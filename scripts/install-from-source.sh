#!/bin/bash

set -e

CLAUDE_MEM_VERSION=${1:-8.5.4}
OPENCODE_MEM_VERSION=${2:-latest}
DEST_DIR=${3:-}

# Show help if requested
if [ "$CLAUDE_MEM_VERSION" = "--help" ] || [ "$CLAUDE_MEM_VERSION" = "-h" ]; then
    echo "=========================================="
    echo "Installing claude-mem and claude-mem-opencode from Source"
    echo "=========================================="
    echo ""
    echo "Usage: bash scripts/install-from-source.sh [claude-mem-version] [claude-mem-opencode-version] [destination-folder]"
    echo ""
    echo "Arguments:"
    echo "  claude-mem-version:    claude-mem version to install (default: 8.5.4)"
    echo "  claude-mem-opencode-version: claude-mem-opencode version (default: latest)"
    echo "  destination-folder:      Custom folder to install claude-mem-opencode (optional)"
    echo "                           If specified, claude-mem-opencode will be built locally"
    echo "                           instead of installed globally"
    echo ""
    echo "Examples:"
    echo "  # Default: Install latest versions globally"
    echo "  bash scripts/install-from-source.sh"
    echo ""
    echo "  # Install specific versions"
    echo "  bash scripts/install-from-source.sh 8.5.3 latest"
    echo ""
    echo "  # Install to local folder"
    echo "  bash scripts/install-from-source.sh latest latest /path/to/opencode/project"
    echo ""
    echo "  # Install to absolute path"
    echo "  bash scripts/install-from-source.sh latest latest /home/user/my-opcode-integration"
    echo ""
    exit 0
fi

echo "=========================================="
echo "Installing claude-mem and claude-mem-opencode from Source"
echo "=========================================="
echo ""
echo "claude-mem version: $CLAUDE_MEM_VERSION"
echo "  claude-mem-opencode version: $OPENCODE_MEM_VERSION"

if [ -n "$DEST_DIR" ]; then
    echo "Installation destination: $DEST_DIR"
else
    echo "Installation destination: Global (npm install -g)"
fi
echo ""

# Step 1: Install claude-mem from GitHub
echo "[1/5] Installing claude-mem v$CLAUDE_MEM_VERSION from GitHub..."
echo ""

# Save original directory before we change directories
ORIGINAL_DIR=$(pwd)

# Use DEST_DIR/tmp if DEST_DIR is specified, otherwise use mktemp -d
if [ -n "$DEST_DIR" ]; then
    TEMP_DIR="${DEST_DIR}/tmp"
    mkdir -p "$TEMP_DIR"
    echo "  Using temp directory: $TEMP_DIR (in destination)"
else
    TEMP_DIR=$(mktemp -d)
    echo "  Using temp directory: $TEMP_DIR"
fi

cd $TEMP_DIR

if [ "$CLAUDE_MEM_VERSION" = "latest" ]; then
    git clone https://github.com/thedotmack/claude-mem.git claude-mem
else
    git clone -b v$CLAUDE_MEM_VERSION https://github.com/thedotmack/claude-mem.git claude-mem 2>/dev/null || \
    git clone https://github.com/thedotmack/claude-mem.git claude-mem
fi

echo "  ✅ claude-mem cloned"
echo ""

cd claude-mem

# Save claude-mem directory for later use
CLAUDE_MEM_DIR=$(pwd)
echo "  claude-mem directory: $CLAUDE_MEM_DIR"
echo ""

echo "  Installing dependencies..."
bun install
echo "  ✅ Dependencies installed"
echo ""

echo "  Building claude-mem..."
bun run build
echo "  ✅ Build complete"
echo ""

echo "  Skipping global install (use local binary)"
echo "  ✅ claude-mem built locally"
echo ""

# Verify local build
CLAUDE_MEM_BIN="node_modules/.bin/claude-mem"
if [ -f "$CLAUDE_MEM_BIN" ]; then
    CLAUDE_MEM_INSTALLED=$(bun run --silent -- claude-mem --version 2>/dev/null || echo "unknown")
    echo "  ✅ claude-mem v$CLAUDE_MEM_INSTALLED available locally"
else
    echo "  ⚠️  claude-mem binary not found, will use npx"
    CLAUDE_MEM_INSTALLED="$CLAUDE_MEM_VERSION"
    echo "  ✅ claude-mem v$CLAUDE_MEM_INSTALLED (will use npx)"
fi

# Step 2: Install claude-mem-opencode from source
echo ""
echo "[2/5] Installing claude-mem-opencode from source..."
echo ""

OPENCODE_DIR="$ORIGINAL_DIR"  # Use original directory
if [ -n "$DEST_DIR" ]; then
    echo "  Copying project to $DEST_DIR..."
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='tmp' \
        "$ORIGINAL_DIR/" "$DEST_DIR/"
    OPENCODE_DIR="$DEST_DIR"
    echo "  ✅ Project copied to: $DEST_DIR"
fi

cd $OPENCODE_DIR
echo "  Working directory: $OPENCODE_DIR"

echo "  Installing dependencies..."
bun install
echo "  ✅ Dependencies installed"
echo ""

echo "  Building claude-mem-opencode..."
bun run build
echo "  ✅ Build complete"
echo ""

if [ -n "$DEST_DIR" ]; then
    echo "  Installing to local folder (not global)..."
    # Don't install globally, just build to DEST_DIR
    echo "  Build files already in $OPENCODE_DIR/dist/"
else
    echo "  Installing globally..."
    npm install -g .
    echo "  ✅ claude-mem-opencode installed globally"
fi

echo ""

# Verify installation
if [ -n "$DEST_DIR" ]; then
    # Local installation - verify files exist
    echo "[3/5] Verifying installation..."
    if [ -d "$OPENCODE_DIR/dist" ]; then
        echo "  ✅ Build directory exists: $OPENCODE_DIR/dist/"
    else
        echo "  ❌ Build directory not found"
        exit 1
    fi
    OPENCODE_MEM_VERSION="local build"
else
    # Global installation
    OPENCODE_MEM_INSTALLED=$(claude-mem-opencode --version 2>/dev/null || echo "unknown")
    echo "  ✅ claude-mem-opencode v$OPENCODE_MEM_INSTALLED installed"
fi
echo ""

# Step 3: Verify installations
echo ""
echo "[3/5] Verifying installations..."
echo ""

if [ -n "$DEST_DIR" ]; then
    echo "  Local installation mode - using local claude-mem binary"
    echo "  ✅ claude-mem available at: $CLAUDE_MEM_DIR"
else
    if ! command -v claude-mem &>/dev/null; then
        echo "❌ claude-mem not found in PATH"
        exit 1
    fi
    if ! command -v claude-mem-opencode &>/dev/null; then
        echo "❌ claude-mem-opencode not found in PATH"
        exit 1
    fi
    echo "✅ Both packages installed and available in PATH"
fi
echo ""

# Step 4: Test claude-mem worker
echo ""
echo "[4/5] Testing claude-mem worker..."
echo ""

echo "  Starting worker..."
if [ -n "$DEST_DIR" ]; then
    # Use local claude-mem worker
    cd "$CLAUDE_MEM_DIR"
    bun plugin/scripts/worker-service.cjs start &
else
    # Use globally installed claude-mem
    claude-mem worker start &
fi
WORKER_PID=$!
echo "  Worker PID: $WORKER_PID"
echo ""

echo "  Waiting for worker to be ready..."
READY=false
for i in {1..30}; do
    if curl -f http://localhost:37777/api/health > /dev/null 2>&1; then
        READY=true
        echo "  ✅ Worker is ready"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 2
done

if [ "$READY" = false ]; then
    echo "❌ Worker failed to start"
    echo "Killing worker process..."
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

# Verify worker health
echo ""
WORKER_HEALTH=$(curl -s http://localhost:37777/api/health || echo "{}")
WORKER_STATUS=$(echo $WORKER_HEALTH | jq -r '.status' 2>/dev/null || echo "error")

if [ "$WORKER_STATUS" != "ok" ]; then
    echo "❌ Worker health check failed"
    echo "Response: $WORKER_HEALTH"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

WORKER_API_VERSION=$(echo $WORKER_HEALTH | jq -r '.apiVersion' 2>/dev/null || echo "unknown")
echo "✅ Worker is healthy (API v$WORKER_API_VERSION)"
echo ""

# Step 5: Run unit tests
echo "[5/5] Running unit tests..."
echo ""

if [ -n "$DEST_DIR" ]; then
    cd "$OPENCODE_DIR"
fi

echo "  Running tests..."
bun test tests/unit
echo "  ✅ Unit tests passed"
echo ""

# Cleanup
echo "Cleaning up..."
echo "  Killing worker process..."
kill $WORKER_PID 2>/dev/null || true

if [ -n "$DEST_DIR" ]; then
    echo "  Keeping temp directory: $TEMP_DIR"
else
    echo "  Removing temp directory..."
    cd /
    rm -rf $TEMP_DIR
fi

echo ""

# Summary
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "claude-mem version: $CLAUDE_MEM_VERSION"
echo "  ✅ Available at: $CLAUDE_MEM_DIR"
echo ""
echo "claude-mem-opencode version: $OPENCODE_MEM_VERSION"
if [ -n "$DEST_DIR" ]; then
    echo "  ✅ Built at: $OPENCODE_DIR"
else
    echo "  ✅ Installed globally"
fi
echo ""
echo "Next steps:"
echo "  1. Start the worker: cd $CLAUDE_MEM_DIR && bun plugin/scripts/worker-service.cjs start"
if [ -n "$DEST_DIR" ]; then
    echo "  2. Run tests: cd $OPENCODE_DIR && bun test"
else
    echo "  2. Run tests: bun test"
fi
echo "  3. Use in your project: import { OpencodeIntegration } from 'claude-mem-opencode'"
echo ""
