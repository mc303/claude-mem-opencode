# claude-mem-opencode

OpenCode integration for [claude-mem](https://github.com/thedotmack/claude-mem) persistent memory.

## Overview

`claude-mem-opencode` automatically captures your OpenCode coding sessions as compressed memories, making them searchable for future sessions. It provides persistent context across sessions with ~10x token efficiency compared to storing full tool outputs.

## Requirements

- **Node.js** >= 18.0.0 (or **Bun** >= 1.0.0)
- **claude-mem** >= 15.x (the worker API this package targets)

## Important Note

This package targets the **claude-mem 15.x worker API**, which is the API shipped with
current claude-mem releases (e.g. installed as a Claude Code plugin, where the worker
listens on a dynamic port written to `~/.claude-mem/worker.pid`).

The legacy 8.x worker API (fixed port `37777`, `sessionDbId`-keyed requests) is **not**
what 15.x expects. On a 15.x worker, the old field names are rejected with `HTTP 400`
(`tool_name` / `contentSessionId` are required), and the old
`POST /sessions/:id/complete` endpoint returns `404`. This package now sends the 15.x
shapes and auto-detects the worker port.

The worker port is resolved in this order:

1. `CLAUDE_MEM_WORKER_URL` (explicit full URL)
2. `~/.claude-mem/worker.pid` (`{ "port": NNNN }`, written by `claude-mem worker start`)
3. `CLAUDE_MEM_WORKER_PORT`
4. legacy `37777`

## Features

- **Automatic Memory Capture**: Captures tool usage via OpenCode plugin hooks (`tool.execute.after`)
- **Intelligent Compression**: Uses AI to compress observations while preserving context
- **Natural Language Search**: Search your coding history using natural language
- **Privacy Protection**: Automatic privacy tag stripping for sensitive data
- **Session Mapping**: Maps OpenCode sessions to claude-mem sessions by `contentSessionId`
- **15.x Worker API**: Correct field names, `platformSource: "opencode"`, port auto-detection
- **Dual OpenCode plugin shape**: Works with OpenCode 2.x (`setup(ctx)`) and 1.x (`event`)
- **Context Injection** (opt-in): Inject relevant memories into new sessions

## Quick Start

### 1. Make sure a claude-mem 15.x worker is running

If you use claude-mem as a Claude Code plugin, the worker is already running and has
written its port to `~/.claude-mem/worker.pid`. Verify:

```bash
# Read the actual port (it is dynamic, not always 37777)
PORT=$(node -e "console.log(require('os').homedir() && JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.claude-mem/worker.pid','utf8')).port)")
curl -s "http://127.0.0.1:$PORT/api/health" | head -c 200
# expect: {"status":"ok","version":"15.x.x",...}
```

Otherwise, start one:

```bash
claude-mem worker start
```

### 2. Install the OpenCode plugin

Either add the npm package to your OpenCode config:

```jsonc
// opencode.json
{ "plugin": ["claude-mem-opencode"] }
```

or drop a local plugin file into `~/.config/opencode/plugins/` (or `.opencode/plugins/`)
that re-exports this package's default plugin (see `src/plugin.ts`).

> **Note:** this package's *capture* is driven by the OpenCode plugin (`src/plugin.ts`).
> The library path (`new ClaudeMemIntegration().initialize()`) is still available for
> manual usage and only verifies the worker is reachable.

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

// Port is auto-detected from ~/.claude-mem/worker.pid (or pass an explicit URL/port)
const client = new WorkerClient()

// Check health
await client.healthCheck()

// Initialize session (15.x: keyed by contentSessionId + platformSource)
await client.initSession({
  contentSessionId: 'session-123',
  project: 'my-project',
  prompt: 'Initial prompt',
  cwd: '/home/user/project'
})

// Add observation (15.x: snake_case fields)
await client.addObservation({
  contentSessionId: 'session-123',
  tool_name: 'bash',
  tool_input: { command: 'ls' },
  tool_response: 'file1.txt\nfile2.txt',
  tool_use_id: 'toolu-1',
  cwd: '/home/user/project'
})

// Summarize (triggers compression) and end the session
await client.summarizeSession('session-123')
await client.sessionEnd('session-123', { reason: 'done' })

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

### Worker not found / connection refused

The worker port is dynamic, so do not assume `37777`:

```bash
# Read the actual port from the pid file the worker writes
cat ~/.claude-mem/worker.pid
# e.g. { "pid": 1234, "port": 37701, ... }

# Verify it answers
PORT=$(node -e "console.log(JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.claude-mem/worker.pid','utf8')).port)")
curl -s "http://127.0.0.1:$PORT/api/health"

# If the worker is not running, start it
claude-mem worker start
```

You can also point the client at an explicit worker with `CLAUDE_MEM_WORKER_URL` or
`CLAUDE_MEM_WORKER_PORT`.

### Observations rejected with `HTTP 400`

If you are running a 15.x worker, confirm the client sends 15.x field names
(`tool_name`, `tool_response`, `contentSessionId`). The legacy 8.x names
(`toolName`, `toolOutput`, `sessionDbId`) are rejected by the 15.x validator.

## License

MIT

## Acknowledgments

- [claude-mem](https://github.com/thedotmack/claude-mem) - Persistent memory for Claude Code
- [OpenCode](https://github.com/sst/opencode) - The AI CLI
