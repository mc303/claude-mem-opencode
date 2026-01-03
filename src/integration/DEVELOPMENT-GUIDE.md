# Development Guide

This guide explains how to adapt and develop the OpenCode integration for claude-mem.

## Prerequisites

1. **OpenCode Source Code**: Clone to study actual APIs
   ```bash
   git clone https://github.com/sst/opencode.git
   cd opencode
   ```

2. **OpenCode Running**: Have a working OpenCode instance
   ```bash
   opencode --help
   ```

3. **claude-mem Worker**: Ensure worker is accessible
   ```bash
   curl http://localhost:37777/api/health
   ```

## Understanding the Architecture

### Current State (Template)

The integration currently uses **template implementations** that log events but don't actually connect to OpenCode's Bus system:

```typescript
// event-listeners.ts (line ~24)
async initialize(): Promise<void> {
  console.log('[EVENT_LISTENERS] OpenCode event listeners initialized')
  console.log('[EVENT_LISTENERS] NOTE: This is a template - needs adaptation to OpenCode APIs')
}
```

### Required Adaptations

You need to adapt the following components to work with OpenCode's actual APIs:

#### 1. Bus Subscription (event-listeners.ts)

**Current (Template)**:
```typescript
async initialize(): Promise<void> {
  console.log('[EVENT_LISTENERS] OpenCode event listeners initialized')
}
```

**Required (Real Implementation)**:
```typescript
import { Bus } from '@/bus'  // From OpenCode
import { Session, MessageV2 } from '@/session'  // From OpenCode

async initialize(): Promise<void> {
  // Subscribe to session creation
  Bus.subscribe(Session.Event.Created, this.handleSessionCreated.bind(this))

  // Subscribe to tool usage
  Bus.subscribe(MessageV2.Event.PartUpdated, this.handleMessagePartUpdated.bind(this))

  // Subscribe to session updates
  Bus.subscribe(Session.Event.Updated, this.handleSessionUpdated.bind(this))
}
```

#### 2. Session Access (event-listeners.ts)

**Current (Template)**:
```typescript
private async handleSessionCreated(sessionId: string, directory: string, title?: string): Promise<void> {
  // Placeholder - needs real Session.Info access
}
```

**Required (Real Implementation)**:
```typescript
private async handleSessionCreated(event: {
  type: string
  properties: { info: Session.Info }  // Real OpenCode type
}): Promise<void> {
  const { info } = event.properties
  const project = this.projectNameExtractor.extract(info.directory)
  const openCodeSessionId = info.id

  // ... rest of implementation
}
```

#### 3. Tool Usage Capture (event-listeners.ts)

**Current (Template)**:
```typescript
async handleToolUsage(sessionId: string, toolName: string, toolInput: any, toolOutput: string): Promise<void> {
  // Placeholder - needs real MessageV2.Part access
}
```

**Required (Real Implementation)**:
```typescript
private async handleMessagePartUpdated(event: {
  type: string
  properties: { part: MessageV2.Part }  // Real OpenCode type
}): Promise<void> {
  const { part } = event.properties

  // Only process tool calls
  if (part.type !== 'tool_call') return

  const toolName = part.name
  const toolInput = part.args
  const toolOutput = part.result

  // ... rest of implementation
}
```

#### 4. System Prompt Injection (context-injector.ts)

**Current (Template)**:
```typescript
async injectContext(project: string): Promise<string> {
  const context = await this.workerClient.getProjectContext(project)
  // Returns context string - needs to actually inject into OpenCode
  return context
}
```

**Required (Real Implementation)**:
```typescript
// Need to investigate how OpenCode allows system prompt modification
// Options to explore:

// Option 1: OpenCode Session API
// Check if Session.create() accepts system parameter

// Option 2: OpenCode Config API
// Check if system prompt can be configured per session

// Option 3: OpenCode Bus events
// Check if there's an event for system prompt modification

// This requires studying OpenCode source code
```

## Development Workflow

### Phase 1: API Investigation

