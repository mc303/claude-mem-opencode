# API Reference

This document provides a reference for the APIs and interfaces used in the OpenCode integration.

## Table of Contents

1. [Worker Client API](#worker-client-api)
2. [Event Listeners API](#event-listeners-api)
3. [Context Injector API](#context-injector-api)
4. [Session Mapper API](#session-mapper-api)
5. [Utility APIs](#utility-apis)
6. [Configuration](#configuration)

## Worker Client API

### Class: `WorkerClient`

HTTP client for communicating with the claude-mem worker service.

#### Constructor

```typescript
constructor(port?: number)
```

**Parameters:**
- `port` (optional, number, default: 37777): Port of worker service

**Example:**
```typescript
const client = new WorkerClient()  // Default port 37777
const client = new WorkerClient(9999)  // Custom port
```

#### Methods

##### `healthCheck()`

Check if worker service is running and healthy.

```typescript
async healthCheck(): Promise<boolean>
```

**Returns:**
- `Promise<boolean>`: true if worker is healthy, false otherwise

**Throws:** None (returns false on error)

**Example:**
```typescript
const client = new WorkerClient()
const isHealthy = await client.healthCheck()
if (isHealthy) {
  console.log('Worker is running')
} else {
  console.log('Worker is not available')
}
```

##### `waitForReady(timeoutMs?)`

Wait for worker to be ready to accept requests.

```typescript
async waitForReady(timeoutMs?: number): Promise<boolean>
```

**Parameters:**
- `timeoutMs` (optional, number, default: 30000): Max time to wait in milliseconds

**Returns:**
- `Promise<boolean>`: true if ready, false if timeout

**Example:**
```typescript
const client = new WorkerClient()
const ready = await client.waitForReady(10000)  // Wait 10s
if (!ready) {
  throw new Error('Worker not ready after 10s')
}
```

##### `initSession(request)`

Initialize a new claude-mem session.

```typescript
async initSession(request: InitSessionRequest): Promise<InitSessionResponse>
```

**Parameters:**
```typescript
interface InitSessionRequest {
  contentSessionId: string    // OpenCode session ID
  project: string               // Project name
  prompt: string                // Session title/prompt
}
```

**Returns:**
```typescript
interface InitSessionResponse {
  sessionDbId: number   // claude-mem internal session ID
  promptNumber: number  // Prompt number in session
  skipped: boolean      // True if session marked as private
  reason?: string       // Reason for skipping
}
```

**Throws:** Error if initialization fails

**Example:**
```typescript
const response = await client.initSession({
  contentSessionId: 'session-abc123',
  project: 'my-app',
  prompt: 'Fix authentication bug'
})

if (response.skipped) {
  console.log('Session skipped:', response.reason)
} else {
  console.log('Session created:', response.sessionDbId)
}
```

##### `addObservation(request)`

Add an observation (tool usage) to a session.

```typescript
async addObservation(request: ObservationRequest): Promise<void>
```

**Parameters:**
```typescript
interface ObservationRequest {
  sessionDbId: number   // claude-mem session ID
  promptNumber: number   // Prompt number in session
  toolName: string      // Tool name (e.g., 'edit', 'bash')
  toolInput: any        // Tool input parameters
  toolOutput: string     // Tool output/result
  cwd: string           // Working directory
  timestamp: number      // Unix timestamp
}
```

**Throws:** Error if observation addition fails

**Example:**
```typescript
await client.addObservation({
  sessionDbId: 42,
  promptNumber: 1,
  toolName: 'edit',
  toolInput: { file: 'src/test.ts', content: '...' },
  toolOutput: 'Successfully edited file',
  cwd: '/path/to/project',
  timestamp: Date.now()
})
```

##### `completeSession(sessionDbId)`

Mark a session as complete and trigger summarization.

```typescript
async completeSession(sessionDbId: number): Promise<void>
```

**Parameters:**
- `sessionDbId` (number): claude-mem session ID to complete

**Throws:** Error if completion fails

**Example:**
```typescript
await client.completeSession(42)
console.log('Session completed, summary will be generated')
```

##### `getProjectContext(project)`

Get memory context for a project.

```typescript
async getProjectContext(project: string): Promise<string>
```

**Parameters:**
- `project` (string): Project name

**Returns:**
- `Promise<string>`: Context string (empty if no memory)

**Throws:** Error if context fetch fails

**Example:**
```typescript
const context = await client.getProjectContext('my-app')
if (context) {
  console.log('Context length:', context.length)
  console.log('Context preview:', context.substring(0, 200))
} else {
  console.log('No memory available for this project')
}
```

##### `search(query, options?)`

Search memory for relevant observations.

```typescript
async search(query: string, options?: SearchOptions): Promise<any>
```

**Parameters:**
- `query` (string): Search query text
- `options` (optional):
  ```typescript
  interface SearchOptions {
    limit?: number   // Max results (default: 10)
    type?: string    // Filter by type (bugfix, feature, etc.)
    project?: string // Filter by project name
  }
  ```

**Returns:**
- `Promise<any>`: Array of observation results

**Throws:** Error if search fails

**Example:**
```typescript
const results = await client.search('authentication bug', {
  limit: 10,
  type: 'bugfix',
  project: 'my-app'
})

console.log(`Found ${results.length} observations`)
results.forEach(obs => {
  console.log(`  #${obs.id}: ${obs.summary}`)
})
```

##### `getObservations(ids)`

Fetch full details for specific observations.

```typescript
async getObservations(ids: number[]): Promise<any>
```

**Parameters:**
- `ids` (number[]): Array of observation IDs

**Returns:**
- `Promise<any>`: Array of full observation objects

**Throws:** Error if fetch fails

**Example:**
```typescript
const details = await client.getObservations([123, 456, 789])
console.log(`Fetched ${details.length} observations`)

details.forEach(obs => {
  console.log(`\nObservation #${obs.id}`)
  console.log(`  Type: ${obs.type}`)
  console.log(`  Summary: ${obs.summary}`)
  console.log(`  Tool: ${obs.tool_name}`)
  console.log(`  Timestamp: ${obs.timestamp}`)
})
```

##### `getTimeline(sessionDbId, observationId, window?)`

Get chronological context around an observation.

```typescript
async getTimeline(sessionDbId: number, observationId: number, window?: number): Promise<any>
```

**Parameters:**
- `sessionDbId` (number): Session database ID
- `observationId` (number): Target observation ID
- `window` (optional, number, default: 5): Observations before/after

**Returns:**
- `Promise<any>`: Array of observations in chronological order

**Throws:** Error if timeline fetch fails

**Example:**
```typescript
const timeline = await client.getTimeline(42, 123, 5)
console.log(`Timeline has ${timeline.length} observations`)

timeline.forEach(obs => {
  const marker = obs.id === 123 ? '🎯 TARGET' : '  '
  console.log(`${marker} #${obs.id}: ${obs.summary} (${obs.relativeTime})`)
})
```

## Event Listeners API

### Class: `EventListeners`

Bridges OpenCode events to claude-mem operations.

#### Constructor

```typescript
constructor(workerClient: WorkerClient)
```

**Parameters:**
- `workerClient` (WorkerClient): Worker client instance

**Example:**
```typescript
const client = new WorkerClient()
const listeners = new EventListeners(client)
```

#### Methods

##### `initialize()`

Subscribe to OpenCode Bus events.

```typescript
async initialize(): Promise<void>
```

**Example:**
```typescript
const listeners = new EventListeners(client)
await listeners.initialize()
console.log('Event listeners initialized')
```

##### `handleSessionCreated(sessionId, directory, title?)`

Handle OpenCode session creation event.

```typescript
async handleSessionCreated(sessionId: string, directory: string, title?: string): Promise<void>
```

**Parameters:**
- `sessionId` (string): OpenCode session ID
- `directory` (string): Session working directory
- `title` (optional, string): Session title

**Behavior:**
- Extracts project name from directory
- Initializes claude-mem session
- Maps OpenCode ID to claude-mem ID
- Skips if marked as private

**Example:**
```typescript
await listeners.handleSessionCreated(
  'session-abc123',
  '/home/user/projects/my-app',
  'Fix authentication bug'
)
```

##### `handleToolUsage(sessionId, toolName, toolInput, toolOutput)`

Handle tool usage event.

```typescript
async handleToolUsage(sessionId: string, toolName: string, toolInput: any, toolOutput: string): Promise<void>
```

**Parameters:**
- `sessionId` (string): OpenCode session ID
- `toolName` (string): Name of tool used
- `toolInput` (any): Tool input parameters
- `toolOutput` (string): Tool output/result

**Behavior:**
- Maps to claude-mem session ID
- Strips privacy tags
- Adds observation to claude-mem
- Tracks prompt numbers

**Example:**
```typescript
await listeners.handleToolUsage(
  'session-abc123',
  'edit',
  { file: 'src/test.ts', content: '...' },
  'Successfully edited file'
)
```

##### `handleSessionCompleted(sessionId)`

Handle session completion event.

```typescript
async handleSessionCompleted(sessionId: string): Promise<void>
```

**Parameters:**
- `sessionId` (string): OpenCode session ID

**Behavior:**
- Maps to claude-mem session ID
- Completes session (triggers summarization)
- Cleans up mappings

**Example:**
```typescript
await listeners.handleSessionCompleted('session-abc123')
console.log('Session completed, summary will be generated')
```

##### `getPromptNumber(sessionId)`

Get current prompt number for a session.

```typescript
getPromptNumber(sessionId: string): number
```

**Returns:**
- `number`: Current prompt number

**Example:**
```typescript
const promptNum = listeners.getPromptNumber('session-abc123')
console.log(`Current prompt: #${promptNum}`)
```

##### `incrementPromptNumber(sessionId)`

Increment prompt number for a session.

```typescript
incrementPromptNumber(sessionId): void
```

**Example:**
```typescript
listeners.incrementPromptNumber('session-abc123')
const nextNum = listeners.getPromptNumber('session-abc123')
console.log(`Next prompt: #${nextNum}`)
```

## Context Injector API

### Class: `ContextInjector`

Handles injection of memory context into sessions.

#### Constructor

```typescript
constructor(workerClient: WorkerClient)
```

**Parameters:**
- `workerClient` (WorkerClient): Worker client instance

**Example:**
```typescript
const client = new WorkerClient()
const injector = new ContextInjector(client)
```

#### Methods

##### `injectContext(project)`

Inject memory context for a project.

```typescript
async injectContext(project: string): Promise<string>
```

**Parameters:**
- `project` (string): Project name

**Returns:**
- `Promise<string>`: Context string (empty if none available)

**Example:**
```typescript
const context = await injector.injectContext('my-app')
if (context) {
  console.log('Injected context:', context.length, 'characters')
}
```

##### `getSystemPromptAddition(project)`

Get memory context formatted as system prompt addition.

```typescript
async getSystemPromptAddition(project: string): Promise<string>
```

**Returns:**
- `Promise<string>`: Formatted context for system prompt

**Example:**
```typescript
const addition = await injector.getSystemPromptAddition('my-app')
console.log('System prompt addition:')
console.log(addition)

// Output example:
// ## Relevant Context from Past Sessions
//
// [Memory content here]
//
// ---
```

## Session Mapper API

### Class: `SessionMapper`

Maintains bidirectional mapping between OpenCode and claude-mem session IDs.

#### Constructor

```typescript
constructor()
```

**Example:**
```typescript
const mapper = new SessionMapper()
```

#### Methods

##### `mapOpenCodeToClaudeMem(openCodeSessionId, claudeMemSessionId)`

Create a mapping between session IDs.

```typescript
mapOpenCodeToClaudeMem(openCodeSessionId: string, claudeMemSessionId: number): void
```

**Parameters:**
- `openCodeSessionId` (string): OpenCode session ID
- `claudeMemSessionId` (number): claude-mem session ID

**Example:**
```typescript
mapper.mapOpenCodeToClaudeMem('session-abc123', 42)
```

##### `getClaudeMemSessionId(openCodeSessionId)`

Get claude-mem session ID for an OpenCode session.

```typescript
getClaudeMemSessionId(openCodeSessionId: string): number | undefined
```

**Returns:**
- `number | undefined`: claude-mem session ID, or undefined if not mapped

**Example:**
```typescript
const claudeMemId = mapper.getClaudeMemSessionId('session-abc123')
if (claudeMemId) {
  console.log('Mapped to claude-mem session:', claudeMemId)
}
```

##### `getOpenCodeSessionId(claudeMemSessionId)`

Get OpenCode session ID for a claude-mem session.

```typescript
getOpenCodeSessionId(claudeMemSessionId: number): string | undefined
```

**Returns:**
- `string | undefined`: OpenCode session ID, or undefined if not mapped

**Example:**
```typescript
const openCodeId = mapper.getOpenCodeSessionId(42)
if (openCodeId) {
  console.log('Original OpenCode session:', openCodeId)
}
```

##### `unmapSession(openCodeSessionId)`

Remove a session mapping.

```typescript
unmapSession(openCodeSessionId: string): void
```

**Example:**
```typescript
mapper.unmapSession('session-abc123')
console.log('Session mapping removed')
```

##### `getAllMappings()`

Get all current mappings.

```typescript
getAllMappings(): Map<string, number>
```

**Returns:**
- `Map<string, number>`: Copy of all mappings

**Example:**
```typescript
const all = mapper.getAllMappings()
console.log(`Active mappings: ${all.size}`)
all.forEach((claudeMemId, openCodeId) => {
  console.log(`  ${openCodeId} → ${claudeMemId}`)
})
```

##### `clear()`

Clear all mappings.

```typescript
clear(): void
```

**Example:**
```typescript
mapper.clear()
console.log('All mappings cleared')
```

## Utility APIs

### ProjectNameExtractor

Extract project names from directory paths.

#### Methods

```typescript
extract(directory: string): string
getCurrentProject(): string
```

**Example:**
```typescript
const extractor = new ProjectNameExtractor()

const project = extractor.extract('/home/user/projects/my-app/src')
console.log(project)  // "my-app"

const current = extractor.getCurrentProject()
console.log(current)  // Name of current directory
```

### PrivacyTagStripper

Strip privacy tags from text and JSON.

#### Methods

```typescript
stripFromText(text: string): string
stripFromJson(obj: any): any
isFullyPrivate(text: string): boolean
```

**Example:**
```typescript
const stripper = new PrivacyTagStripper()

// Strip from text
const text = 'This is <private>secret</private> info'
const clean = stripper.stripFromText(text)
console.log(clean)  // "This is [private content removed] info"

// Strip from JSON
const data = {
  password: '<private>secret123</private>',
  username: 'john'
}
const cleanData = stripper.stripFromJson(data)
console.log(cleanData)
// { password: '[private content removed]', username: 'john' }

// Check if fully private
const isPrivate = stripper.isFullyPrivate('<private>all private</private>')
console.log(isPrivate)  // true
```

## Configuration

### Environment Variables

Configure the integration via environment variables or OpenCode config.

#### CLAUDE_MEM_AUTO_START

Auto-start the integration when OpenCode loads.

```bash
# Enable (default)
export CLAUDE_MEM_AUTO_START="true"

# Disable
export CLAUDE_MEM_AUTO_START="false"
```

#### CLAUDE_MEM_WORKER_PORT

Port of the claude-mem worker service.

```bash
export CLAUDE_MEM_WORKER_PORT="37777"
```

### OpenCode Config

Set in `~/.opencode/opencode.jsonc`:

```jsonc
{
  "plugins": ["~/.claude/plugins/claude-mem-opencode"],
  "env": {
    "CLAUDE_MEM_AUTO_START": "true",
    "CLAUDE_MEM_WORKER_PORT": "37777"
  }
}
```

## Error Types

### WorkerConnectionError

Worker service is not available.

```typescript
class WorkerConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkerConnectionError'
  }
}
```

### InitializationError

Integration failed to initialize.

```typescript
class InitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitializationError'
  }
}
```

## Worker API Endpoints

For reference, here are the worker API endpoints used:

### Health
- `GET /api/health` - Check if worker is running
- `GET /api/readiness` - Check if worker is ready for requests

### Session Management
- `POST /api/sessions/init` - Initialize new session
- `POST /api/sessions/observations` - Add observation to session
- `POST /sessions/{sessionDbId}/complete` - Complete session

### Context
- `GET /api/context/inject?project={name}` - Get memory context for project

### Search
- `GET /api/search?q={query}&limit={n}&type={type}&project={name}` - Search observations
- `GET /api/observations/batch` (POST) - Get full observations by IDs
- `GET /api/timeline?session={id}&observation={id}&window={n}` - Get timeline

For detailed API documentation, see the worker service source code in `src/services/worker-service.ts`.
