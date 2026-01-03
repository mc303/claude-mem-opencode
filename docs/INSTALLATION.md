# Installation Guide

## Important Notice

**The published claude-mem package (v3.9.16) does not currently support the HTTP worker API required by claude-mem-opencode.**

This integration is based on a development version of claude-mem with a worker API that is not yet available in the published npm package.

### Current Status

- ✅ Unit tests: Pass (54/54) - No external dependencies required
- ⏸️ Integration tests: Requires claude-mem worker (not available in published version)
- ⏸️ E2E tests: Requires claude-mem worker (not available in published version)
- ⏸️ Manual testing: Requires claude-mem worker (not available in published version)

### What Works Now

You can use the core components without a worker:

```typescript
import { PrivacyTagStripper } from 'claude-mem-opencode'
import { SessionMapper } from 'claude-mem-opencode'
import { ProjectNameExtractor } from 'claude-mem-opencode'

// Privacy tag stripping (no worker needed)
const stripper = new PrivacyTagStripper()
const clean = stripper.stripFromText('<private>secret</private> data')

// Session mapping (no worker needed)
const mapper = new SessionMapper()
mapper.mapOpenCodeToClaudeMem('session-123', 1)

// Project name extraction (no worker needed)
const extractor = new ProjectNameExtractor()
const project = extractor.extract('/home/user/my-project')
```

---

## Option 1: Global npm Installation

### Prerequisites

- Node.js >= 18.0.0
- claude-mem (when worker API becomes available)

### Install claude-mem (Optional)

```bash
# Only install when worker API becomes available
# npm install -g claude-mem
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

---

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
3. **Note**: Integration will initialize but memory features won't work without claude-mem worker

---

## Future Worker Setup (When Available)

Once claude-mem worker API is published, you'll be able to:

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

The worker will run on `http://localhost:37777` by default.

---

## Quick Start (Unit Tests Only)

For now, test the core functionality with unit tests:

```bash
npm run test:unit
```

All 54 unit tests pass and don't require external dependencies.

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
