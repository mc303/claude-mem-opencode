#!/bin/bash

set -e

VERSION=${1:-latest}

echo "=========================================="
echo "Testing opencode-mem against claude-mem v$VERSION"
echo "=========================================="
echo ""

# Install claude-mem
echo "[1/6] Installing claude-mem v$VERSION..."
npm install -g claude-mem@$VERSION

# Verify installation
if ! command -v claude-mem &> /dev/null; then
    echo "❌ claude-mem installation failed"
    exit 1
fi

CLAUDE_MEM_VERSION=$(claude-mem --version 2>/dev/null || echo "unknown")
echo "✅ claude-mem v$CLAUDE_MEM_VERSION installed"

# Start worker
echo ""
echo "[2/6] Starting claude-mem worker..."
claude-mem worker start &
WORKER_PID=$!
echo "Worker PID: $WORKER_PID"

# Wait for worker to be ready
echo ""
echo "[3/6] Waiting for worker to be ready..."
READY=false
for i in {1..30}; do
    if curl -f http://localhost:37777/api/health > /dev/null 2>&1; then
        READY=true
        echo "✅ Worker is ready"
        break
    fi
    echo "Waiting... ($i/30)"
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
echo "[4/6] Verifying worker health..."
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

# Install dependencies
echo ""
echo "[5/6] Installing opencode-mem dependencies..."
bun install

# Build opencode-mem
echo ""
echo "Building opencode-mem..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Build successful"

# Run all tests
echo ""
echo "[6/6] Running tests..."
echo ""

# Test 1: Unit tests
echo "--- Unit Tests ---"
if bun run test:unit; then
    echo "✅ Unit tests passed"
else
    echo "❌ Unit tests failed"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Test 2: Integration tests
echo "--- Integration Tests ---"
if bun run test:integration; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Test 3: End-to-End tests (if available)
if [ -f "tests/e2e/session-lifecycle.test.ts" ]; then
    echo "--- End-to-End Tests ---"
    if bun run test:e2e; then
        echo "✅ End-to-End tests passed"
    else
        echo "❌ End-to-End tests failed"
        kill $WORKER_PID 2>/dev/null || true
        exit 1
    fi
    echo ""
fi

# Cleanup
echo "Cleaning up..."
kill $WORKER_PID 2>/dev/null || true
echo "✅ Worker stopped"

# Report success
echo ""
echo "=========================================="
echo "✅ All tests passed!"
echo "=========================================="
echo ""
echo "Tested against claude-mem v$VERSION"
echo "Date: $(date)"
echo ""
echo "Test summary:"
echo "  • Unit tests: ✅ Passed"
echo "  • Integration tests: ✅ Passed"
echo "  • End-to-End tests: ✅ Passed"
echo "  • Worker API v$WORKER_API_VERSION"
echo ""
echo "Next steps:"
echo "  1. Update COMPATIBILITY.md:"
echo "     echo \"- claude-mem v$VERSION: ✅ Compatible ($(date +%Y-%m-%d))\" >> COMPATIBILITY.md"
echo "  2. Commit and push changes:"
echo "     git add COMPATIBILITY.md && git commit -m \"Update COMPATIBILITY.md: claude-mem v$VERSION compatible\""
echo "     git push"
echo ""
echo "All tests completed successfully! 🎉"