```bash
# 1. Clone OpenCode source
cd ~/dev
git clone https://github.com/sst/opencode.git
cd opencode

# 2. Search for relevant APIs
grep -r "Bus.subscribe" packages/opencode/src/
grep -r "Session.Event" packages/opencode/src/
grep -r "MessageV2.Event" packages/opencode/src/

# 3. Study Session.Info structure
grep -r "interface.*Info" packages/opencode/src/session/ -A 20

# 4. Study MessageV2.Part structure
grep -r "interface.*Part" packages/opencode/src/session/ -A 20
```

### Phase 2: Adapt Event Listeners

1. **Update imports** in `event-listeners.ts`:
   ```typescript
   import { Bus } from '@/bus'
   import { Session, MessageV2 } from '@/session'
   ```

2. **Replace template code** with real implementations:
   - Use `Bus.subscribe()` instead of console.log
   - Access real `Session.Info` structure
   - Access real `MessageV2.Part` structure

3. **Add error handling**:
   ```typescript
   try {
     Bus.subscribe(...)
   } catch (error) {
     console.error('[EVENT_LISTENERS] Failed to subscribe:', error)
   }
   ```

### Phase 3: Test Locally

```bash
# 1. Build integration
cd /path/to/claude-mem/opencode-integration
bun run build

# 2. Create test OpenCode project
cd ~/test-projects
mkdir opencode-test && cd opencode-test

# 3. Create .opencode config
cat > .opencode/opencode.jsonc << EOF
{
  "plugins": ["~/.claude/plugins/claude-mem-opencode"],
  "env": {
    "CLAUDE_MEM_AUTO_START": "true"
  }
}
EOF

# 4. Start OpenCode with integration
opencode

# 5. Create test sessions and verify:
# - Sessions are created in claude-mem
# - Observations are captured
# - Context is injected
```

### Phase 4: Debugging

Enable debug logging:

```bash
# Set debug environment
export CLAUDE_MEM_LOG_LEVEL=debug
export NODE_ENV=development

# Run OpenCode
opencode

# In another terminal, check worker logs
tail -f ~/.claude-mem/logs/worker-$(date +%Y-%m-%d).log
```

Add debug statements in `event-listeners.ts`:

```typescript
private async handleSessionCreated(event: any): Promise<void> {
  console.log('[DEBUG] Session created:', JSON.stringify(event, null, 2))
  // ... rest of code
}
```

## Common Issues & Solutions

### Issue 1: "Bus is not defined"

**Error**:
```
ReferenceError: Bus is not defined
```

**Solution**:
1. Check if running within OpenCode context
2. Verify imports match OpenCode's exports
3. Check if OpenCode loads the plugin correctly

### Issue 2: "Session.Info is undefined"

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'info')
```

**Solution**:
1. Verify event structure from OpenCode docs
2. Add type checking:
   ```typescript
   if (!event?.properties?.info) {
     console.warn('[EVENT_LISTENERS] Invalid event structure:', event)
     return
   }
   ```

### Issue 3: Worker connection fails

**Error**:
```
Error: Worker service not ready after 30s
```

**Solution**:
1. Start worker manually:
   ```bash
   cd /path/to/claude-mem
   npm run worker:start
   ```

2. Check port conflicts:
   ```bash
   lsof -i :37777
   ```

3. Verify worker health:
   ```bash
   curl http://localhost:37777/api/health
   ```

### Issue 4: Observations not being captured

**Symptom**: Tool usage doesn't appear in claude-mem

**Debug Steps**:
```bash
# 1. Check worker logs
tail -f ~/.claude-mem/logs/worker-*.log

# 2. Check database
sqlite3 ~/.claude-mem/claude-mem.db "SELECT * FROM observations ORDER BY created_at DESC LIMIT 10;"

# 3. Check integration logs
# Add debug statements to event-listeners.ts
```

**Common Causes**:
- Event subscription failed silently
- Part type check is incorrect
- Session mapping not working
- Worker API endpoint changed

## Testing Strategy

### Unit Tests

Create test files for each component:

```typescript
// opencode-integration/__tests__/worker-client.test.ts
import { describe, it, expect } from 'bun:test'
import { WorkerClient } from '../worker-client.js'

