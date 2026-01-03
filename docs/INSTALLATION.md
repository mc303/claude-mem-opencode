# Installation Guide

## Option 1: Global npm Installation

### Prerequisites

- Node.js >= 18.0.0
- claude-mem (optional, required for memory features)

### Installation

```bash
npm install -g opencode-mem
```

Or with automated script:
```bash
bash scripts/install.sh
```

### Verification

```bash
opencode-mem --version
opencode-mem check-compatibility
```

## Option 2: Bundle for OpenCode

### Build Bundle

```bash
npm install
npm run bundle
```

### Integrate with OpenCode

1. Copy `dist/bundle/*` to your OpenCode project
2. Import in your code:
   ```typescript
   import { ClaudeMemIntegration } from './opencode-mem.js'
   ```
3. Initialize on startup:
   ```typescript
   const integration = new ClaudeMemIntegration()
   await integration.initialize()
   ```

## Starting claude-mem Worker

```bash
# If installed globally
claude-mem worker start

# Check status
claude-mem worker status

# View logs
claude-mem worker logs

# Stop worker
claude-mem worker stop
```

## Troubleshooting

### Worker not responding

1. Check if worker is running: `curl http://localhost:37777/api/health`
2. Check worker logs: `claude-mem worker logs`
3. Restart worker: `claude-mem worker restart`

### Compatibility issues

```bash
# Check compatibility
opencode-mem check-compatibility

# Test specific claude-mem version
bash scripts/test-against-claude-mem.sh 2.3.1
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

# Or configure different port (see claude-mem docs)
```

### Memory not being captured

1. Verify worker is running: `opencode-mem status`
2. Check event listeners are initialized in OpenCode
3. Check OpenCode console for errors
4. Verify session is not marked as private

## Installation Verification Checklist

- [ ] claude-mem installed: `claude-mem --version`
- [ ] opencode-mem installed: `opencode-mem --version`
- [ ] Worker running: `curl http://localhost:37777/api/health`
- [ ] Compatibility check: `opencode-mem check-compatibility`
- [ ] OpenCode integration initialized
- [ ] Test session created and memory captured
- [ ] Search functionality working

## Next Steps

After installation:

1. **For Users**: Start OpenCode and create a session. Memory will be captured automatically.
2. **For Developers**: Integrate opencode-mem into your OpenCode fork using the bundle method.
3. **Testing**: Run `opencode-mem check-compatibility` to verify everything works.

## Support

- Documentation: [https://github.com/your-org/opencode-mem](https://github.com/your-org/opencode-mem)
- Issues: [https://github.com/your-org/opencode-mem/issues](https://github.com/your-org/opencode-mem/issues)
- API Contract: [API_CONTRACT.md](docs/API_CONTRACT.md)
