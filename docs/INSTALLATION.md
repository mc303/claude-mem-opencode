# Installation Guide

## Prerequisites

- Node.js >= 18.0.0
- Bun >= 1.0.0
- claude-mem >= 8.5.4 (for full functionality)

## Option 1: Install claude-mem from GitHub (Required for Worker API)

**Important**: The published npm package of claude-mem (v3.9.16) does not include the worker API required by this integration. You must install claude-mem v8.5.4 from GitHub releases.

### Install claude-mem v8.5.4

```bash
# Clone claude-mem repository
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem

# Install dependencies
bun install

# Build project
bun run build

# Install globally
bun link
# OR
npm install -g .
```

### Verify claude-mem installation

```bash
claude-mem --version
# Should show: 8.5.4
```

### Start claude-mem worker

```bash
# Start worker
claude-mem worker start

# Check status
claude-mem worker status

# Verify worker is responding
curl http://localhost:37777/api/health
```

Expected health check response:
```json
{
  "status": "ok",
  "version": "8.5.4"
}
```

## Option 2: Install claude-mem-opencode

### Global npm installation (when published)

```bash
npm install -g claude-mem-opencode
```

Or with automated script:
```bash
bash scripts/install.sh
```

### Local installation for development

```bash
cd /path/to/claude-mem-opencode
bun install
bun run build
bun link
```

### Verification

```bash
claude-mem-opencode --version
```

---

## Option 3: Bundle for OpenCode

### Build bundle

```bash
cd /path/to/claude-mem-opencode
npm install
npm run bundle
```

### Integrate with OpenCode

1. Copy `dist/bundle/*` to your OpenCode project
2. Import in your code:
   ```typescript
   import { ClaudeMemIntegration } from './claude-mem-opencode.js'
   ```
3. Initialize on startup:
   ```typescript
   const integration = new ClaudeMemIntegration()
   await integration.initialize()
   ```

---

## Quick Start

Once claude-mem v8.5.4 is installed and worker is running:

```bash
# 1. Start claude-mem worker
claude-mem worker start

# 2. Verify worker is running
curl http://localhost:37777/api/health

# 3. Use in your code
import { ClaudeMemIntegration } from 'claude-mem-opencode'

const integration = new ClaudeMemIntegration()
await integration.initialize()

// Memory is now being captured automatically!

// Search memories
const results = await integration.searchMemory("authentication")

// Get project context
const context = await integration.getProjectContext()

// Get status
const status = await integration.getStatus()
console.log(status)
```

---

## Testing the Installation

### Run unit tests (no worker required)

```bash
bun run test:unit
```

Expected output:
```
54 pass
0 fail
Ran 54 tests across 4 files
```

### Run integration tests (requires worker)

```bash
# Make sure worker is running
claude-mem worker start

# Run integration tests
bun run test:integration

# Stop worker when done
claude-mem worker stop
```

### Run E2E tests (requires worker)

```bash
# Make sure worker is running
claude-mem worker start

# Run E2E tests
bun run test:e2e

# Stop worker when done
claude-mem worker stop
```

Verify installation:
```bash
claude-mem --version
```

### Install claude-mem-opencode

```bash
npm install -g claude-mem-opencode
```

Or with automated script:
```bash
bash scripts/install.sh
```

### Verification

```bash
claude-mem-opencode --version
```

## Option 2: Bundle for OpenCode

### Prerequisites

```bash
# Install dependencies
npm install
```

### Build Bundle

```bash
npm run bundle
```

### Integrate with OpenCode

1. Copy `dist/bundle/*` to your OpenCode project
2. Import in your code:
   ```typescript
   import { ClaudeMemIntegration } from './claude-mem-opencode.js'
   ```
3. Initialize on startup:
   ```typescript
   const integration = new ClaudeMemIntegration()
   await integration.initialize()
   ```

## Starting claude-mem Worker

Before using claude-mem-opencode, you must start the claude-mem worker:

```bash
# Start worker
claude-mem worker start

# Check status
claude-mem worker status

# View logs
claude-mem worker logs

# Stop worker
claude-mem worker stop
```

The worker runs on `http://localhost:37777` by default.

## Quick Start

Once installed:

1. **Start claude-mem worker:**
   ```bash
   claude-mem worker start
   ```

2. **Use in your code:**
   ```typescript
   import { ClaudeMemIntegration } from 'claude-mem-opencode'

   const integration = new ClaudeMemIntegration()
   await integration.initialize()

   // Memory is now being captured automatically!

   // Search memories
   const results = await integration.searchMemory("authentication")

   // Get project context
   const context = await integration.getProjectContext()

   // Get status
   const status = await integration.getStatus()
   console.log(status)
   ```

## Troubleshooting

### Worker not responding

1. Check if worker is running: `curl http://localhost:37777/api/health`
2. Check worker logs: `claude-mem worker logs`
3. Restart worker: `claude-mem worker restart`

### Installation issues

```bash
# Check Node version (must be >= 18.0.0)
node --version

# Check claude-mem installation
claude-mem --version

# Check claude-mem-opencode installation
claude-mem-opencode --version

# Test worker connection
curl http://localhost:37777/api/health
```

### Port already in use

The claude-mem worker uses port 37777 by default. If it's already in use:

```bash
# Check what's using the port
lsof -i :37777  # macOS/Linux
netstat -ano | findstr :37777  # Windows

# Kill the process
kill <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Memory not being captured

1. Verify worker is running: `claude-mem worker status`
2. Check the integration is initialized in your code
3. Check console for errors
4. Verify session is not marked as private

## Installation Verification Checklist

- [ ] Node.js >= 18.0.0 installed: `node --version`
- [ ] claude-mem installed: `claude-mem --version`
- [ ] claude-mem-opencode installed: `claude-mem-opencode --version`
- [ ] Worker running: `curl http://localhost:37777/api/health`
- [ ] Integration initialized in code
- [ ] Test session created and memory captured
- [ ] Search functionality working

## Next Steps

After installation:

1. **For Users**: Start claude-mem worker and integrate with your code using the examples above.
2. **For Developers**: Integrate claude-mem-opencode into your OpenCode fork using the bundle method.
3. **Testing**: Run tests to verify everything works:
   ```bash
   npm test
   ```

## Support

- Documentation: [https://github.com/mc303/claude-mem-opencode](https://github.com/mc303/claude-mem-opencode)
- Issues: [https://github.com/mc303/claude-mem-opencode/issues](https://github.com/mc303/claude-mem-opencode/issues)
- claude-mem: [https://github.com/thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- API Contract: [API_CONTRACT.md](API_CONTRACT.md)