describe('WorkerClient', () => {
  it('should initialize session', async () => {
    const client = new WorkerClient()
    const response = await client.initSession({
      contentSessionId: 'test',
      project: 'test-project',
      prompt: 'Test'
    })
    expect(response.sessionDbId).toBeNumber()
  })
})
```

### Integration Tests

Test with OpenCode running:

```typescript
// opencode-integration/__tests__/integration.test.ts
import { afterAll, beforeAll, describe, it } from 'bun:test'
import { ClaudeMemIntegration } from '../index.js'

describe('ClaudeMemIntegration', () => {
  let integration: ClaudeMemIntegration

  beforeAll(async () => {
    integration = new ClaudeMemIntegration()
    await integration.initialize()
  })

  it('should have worker ready', async () => {
    const status = await integration.getStatus()
    expect(status.workerReady).toBe(true)
  })

  afterAll(async () => {
    await integration.shutdown()
  })
})
```

### End-to-End Tests

Test complete workflow:

```bash
# 1. Start worker
cd /path/to/claude-mem
npm run worker:start

# 2. Start OpenCode with integration
cd /path/to/test-project
opencode

# 3. Create test session in OpenCode
# (via OpenCode UI/CLI)

# 4. Use tools in OpenCode
# (via OpenCode UI/CLI)

# 5. Verify in web viewer
open http://localhost:37777

# 6. Check database
sqlite3 ~/.claude-mem/claude-mem.db "SELECT * FROM sessions WHERE content_session_id = '<session-id>';"
sqlite3 ~/.claude-mem/claude-mem.db "SELECT * FROM observations WHERE session_id = <session-id>;"
```

## Code Style Guidelines

Follow these conventions when adapting the code:

### TypeScript
- Use strict type checking
- Define interfaces for all external APIs
- Use proper async/await patterns
- Handle errors explicitly

```typescript
// Good
interface OpenCodeSessionEvent {
  type: string
  properties: { info: Session.Info }
}

async handleEvent(event: OpenCodeSessionEvent): Promise<void> {
  try {
    // Implementation
  } catch (error) {
    console.error('[EVENT] Error:', error)
    throw error
  }
}
```

### Logging
- Use consistent prefixes: `[COMPONENT]`
- Include context in error messages
- Log at appropriate levels (info, warn, error)

```typescript
// Good
console.log('[EVENT_LISTENERS] Session created:', sessionId)
console.warn('[EVENT_LISTENERS] Session not found:', sessionId)
console.error('[EVENT_LISTENERS] Failed to initialize:', error)

// Bad
console.log('Created')  // No prefix
console.log(error)  // No context
```

### Error Handling
- Always catch and handle errors
- Provide helpful error messages
- Log full error objects for debugging
- Use custom error types where appropriate

```typescript
// Good
try {
  await this.workerClient.initSession(...)
} catch (error) {
  if (error instanceof WorkerConnectionError) {
    console.error('[WORKER] Connection failed:', error.message)
    throw new InitializationError('Worker unavailable')
  }
  throw error
}
```

## Contributing Back

When you've successfully adapted the integration:

1. **Test thoroughly** - Ensure all features work
2. **Update documentation** - Reflect any API changes
3. **Remove template warnings** - Clean up console.log statements
4. **Add examples** - Include in docs
5. **Submit PR** - Share with community

## Getting Help

1. **OpenCode Issues**: https://github.com/sst/opencode/issues
2. **OpenCode Docs**: https://opencode.ai/docs
3. **claude-mem Docs**: https://docs.claude-mem.ai
4. **Discord**: Join OpenCode community

## Checklist Before Production

- [ ] All template code replaced with real implementations
- [ ] Error handling added to all functions
- [ ] Type safety verified (no `any` where possible)
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Debug logging removed or gated
- [ ] Performance tested
- [ ] Edge cases handled
- [ ] Code reviewed

Ready to adapt! 🚀
