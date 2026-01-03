# Testing Guide

This guide provides step-by-step instructions for testing `claude-mem-opencode`.

## Prerequisites

- Node.js >= 18.0.0
- Bun >= 1.0.0
- Git

## Test Categories

1. **Unit Tests** - Test individual components (no external dependencies)
2. **Integration Tests** - Test API contracts (requires claude-mem worker)
3. **E2E Tests** - Test full workflows (requires claude-mem worker)
4. **Manual Testing** - Interactive testing with OpenCode

---

## 1. Unit Tests

Unit tests run independently and don't require any external services.

### Run all unit tests:

```bash
bun run test:unit
```

Expected output:
```
54 pass
0 fail
Ran 54 tests across 4 files
```

### Run specific unit test file:

```bash
# Test privacy tag stripping
bun test tests/unit/privacy.test.ts

# Test session mapping
bun test tests/unit/session-mapper.test.ts

# Test worker client
bun test tests/unit/worker-client.test.ts

# Test project name extraction
bun test tests/unit/utils.test.ts
```

### What's being tested:

- ✅ `PrivacyTagStripper` - Privacy tag removal from text and JSON
- ✅ `SessionMapper` - Mapping between OpenCode and claude-mem sessions
- ✅ `WorkerClient` - HTTP client for claude-mem API (with mock server)
- ✅ `ProjectNameExtractor` - Extracting project names from paths

---

## 2. Integration Tests

Integration tests verify API contracts with a real claude-mem worker.

### Prerequisite: Install and Start claude-mem Worker

```bash
# Install claude-mem globally
npm install -g claude-mem

# Verify installation
claude-mem --version

# Start worker
claude-mem worker start

# Check worker status
claude-mem worker status

# Verify worker is responding
curl http://localhost:37777/api/health
```

Expected health check response:
```json
{
  "status": "ok",
  "version": "x.x.x",
  "apiVersion": "x.x"
}
```

### Run integration tests:

```bash
bun run test:integration
```

### What's being tested:

- ✅ API contract verification
- ✅ Health check endpoint
- ✅ Session initialization
- ✅ Observation creation
- ✅ Session completion
- ✅ Memory search
- ✅ Context injection

### Stop worker after testing:

```bash
claude-mem worker stop
```

---

## 3. E2E (End-to-End) Tests

E2E tests verify complete user workflows.

### Prerequisite: Start claude-mem Worker

```bash
claude-mem worker start
```

### Run E2E tests:

```bash
bun run test:e2e
```

### What's being tested:

- ✅ Session lifecycle (init → observe → complete)
- ✅ Memory capture from tool usage
- ✅ Memory retrieval and compression
- ✅ Privacy protection
- ✅ Tool capture (bash, search, etc.)

### Stop worker after testing:

```bash
claude-mem worker stop
```

---

## 4. Manual Testing

Test the integration manually in a real development environment.

### Step 1: Install claude-mem-opencode

```bash
# Install from npm (when published)
npm install -g claude-mem-opencode

# Or install locally from this repository
cd /path/to/claude-mem-opencode
npm link
```

### Step 2: Create Test Project

```bash
mkdir claude-mem-test
cd claude-mem-test
npm init -y
```

### Step 3: Create Test Script

Create `test-integration.js`:

```javascript
import { ClaudeMemIntegration } from 'claude-mem-opencode'

async function test() {
  console.log('Initializing claude-mem-opencode...')

  const integration = new ClaudeMemIntegration('http://localhost:37777')

  // Initialize integration
  await integration.initialize()
  console.log('✅ Integration initialized')

  // Get status
  const status = await integration.getStatus()
  console.log('Status:', status)

  // Search memories
  const results = await integration.searchMemory('test', { limit: 5 })
  console.log('Search results:', results)

  // Get project context
  const context = await integration.getProjectContext()
  console.log('Project context:', context)

  // Shutdown
  await integration.shutdown()
  console.log('✅ Integration shut down')
}

test().catch(console.error)
```

### Step 4: Run Test Script

```bash
claude-mem worker start
node test-integration.js
```

### Step 5: Test with OpenCode

