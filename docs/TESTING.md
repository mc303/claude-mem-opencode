# Testing Guide

This guide provides step-by-step instructions for testing `claude-mem-opencode`.

## Prerequisites

- Node.js >= 18.0.0
- Bun >= 1.0.0
- Git
- claude-mem >= 8.5.4 (for integration/E2E tests)

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

### Prerequisite: Install and Start claude-mem Worker v8.5.4

**Important**: claude-mem v8.5.4 worker API is only available from GitHub releases, not npm.

```bash
# Clone and install claude-mem
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem
bun install
bun run build
bun link

# Verify installation
claude-mem --version
# Should output: 8.5.4

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
  "version": "8.5.4"
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

Test integration manually in a real development environment.

### Step 1: Install claude-mem v8.5.4 from GitHub

```bash
# Clone claude-mem repository
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem

# Build and install
bun install
bun run build
bun link
```

### Step 2: Install claude-mem-opencode

```bash
# Install from local repository
cd /path/to/claude-mem-opencode
bun install
bun link
```

### Step 3: Create Test Project

```bash
mkdir claude-mem-test
cd claude-mem-test
npm init -y
```

### Step 4: Create Test Script

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

### Step 5: Run Test Script

```bash
claude-mem worker start
node test-integration.js
```

### Step 6: Test with OpenCode

If you have OpenCode installed:

```typescript
// In your OpenCode project
import { ClaudeMemIntegration } from 'claude-mem-opencode'

const integration = new ClaudeMemIntegration()
await integration.initialize()

// All tool usage is now automatically captured!
// Memories will be searchable in future sessions.
```

### Step 7: Verify Memory Capture

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

- [ ] claude-mem v8.5.4 installed from GitHub
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

- [ ] claude-mem v8.5.4 installed from GitHub
- [ ] Worker starts successfully
- [ ] Integration initializes without errors
- [ ] Status check works
- [ ] Search functionality works
- [ ] Context injection works
- [ ] Shutdown completes cleanly

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

## 5. Testing from Source (Git Clone)

### Option A: Uninstall npm packages and install from source

If you want to test the latest development code instead of published packages:

### Step 1: Remove npm packages

```bash
# Uninstall claude-mem from npm
npm uninstall -g claude-mem
npm uninstall -g @thedotmack/claude-mem

# Uninstall claude-mem-opencode
npm uninstall -g claude-mem-opencode
```

### Step 2: Install claude-mem from source

```bash
# Clone claude-mem repository
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem

# Install dependencies
bun install

# Build project
bun run build

# Install globally via npm
npm install -g .
# OR use bun link for development
bun link

# Verify installation
claude-mem --version
# Should show: 8.5.4 or later
```

### Step 3: Install claude-mem-opencode from source

```bash
# Navigate to your claude-mem-opencode repository
cd /path/to/claude-mem-opencode

# Install dependencies
bun install

# Build project
bun run build

# Install globally via npm
npm install -g .
# OR use bun link for development
bun link

# Verify installation
claude-mem-opencode --version
# Should show: 0.0.1
```

### Step 4: Test installation

```bash
# Start claude-mem worker
claude-mem worker start

# Verify worker is running
curl http://localhost:37777/api/health

# Run unit tests
bun run test:unit

# Run integration tests
bun run test:integration

# Run E2E tests
bun run test:e2e

# Stop worker when done
claude-mem worker stop
```

### Step 5: Switch between npm and source versions

```bash
# To switch back to npm versions:
bun unlink claude-mem-opencode
bun unlink claude-mem  # if you used bun link
npm install -g claude-mem-opencode
npm install -g claude-mem

# To switch back to source versions:
cd /path/to/claude-mem-opencode
bun link

cd /path/to/claude-mem
bun link
```

---

### Option B: Install from source using bun link (for development)

For active development, use `bun link` instead of npm install:

```bash
# Terminal 1: claude-mem
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem
bun install
bun run build
bun link  # Creates symlink for development

# Terminal 2: claude-mem-opencode
cd /path/to/claude-mem-opencode
bun install
bun run build
bun link  # Creates symlink for development

# Now any changes to source are immediately available
# No need to reinstall after each change!
```

### Testing with bun link

When using `bun link`, you can make changes and test immediately:

```bash
# 1. Make code changes in either repository
vim src/integration/worker-client.ts  # Make changes

# 2. Rebuild (if needed)
bun run build

# 3. Run tests immediately
bun run test:unit

# 4. No npm reinstall required!
# bun link provides automatic symlink updates
```

---

## 6. Testing with OpenCode

### Prerequisites

1. OpenCode installed
2. claude-mem v8.5.4 installed and worker running
3. claude-mem-opencode built from source or installed

### Step 1: Add claude-mem-opencode to OpenCode

#### Method A: Copy bundle files (Recommended for testing)

```bash
# Navigate to your OpenCode project
cd /path/to/opencode

