# claude-mem-opencode

OpenCode integration for [claude-mem](https://github.com/thedotmack/claude-mem) persistent memory.

## Overview

`claude-mem-opencode` automatically captures your OpenCode coding sessions as compressed memories, making them searchable for future sessions. It provides persistent context across sessions with ~10x token efficiency compared to storing full tool outputs.

## Features

- **Automatic Memory Capture**: Captures tool usage automatically via OpenCode events
- **Intelligent Compression**: Uses AI to compress observations while preserving context
- **Natural Language Search**: Search your coding history using natural language
- **Privacy Protection**: Automatic privacy tag stripping for sensitive data
- **Session Mapping**: Maps OpenCode sessions to claude-mem sessions
- **Context Injection**: Automatically injects relevant memories into new sessions

## Installation

```bash
npm install claude-mem-opencode
```

## Quick Start

### 1. Install claude-mem

```bash
npm install -g claude-mem
```

### 2. Start claude-mem worker

```bash
claude-mem worker start
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

## Requirements

- Node.js >= 18.0.0
- Bun >= 1.0.0
- claude-mem >= 8.5.0

## License

MIT

## Acknowledgments

- [claude-mem](https://github.com/thedotmack/claude-mem) - Persistent memory for Claude Code
- [OpenCode](https://github.com/sst/opencode) - The AI CLI