If you have OpenCode installed:

```typescript
// In your OpenCode project
import { ClaudeMemIntegration } from 'claude-mem-opencode'

const integration = new ClaudeMemIntegration()
await integration.initialize()

// All tool usage is now automatically captured!
// Memories will be searchable in future sessions.
```

### Step 6: Verify Memory Capture

```bash
# Use claude-mem CLI to verify memories
claude-mem search "your query"
claude-mem memories list
```

---

## Test Checklist

### Unit Tests

- [ ] All 54 unit tests pass
- [ ] No TypeScript compilation errors
- [ ] Build completes successfully
- [ ] Bundle generated at `dist/bundle/opencode-mem.js`

### Integration Tests

- [ ] claude-mem worker installed and running
- [ ] Worker health check returns OK
- [ ] Session initialization works
- [ ] Observations are created
- [ ] Sessions are completed
- [ ] Search returns results
- [ ] Context injection works

### E2E Tests

- [ ] Session lifecycle completes successfully
- [ ] Tools are captured correctly
- [ ] Privacy tags are stripped
- [ ] Memories are compressed
- [ ] Search retrieves correct memories

### Manual Testing

- [ ] Package installs correctly
- [ ] Integration initializes without errors
- [ ] Status check works
- [ ] Search functionality works
- [ ] Context injection works
- [ ] Shutdown completes cleanly

---

## Build & Bundle Testing

### Verify TypeScript compilation:

```bash
npm run build:lib
```

Expected: No errors, type definitions generated in `dist/`

### Verify bundle generation:

```bash
npm run build:bundle
```

Expected: Bundle generated at `dist/bundle/opencode-mem.js`

### Verify full build:

```bash
npm run build
```

Expected: Both library and bundle build successfully

---

## Troubleshooting

### Unit tests fail

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Run tests again
bun run test:unit
```

### Integration/E2E tests fail

```bash
# Check if worker is running
claude-mem worker status

# Check worker logs
claude-mem worker logs

# Restart worker
claude-mem worker restart

# Verify worker is responding
curl http://localhost:37777/api/health
```

### Port already in use

```bash
# Check what's using port 37777
lsof -i :37777  # macOS/Linux
netstat -ano | findstr :37777  # Windows

# Kill the process
kill <PID>
```

### TypeScript compilation errors

```bash
# Clean build artifacts
rm -rf dist/

# Rebuild
npm run build

# Check tsconfig.json
cat tsconfig.json
```

### Worker won't start

```bash
# Check claude-mem version
claude-mem --version

# Reinstall claude-mem
npm uninstall -g claude-mem
npm install -g claude-mem

# Try starting worker with verbose output
claude-mem worker start --verbose
```

---

## Continuous Testing

### Watch mode for unit tests:

```bash
bun test tests/unit --watch
```

### Run all tests on every file change:

```bash
bun test --watch
```

---

## Performance Testing

### Test with large datasets:

```javascript
// Create test script
import { ClaudeMemIntegration } from 'claude-mem-opencode'

const integration = new ClaudeMemIntegration()
await integration.initialize()

// Test search performance
const start = Date.now()
const results = await integration.searchMemory('test', { limit: 100 })
const duration = Date.now() - start

console.log(`Search took ${duration}ms`)
console.log(`Found ${results.length} results`)
```

### Stress test memory capture:

```bash
# Run multiple sessions
for i in {1..10}; do
  echo "Creating session $i"
  # Your test script here
done
```

---

## Test Coverage

To see test coverage (if configured):

```bash
bun test --coverage
```

---

## Reporting Issues

If you find a bug:

1. Document the issue with reproduction steps
2. Include test output
3. Include environment details:
   - OS: `uname -a`
   - Node version: `node --version`
   - Bun version: `bun --version`
   - claude-mem version: `claude-mem --version`
4. Create issue at: https://github.com/mc303/claude-mem-opencode/issues

---

## Additional Resources

- [Installation Guide](docs/INSTALLATION.md)
- [API Contract](docs/API_CONTRACT.md)
- [README](README.md)
- [Integration Documentation](src/integration/API-REFERENCE.md)
