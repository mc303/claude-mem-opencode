# claude-mem-opencode

OpenCode integration for [claude-mem](https://github.com/thedotmack/claude-mem) persistent memory.

## Overview

`claude-mem-opencode` automatically captures your OpenCode coding sessions as compressed memories, making them searchable for future sessions. It provides persistent context across sessions with ~10x token efficiency compared to storing full tool outputs.

## Requirements

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0
- **claude-mem** >= 8.5.4 (for full functionality)

## Important Note

claude-mem v8.5.4 worker API is required for full functionality but is only available from [GitHub releases](https://github.com/thedotmack/claude-mem/releases), not npm.

See [Installation Guide](docs/INSTALLATION.md) for detailed instructions on installing claude-mem from GitHub.

## Features

- **Automatic Memory Capture**: Captures tool usage automatically via OpenCode events
- **Intelligent Compression**: Uses AI to compress observations while preserving context
- **Natural Language Search**: Search your coding history using natural language
- **Privacy Protection**: Automatic privacy tag stripping for sensitive data
- **Session Mapping**: Maps OpenCode sessions to claude-mem sessions
- **Context Injection**: Automatically injects relevant memories into new sessions

## Quick Start

### 1. Install claude-mem v8.5.4 from GitHub

```bash
# Clone claude-mem repository
git clone https://github.com/thedotmack/claude-mem.git
cd claude-mem

# Build and install
bun install
bun run build
bun link

# Verify installation
claude-mem --version
# Should output: 8.5.4
```

### 2. Start claude-mem worker

```bash
claude-mem worker start

# Verify worker is running
curl http://localhost:37777/api/health
```

### 3. Use in your code

```typescript
import { ClaudeMemIntegration } from 'claude-mem-opencode'

const integration = new ClaudeMemIntegration()
await integration.initialize()

// Memory is now being captured automatically!
```

### 3. Use in OpenCode

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

## API Reference

### ClaudeMemIntegration

Main integration class that manages all memory operations.

#### Constructor

```typescript
new ClaudeMemIntegration(workerUrl?: string)
```

- `workerUrl`: Optional URL of claude-mem worker (default: `http://localhost:37777`)

#### Methods

**initialize()**: Initialize the integration

```typescript
await integration.initialize()
```

**getStatus()**: Get integration status

```typescript
const status = await integration.getStatus()
// Returns: { initialized, workerReady, workerUrl, currentProject }
```

**getProjectContext(project?)**: Get memory context for a project

```typescript
const context = await integration.getProjectContext('my-project')
```

**searchMemory(query, options?)**: Search memories

```typescript
const results = await integration.searchMemory('authentication', {
  limit: 10,
  type: 'code',
  project: 'my-project'
})
```

**isMemoryAvailable()**: Check if memory features are available

```typescript
if (integration.isMemoryAvailable()) {
  // Memory operations available
}
```

**getWorkerClient()**: Get underlying WorkerClient (advanced usage)

```typescript
const client = integration.getWorkerClient()
await client.initSession({ ... })
```

**shutdown()**: Shutdown integration

```typescript
await integration.shutdown()
```

### WorkerClient

Low-level HTTP client for claude-mem worker API.

```typescript
import { WorkerClient } from 'claude-mem-opencode'

const client = new WorkerClient(37777)

// Check health
await client.healthCheck()

// Initialize session
await client.initSession({
  contentSessionId: 'session-123',
  project: 'my-project',
  prompt: 'Initial prompt'
})

// Add observation
await client.addObservation({
  sessionDbId: 1,
  promptNumber: 1,
  toolName: 'bash',
  toolInput: { command: 'ls' },
  toolOutput: 'file1.txt\nfile2.txt',
  cwd: '/home/user/project',
  timestamp: Date.now()
})

// Complete session
await client.completeSession(1)

// Search
const results = await client.search('query', { limit: 10 })
```

### EventListeners

Listens to OpenCode events and captures tool usage.

```typescript
import { EventListeners } from 'claude-mem-opencode'

const listeners = new EventListeners(workerClient)
await listeners.initialize()
```

### ContextInjector

Injects memory context into OpenCode sessions.

```typescript
import { ContextInjector } from 'claude-mem-opencode'

const injector = new ContextInjector(workerClient)
const context = await injector.injectContext('my-project')
```

### SessionMapper

Maps OpenCode session IDs to claude-mem session IDs.

```typescript
import { SessionMapper } from 'claude-mem-opencode'

const mapper = new SessionMapper()

// Map sessions
mapper.mapOpenCodeToClaudeMem('opencode-session-123', 1)

// Get mapping
const claudeMemId = mapper.getClaudeMemSessionId('opencode-session-123')
```

### PrivacyTagStripper

Removes privacy tags from content before storage.

```typescript
import { PrivacyTagStripper } from 'claude-mem-opencode'

const stripper = new PrivacyTagStripper()

const cleaned = stripper.strip('<private>secret</private> data')
// Returns: ' data'
```

### ProjectNameExtractor

Extracts project name from directory paths.

```typescript
import { ProjectNameExtractor } from 'claude-mem-opencode'

const extractor = new ProjectNameExtractor()

const projectName = extractor.extract('/home/user/my-project')
// Returns: 'my-project'

const currentProject = extractor.getCurrentProject()
// Returns: name of current working directory
```

### Logger

Simple logging utility.

```typescript
import { Logger, LogLevel } from 'claude-mem-opencode'

const logger = new Logger('MY_APP')

logger.debug('Debug message')
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message')
```

## Privacy Protection

Use privacy tags to prevent sensitive data from being stored:

```typescript
// This will not be stored
<private>password = "secret123"</private>

// This will not be stored
<claude-mem-context>Previously injected context</claude-mem-context>
```

The `PrivacyTagStripper` automatically removes these tags before storing data.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenCode                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │    Bus       │  │   Session    │  │  MessageV2   ││
│  │  (Events)    │  │   (Info)     │  │   (Part)     ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘│
│         │                 │                 │          │
│         └─────────────────┴─────────────────┘          │
│                           │                             │
│                    claude-mem-opencode                │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                             │ HTTP
                     ┌───────▼────────┐
                     │ claude-mem     │
                     │ Worker API     │
                     │ (localhost:    │
                     │  37777)        │
                     └────────────────┘
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Creating Bundle

```bash
npm run bundle
```

## Testing

Run unit tests (no claude-mem required):

```bash
npm run test:unit
# Expected: 54 pass
```

Run integration/E2E tests (requires claude-mem worker):

```bash
# Start worker
claude-mem worker start

# Run tests
npm run test:integration
npm run test:e2e

# Stop worker
claude-mem worker stop
```

See [Testing Guide](docs/TESTING.md) for comprehensive testing instructions.

## Troubleshooting

### Worker not starting

```bash
# Verify claude-mem installation
claude-mem --version
# Must be 8.5.4 or higher

# Check worker logs
claude-mem worker logs

# Ensure port 37777 is available
lsof -i :37777  # macOS/Linux
```

## License

MIT

## Acknowledgments

- [claude-mem](https://github.com/thedotmack/claude-mem) - Persistent memory for Claude Code
- [OpenCode](https://github.com/sst/opencode) - The AI CLI
