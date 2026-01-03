# Testing Guide

This guide provides step-by-step instructions for testing `claude-mem-opencode`.

## ⚠️ Important Notice

**Integration and E2E tests are currently disabled** because they require a claude-mem worker API that is not yet available in the published `claude-mem` npm package (v3.9.16).

### What You Can Test Now:

- ✅ **Unit Tests**: All 54 tests pass, no external dependencies
- ⏸️ **Integration Tests**: Require claude-mem worker (not yet available)
- ⏸️ **E2E Tests**: Require claude-mem worker (not yet available)
- ⏸️ **Manual Testing**: Requires claude-mem worker (not yet available)

### Available Functionality (No Worker Required):

You can use these core components without a worker:

```typescript
import { PrivacyTagStripper } from 'claude-mem-opencode'
import { SessionMapper } from 'claude-mem-opencode'
import { ProjectNameExtractor } from 'claude-mem-opencode'
```

---

## Prerequisites

- Node.js >= 18.0.0
- Bun >= 1.0.0
- Git

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

# Test worker client (uses mock server)
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

## 2. Integration Tests (Currently Disabled)

Integration tests verify API contracts with a real claude-mem worker.

### Current Status:

```
⏸️ SKIPPED - claude-mem worker API not yet available in published package
```

### Why Disabled:

The published `claude-mem` package (v3.9.16) uses a different architecture than expected by this integration:

**Published claude-mem (v3.9.16) commands:**
- `install` - Install Claude Code hooks
- `status` - Check installation status
- `doctor` - Run diagnostics
- `logs` - View operation logs
- `load-context` - Load memories for session
- `store-memory`, `store-overview` - SDK commands
- `changelog`, `generate-title` - Content generation
- `trash`, `restore` - File management

**Expected by integration (not yet available):**
- `worker start` - Start HTTP worker on port 37777
- HTTP API endpoints: `/api/health`, `/api/sessions/init`, etc.

### Future Implementation:

When claude-mem worker API becomes available:

```bash
# Prerequisites
npm install -g claude-mem
claude-mem worker start
curl http://localhost:37777/api/health

# Run integration tests
bun run test:integration
```

### What will be tested (when worker available):

- ✅ API contract verification
- ✅ Health check endpoint
- ✅ Session initialization
- ✅ Observation creation
- ✅ Session completion
- ✅ Memory search
- ✅ Context injection

---

## 3. E2E Tests (Currently Disabled)

E2E tests verify complete user workflows.

### Current Status:

```
⏸️ SKIPPED - Requires claude-mem worker (not yet available)
```

### Future Implementation:

When claude-mem worker API becomes available:

```bash
claude-mem worker start
bun run test:e2e
claude-mem worker stop
```

### What will be tested (when worker available):

- ✅ Session lifecycle (init → observe → complete)
- ✅ Memory capture from tool usage
- ✅ Memory retrieval and compression
- ✅ Privacy protection
- ✅ Tool capture (bash, search, etc.)

---

## 4. Manual Testing (Currently Disabled)

Test's integration manually in a real development environment.

### Current Status:

```
⏸️ LIMITED - Core components work, but worker-dependent features unavailable
```

### What You Can Test Now:

#### Privacy Tag Stripping:

```bash
# Create test script: test-privacy.js
import { PrivacyTagStripper } from 'claude-mem-opencode'

const stripper = new PrivacyTagStripper()
const text = 'My password is <private>secret123</private> and key is <private>abc</private>'
const clean = stripper.stripFromText(text)

console.log('Original:', text)
console.log('Cleaned:', clean)
# Output: My password is [private content removed] and key is [private content removed]
```

#### Session Mapping:

```bash
# Create test script: test-mapper.js
import { SessionMapper } from 'claude-mem-opencode'

const mapper = new SessionMapper()
mapper.mapOpenCodeToClaudeMem('session-123', 456)
const id = mapper.getClaudeMemSessionId('session-123')

console.log('Mapped session ID:', id)
# Output: 456
```

#### Project Name Extraction:

```bash
# Create test script: test-extractor.js
import { ProjectNameExtractor } from 'claude-mem-opencode'

const extractor = new ProjectNameExtractor()
const project = extractor.extract('/home/user/my-app/src')

console.log('Project name:', project)
# Output: src
```

### What You Cannot Test Yet (Requires Worker):

- ❌ Memory storage and retrieval
- ❌ Search across sessions
- ❌ Context injection
- ❌ Automatic tool capture
- ❌ Session lifecycle management

### Future Manual Testing (When Worker Available):

Once claude-mem worker API is published, you'll be able to:

```bash
# Install both packages
npm install -g claude-mem claude-mem-opencode

# Start worker
claude-mem worker start

# Create test project
mkdir claude-mem-test && cd claude-mem-test

# Create test script
cat > test-integration.js << 'EOF'
import { ClaudeMemIntegration } from 'claude-mem-opencode'

async function test() {
  console.log('Initializing claude-mem-opencode...')
  const integration = new ClaudeMemIntegration('http://localhost:37777')

  await integration.initialize()
  console.log('✅ Integration initialized')

  const status = await integration.getStatus()
  console.log('Status:', status)

  const results = await integration.searchMemory('test', { limit: 5 })
  console.log('Search results:', results)

  const context = await integration.getProjectContext()
  console.log('Project context:', context)

  await integration.shutdown()
  console.log('✅ Integration shut down')
}

test().catch(console.error)
EOF

# Run test
node test-integration.js

# Stop worker
claude-mem worker stop
```

---

## Test Checklist

### Unit Tests

- [ ] All 54 unit tests pass
- [ ] No TypeScript compilation errors
- [ ] Build completes successfully
- [ ] Bundle generated at `dist/bundle/opencode-mem.js`

### Integration Tests (When Worker Available)

- [ ] claude-mem worker installed and running
- [ ] Worker health check returns OK
- [ ] Session initialization works
- [ ] Observations are created
- [ ] Sessions are completed
- [ ] Search returns results
- [ ] Context injection works

### E2E Tests (When Worker Available)

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

### Integration/E2E tests fail (When Worker Available)

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

# Kill's process
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

### Worker won't start (When Available)

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

### Test with large datasets (When Worker Available):

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

### Stress test memory capture (When Worker Available):

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

1. Document issue with reproduction steps
2. Include test output
3. Include environment details:
   - OS: `uname -a`
   - Node version: `node --version`
   - Bun version: `bun --version`
   - claude-mem version: `claude-mem --version` (when available)
4. Create issue at: https://github.com/mc303/claude-mem-opencode/issues

---

## Additional Resources

- [Installation Guide](INSTALLATION.md)
- [API Contract](API_CONTRACT.md)
- [README](../README.md)
- [Integration Documentation](../src/integration/API-REFERENCE.md)