# Create skills directory if it doesn't exist
mkdir -p .opencode/skills

# Copy the bundle files
cp /path/to/claude-mem-opencode/dist/bundle/* .opencode/skills/

# Copy skill definition
cp /path/to/claude-mem-opencode/src/skill/SKILL.md .opencode/skills/

# Copy skill operations
cp -r /path/to/claude-mem-opencode/src/skill/operations .opencode/skills/
```

#### Method B: Add as npm package

```bash
# In your OpenCode project directory
cd /path/to/opencode

# Add claude-mem-opencode as dependency
# If you're using bun link for development:
npm link claude-mem-opencode

# OR if it's published:
npm install claude-mem-opencode
```

### Step 2: Create integration script in OpenCode

Create `.opencode/integrations/claude-mem.ts`:

```typescript
import { ClaudeMemIntegration } from 'claude-mem-opencode'

let integration: ClaudeMemIntegration | null = null

export async function initialize() {
  console.log('[CLAUDE_MEM_OPENCODE] Initializing...')
  
  try {
    integration = new ClaudeMemIntegration('http://localhost:37777')
    await integration.initialize()
    console.log('[CLAUDE_MEM_OPENCODE] ✅ Initialized successfully')
    
    const status = await integration.getStatus()
    console.log('[CLAUDE_MEM_OPENCODE] Status:', status)
  } catch (error) {
    console.error('[CLAUDE_MEM_OPENCODE] ❌ Initialization failed:', error)
  }
}

export async function shutdown() {
  if (integration) {
    console.log('[CLAUDE_MEM_OPENCODE] Shutting down...')
    await integration.shutdown()
    console.log('[CLAUDE_MEM_OPENCODE] ✅ Shutdown complete')
  }
}
```

### Step 3: Register integration in OpenCode

OpenCode automatically loads integrations from `.opencode/integrations/` directory. The integration script above will be loaded automatically.

### Step 4: Test integration in OpenCode

```bash
# 1. Start claude-mem worker (if not running)
claude-mem worker start

# 2. Verify worker is running
curl http://localhost:37777/api/health

# 3. Start OpenCode
# Navigate to your OpenCode project directory
cd /path/to/opencode-project

# Start OpenCode
opencode

# 4. Check OpenCode logs for integration
# Look for: [CLAUDE_MEM_OPENCODE] ✅ Initialized successfully
```

### Step 5: Verify memory capture

After starting OpenCode:

```bash
# 1. Use OpenCode to run some commands
# Example: ask OpenCode to list files, read code, etc.

# 2. Verify memories were created
# Use claude-mem CLI to check stored memories
claude-mem search "your query"

# 3. Check worker logs
claude-mem worker logs
# Look for session initialization, observation storage, etc.
```

### Step 6: Test memory retrieval

```bash
# 1. Start a new OpenCode session
# Close OpenCode and start it again

# 2. Ask OpenCode a question about previous work
# Example: "What did we work on yesterday?"

# 3. Check if context was injected
# The worker should have injected relevant memories into the new session
```

### Troubleshooting OpenCode integration

#### Integration not loading

```bash
# Check if integration file exists
ls -la .opencode/integrations/

# Check OpenCode logs
opencode --log-level=debug

# Verify integration is being called
# Look for [CLAUDE_MEM_OPENCODE] messages
```

#### Worker not accessible from OpenCode

```bash
# Check if worker is running
claude-mem worker status

# Check OpenCode can reach worker
curl http://localhost:37777/api/health

# Check firewall settings
# Ensure port 37777 is not blocked
```

#### Debug integration issues

```bash
# Enable verbose logging in OpenCode
opencode --log-level=debug

# Check worker logs
claude-mem worker logs

# Test integration separately
node .opencode/integrations/claude-mem.ts
```

### Testing with source code changes

When developing claude-mem-opencode:

```bash
# 1. Make code changes
cd /path/to/claude-mem-opencode
vim src/integration/worker-client.ts  # Make changes

# 2. Rebuild
bun run build

# 3. Restart OpenCode
# The bundle is already copied, just restart to reload

# 4. Test in OpenCode
# Your changes are now active!
```

### Complete OpenCode testing workflow

```bash
# Terminal 1: claude-mem worker
claude-mem worker start

# Terminal 2: claude-mem-opencode development
cd /path/to/claude-mem-opencode
bun run build  # After each change

# Terminal 3: OpenCode
cd /path/to/opencode-project
opencode  # Start using integration

# Terminal 4: Monitor
claude-mem worker logs  # Watch for activity
```

---

## 7. Switching Between Versions

### Scenario: Test different claude-mem versions

```bash
# Uninstall current version
npm uninstall -g claude-mem

# Install specific version from npm (when available)
npm install -g claude-mem@8.5.3

# OR install from source (git clone with specific tag)
git clone -b v8.5.3 https://github.com/thedotmack/claude-mem.git
cd claude-mem
bun install && bun run build && npm install -g .
```

### Scenario: Test different claude-mem-opencode versions

```bash
# Uninstall current version
npm uninstall -g claude-mem-opencode

# Install from specific commit/branch
git clone https://github.com/mc303/claude-mem-opencode.git
cd claude-mem-opencode
git checkout my-feature-branch
bun install && bun run build && bun link
```

---

## 8. Clean Installation Guide

### Remove all npm packages (clean slate)

```bash
# Uninstall claude-mem
npm uninstall -g claude-mem
npm uninstall -g @thedotmack/claude-mem

# Uninstall claude-mem-opencode
npm uninstall -g claude-mem-opencode

# Verify all packages are removed
npm list -g --depth=0 | grep -E "claude-mem|opencode"
# Should output nothing
```

### Install from source (clean installation)

```bash
# Install claude-mem from source
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem
bun install
bun run build
npm install -g .
# OR
bun link

# Verify claude-mem installation
claude-mem --version
# Should show: 8.5.4 or later

# Install claude-mem-opencode from source
cd /path/to/claude-mem-opencode
bun install
bun run build
npm install -g .
# OR
bun link

# Verify claude-mem-opencode installation
claude-mem-opencode --version
```

### Testing source installation workflow

```bash
# 1. Start with clean environment
npm uninstall -g claude-mem claude-mem-opencode
rm -rf /path/to/claude-mem
rm -rf /path/to/claude-mem-opencode

# 2. Install from source
git clone https://github.com/thedotmack/claude-mem.git
git clone https://github.com/mc303/claude-mem-opencode.git

# Install claude-mem
cd claude-mem
bun install && bun run build && npm install -g .

# Install claude-mem-opencode
cd ../claude-mem-opencode
bun install && bun run build && npm install -g .

# 3. Test everything
claude-mem worker start
bun run test:unit
bun run test:integration
claude-mem worker stop

# 4. Clean up
npm uninstall -g claude-mem claude-mem-opencode
```

---

## 9. Development Workflow

### Using bun link for rapid iteration

```bash
# Terminal 1: claude-mem (worker)
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem
bun install && bun run build && bun link

# Terminal 2: claude-mem-opencode (integration)
cd /path/to/claude-mem-opencode
bun install && bun run build && bun link

# Terminal 3: OpenCode project (testing)
cd /path/to/opencode-project
npm link claude-mem-opencode

# Terminal 4: Test runner
# Now run tests in terminal 2
bun run test:unit
bun run test:integration
```

### Rapid iteration workflow

```bash
# 1. Make code changes
cd /path/to/claude-mem-opencode
vim src/integration/worker-client.ts

# 2. Rebuild (if needed)
bun run build

# 3. Test immediately (no reinstall needed with bun link!)
bun run test:unit

# 4. Repeat
# Changes are instantly available!
```

---

## 8. Clean Installation Guide

### Remove all npm packages (clean slate)

```bash
# Use the cleanup script
bash scripts/cleanup.sh

# Or manually:
npm uninstall -g claude-mem
npm uninstall -g @thedotmack/claude-mem
npm uninstall -g claude-mem-opencode

# Verify all packages are removed
npm list -g --depth=0 | grep -E "claude-mem|opencode"
# Should output nothing
```

### Install from source (clean installation)

```bash
# Use the install-from-source script
bash scripts/install-from-source.sh

# Or manually:
# Install claude-mem from source
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem
bun install
bun run build
npm install -g .

# Install claude-mem-opencode from source
cd /path/to/claude-mem-opencode
bun install
bun run build
npm install -g .

# Verify installations
claude-mem --version
# Should show: 8.5.4 or later

claude-mem-opencode --version
# Should show: 0.0.1
```

### Testing source installation workflow

```bash
# 1. Start with clean environment
bash scripts/cleanup.sh

# 2. Install from source
bash scripts/install-from-source.sh
```

The `install-from-source.sh` script handles:
- Cloning claude-mem from GitHub
- Building and installing both packages
- Verifying installations
- Testing worker startup
- Running unit tests

---

## Additional Resources

- [Installation Guide](INSTALLATION.md)
- [API Contract](API_CONTRACT.md)
- [README](../README.md)
- [OpenCode Documentation](https://github.com/sst/opencode)
- [OpenCode Documentation](https://github.com/sst/opencode)
