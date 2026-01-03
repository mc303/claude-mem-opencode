# OpenCode API Adaptation Guide

Based on studying OpenCode's actual source code, here's what needs to be adapted for the claude-mem integration.

## OpenCode API Structure

### Key Interfaces and Events

#### 1. Bus Event System

**Location**: `~/dev/opencode-source/packages/opencode/src/bus/`

**Events Available**:
```typescript
import { Bus } from "@/bus"

// Session Events
import { Session } from "@/session"
Bus.subscribe(Session.Event.Created, handler)     // When session is created
Bus.subscribe(Session.Event.Updated, handler)     // When session is updated
Bus.subscribe(Session.Event.Diff, handler)        // When files are changed
Bus.subscribe(Session.Event.Error, handler)       // When error occurs

// Message Events
import { MessageV2 } from "@/session"
Bus.subscribe(MessageV2.Event.Updated, handler)   // When message is updated
Bus.subscribe(MessageV2.Event.PartUpdated, handler) // When message part is updated
```

#### 2. Session.Info Structure

**Location**: `~/dev/opencode-source/packages/opencode/src/session/index.ts`

```typescript
export namespace Session {
  export const Info = z.object({
    id: Identifier.schema("session"),         // ULID string
    projectID: z.string(),                  // Project identifier
    directory: z.string(),                // Working directory path
    parentID: Identifier.schema("session").optional(),
    summary: z.object({
      additions: z.number(),
      deletions: z.number(),
      files: z.number(),
    }).optional(),
    share: z.object({
      url: z.string(),
    }).optional(),
    title: z.string(),
    version: z.string(),
    time: z.object({
      created: z.number(),
      updated: z.number(),
      compacting: z.number().optional(),
      archived: z.number().optional(),
    }),
    revert: z.object({
      messageID: z.string().optional(),
      partID: z.string().optional(),
      snapshot: z.string().optional(),
      diff: z.string().optional(),
    }).optional(),
  })

  export type Info = z.output<typeof Info>
}
```

#### 3. MessageV2.Part Structure

**Location**: `~/dev/opencode-source/packages/opencode/src/session/message-v2.ts`

```typescript
export namespace MessageV2 {
  export type Part = (
    | TextPart      // { type: 'text', text: string, messageID, sessionID, ... }
    | ReasoningPart // { type: 'reasoning', text: string, ... }
    | ToolCallPart  // { type: 'tool_call', name: string, args: any, result?: string, ... }
    | PatchPart     // { type: 'patch', hash: string, files: string[], ... }
    | SnapshotPart  // { type: 'snapshot', snapshot: string }
  )
}
```

## What Needs to Be Adapted

### event-listeners.ts Adaptations

#### Current (Template)
```typescript
async initialize(): Promise<void> {
  console.log('[EVENT_LISTENERS] OpenCode event listeners initialized')
  console.log('[EVENT_LISTENERS] NOTE: This is a template - needs adaptation to OpenCode APIs')
}
```

#### Required (Real Implementation)

**1. Import OpenCode APIs**
```typescript
import { Bus } from '@/bus'  // ← From OpenCode
import { Session, MessageV2 } from '@/session'  // ← From OpenCode
```

**2. Subscribe to Real Events**
```typescript
async initialize(): Promise<void> {
  // Subscribe to session creation
  Bus.subscribe(Session.Event.Created, async (event) => {
    await this.handleSessionCreated(event)
  })

  // Subscribe to message part updates (for tool usage)
  Bus.subscribe(MessageV2.Event.PartUpdated, async (event) => {
    await this.handleMessagePartUpdated(event)
  })

  // Subscribe to session updates (for completion detection)
  Bus.subscribe(Session.Event.Updated, async (event) => {
    await this.handleSessionUpdated(event)
  })
}
```

**3. Access Real Session.Info**
```typescript
private async handleSessionCreated(event: {
  type: string
  properties: { info: Session.Info }  // ← Real OpenCode type
}): Promise<void> {
  const { info } = event.properties
  const openCodeSessionId = info.id                    // ← Access real property
  const project = this.projectNameExtractor.extract(info.directory)
  const title = info.title                             // ← Access real property

  // ... rest of implementation
}
```

**4. Access Real MessageV2.Part for Tool Usage**
```typescript
private async handleMessagePartUpdated(event: {
  type: string
  properties: { part: MessageV2.Part }  // ← Real OpenCode type
}): Promise<void> {
  const { part } = event.properties

  // Only process tool calls
  if (part.type !== 'tool_call') return     // ← Real check

  const toolName = part.name              // ← Access real property
  const toolArgs = part.args              // ← Access real property
  const toolResult = part.result          // ← Access real property (if available)
  const sessionId = part.sessionID        // ← Access real property
  const cwd = part.cwd                // ← Access real property (if available)

  // ... rest of implementation
}
```

**5. Detect Session Completion**
```typescript
private async handleSessionUpdated(event: {
  type: string
  properties: { info: Session.Info }  // ← Real OpenCode type
}): Promise<void> {
  const { info } = event.properties

  // Check if session is archived (completed)
  if (!info.time.archived) return    // ← Check real property

  const openCodeSessionId = info.id
  await this.handleSessionCompleted(openCodeSessionId)
}
```

## Complete Implementation Example

Here's the complete adapted `event-listeners.ts`:

```typescript
/**
 * Subscribe to OpenCode Bus events and bridge to claude-mem
 * Adapted to use real OpenCode APIs
 */

import { Bus } from '@/bus'  // ← IMPORT FROM OPENC0DE
import { Session, MessageV2 } from '@/session'  // ← IMPORT FROM OPENC0DE
import { WorkerClient } from './worker-client.js'
import { SessionMapper } from './session-mapper.js'
import { ProjectNameExtractor } from './utils/project-name.js'
import { PrivacyTagStripper } from './utils/privacy.js'

export class EventListeners {
  private workerClient: WorkerClient
  private sessionMapper: SessionMapper
  private projectNameExtractor: ProjectNameExtractor
  private privacyStripper: PrivacyTagStripper
  private promptNumberTracker: Map<string, number> = new Map()

  constructor(workerClient: WorkerClient) {
    this.workerClient = workerClient
    this.sessionMapper = new SessionMapper()
    this.projectNameExtractor = new ProjectNameExtractor()
    this.privacyStripper = new PrivacyTagStripper()
  }

  /**
   * Subscribe to all relevant OpenCode events using real Bus API
   */
  async initialize(): Promise<void> {
    console.log('[EVENT_LISTENERS] Initializing OpenCode event listeners...')

    // Subscribe to session creation
    Bus.subscribe(Session.Event.Created, this.handleSessionCreated.bind(this))

    // Subscribe to tool usage (message part updates)
    Bus.subscribe(MessageV2.Event.PartUpdated, this.handleMessagePartUpdated.bind(this))

    // Subscribe to session updates (for completion detection)
    Bus.subscribe(Session.Event.Updated, this.handleSessionUpdated.bind(this))

    console.log('[EVENT_LISTENERS] Subscribed to OpenCode Bus events')
  }

  /**
   * Handle session creation - initialize claude-mem session
   * Uses real Session.Info from OpenCode
   */
  private async handleSessionCreated(event: {
    type: string
    properties: { info: Session.Info }  // ← REAL OPENC0DE TYPE
  }): Promise<void> {
    const { info } = event.properties
    const project = this.projectNameExtractor.extract(info.directory)
    const openCodeSessionId = info.id
    const title = info.title || 'New session'

    console.log(`[EVENT_LISTENERS] Session created: ${openCodeSessionId}`)

    try {
      const response = await this.workerClient.initSession({
        contentSessionId: openCodeSessionId,
        project,
        prompt: title
      })

      // Skip if marked as private
      if (response.skipped) {
        console.log(`[EVENT_LISTENERS] Session marked as private: ${openCodeSessionId}`)
        console.log(`[EVENT_LISTENERS] Reason: ${response.reason}`)
        return
      }

      // Store mapping
      this.sessionMapper.mapOpenCodeToClaudeMem(
        openCodeSessionId,
        response.sessionDbId
      )

      // Initialize prompt number tracking
      this.promptNumberTracker.set(openCodeSessionId, response.promptNumber)

      console.log(`[EVENT_LISTENERS] Mapped ${openCodeSessionId} → ${response.sessionDbId}`)
      console.log(`[EVENT_LISTENERS] Project: ${project}, Prompt #${response.promptNumber}`)
    } catch (error) {
      console.error(`[EVENT_LISTENERS] Failed to initialize session ${openCodeSessionId}:`, error)
    }
  }

  /**
   * Handle message part updates - capture tool usage
   * Uses real MessageV2.Part from OpenCode
   */
  private async handleMessagePartUpdated(event: {
    type: string
    properties: { part: MessageV2.Part }  // ← REAL OPENC0DE TYPE
  }): Promise<void> {
    const { part } = event.properties

    // Only process tool calls
    if (part.type !== 'tool_call') {  // ← REAL TYPE CHECK
      return
    }

    const toolName = part.name              // ← ACCESS REAL PROPERTY
    const toolArgs = part.args              // ← ACCESS REAL PROPERTY
    const toolResult = part.result || ''     // ← ACCESS REAL PROPERTY
    const sessionId = part.sessionID        // ← ACCESS REAL PROPERTY
    const cwd = part.cwd || process.cwd()  // ← ACCESS REAL PROPERTY

    const claudeMemSessionId = this.sessionMapper.getClaudeMemSessionId(sessionId)
    if (!claudeMemSessionId) {
      console.log(`[EVENT_LISTENERS] No claude-mem session for: ${sessionId}`)
      return
    }

    const promptNumber = this.getPromptNumber(sessionId)
    console.log(`[EVENT_LISTENERS] Tool usage: ${sessionId} - ${toolName}`)

    try {
      // Strip privacy tags
      const strippedArgs = this.privacyStripper.stripFromJson(toolArgs)
      const strippedResult = this.privacyStripper.stripFromText(toolResult)

      // Queue observation
      await this.workerClient.addObservation({
        sessionDbId: claudeMemSessionId,
        promptNumber,
        toolName,
        toolInput: strippedArgs,
        toolOutput: strippedResult,
        cwd,
        timestamp: Date.now()
      })

      console.log(`[EVENT_LISTENERS] Added observation: ${claudeMemSessionId} - ${toolName}`)
    } catch (error) {
      console.error(`[EVENT_LISTENERS] Failed to add observation:`, error)
    }
  }

  /**
   * Handle session updates - check for completion
   * Uses real Session.Info from OpenCode
   */
  private async handleSessionUpdated(event: {
    type: string
    properties: { info: Session.Info }  // ← REAL OPENC0DE TYPE
  }): Promise<void> {
    const { info } = event.properties

    // Check if session is archived (completed)
    if (!info.time.archived) {  // ← CHECK REAL PROPERTY
      return
    }

    const openCodeSessionId = info.id
    console.log(`[EVENT_LISTENERS] Session archived: ${openCodeSessionId}`)

    const claudeMemSessionId = this.sessionMapper.getClaudeMemSessionId(openCodeSessionId)
    if (!claudeMemSessionId) {
      console.log(`[EVENT_LISTENERS] No claude-mem session for: ${openCodeSessionId}`)
      return
    }

    try {
      await this.workerClient.completeSession(claudeMemSessionId)
      console.log(`[EVENT_LISTENERS] Completed session: ${claudeMemSessionId}`)

      // Clean up mapping
      this.sessionMapper.unmapSession(openCodeSessionId)
      this.promptNumberTracker.delete(openCodeSessionId)
    } catch (error) {
      console.error(`[EVENT_LISTENERS] Failed to complete session:`, error)
    }
  }

  /**
   * Get current prompt number for a session
   */
  getPromptNumber(sessionId: string): number {
    return this.promptNumberTracker.get(sessionId) ?? 1
  }

  /**
   * Increment prompt number for a session
   */
  incrementPromptNumber(sessionId: string): void {
    const current = this.getPromptNumber(sessionId)
    this.promptNumberTracker.set(sessionId, current + 1)
  }
}
```

## Implementation Checklist

- [ ] Update imports to use real OpenCode Bus/Session types
- [ ] Replace console.log with Bus.subscribe() calls
- [ ] Access real Session.Info properties (id, directory, title, time.archived)
- [ ] Access real MessageV2.Part properties (type, name, args, result, sessionID)
- [ ] Implement proper type checking for part.type === 'tool_call'
- [ ] Add error handling for all async functions
- [ ] Remove template comments
- [ ] Test with actual OpenCode instance

## Key Insights

1. **Session ID Mapping**: OpenCode uses ULID strings (e.g., "01HABC123...")
2. **Project Name**: Extract from `info.directory` using path.basename()
3. **Tool Detection**: Check `part.type === 'tool_call'` to capture tool usage
4. **Session Completion**: Check `info.time.archived` property to detect completion
5. **Event Subscription**: Use `Bus.subscribe(event, handler)` pattern from OpenCode

## Next Steps

1. Replace `event-listeners.ts` with the complete implementation above
2. Remove or update template comments
3. Add proper error types if needed
4. Test with OpenCode running

## References

- **OpenCode Session API**: `~/dev/opencode-source/packages/opencode/src/session/index.ts`
- **OpenCode Message API**: `~/dev/opencode-source/packages/opencode/src/session/message-v2.ts`
- **OpenCode Bus API**: `~/dev/opencode-source/packages/opencode/src/bus/index.ts`
- **OpenCode Bus Events**: `~/dev/opencode-source/packages/opencode/src/bus/bus-event.ts`

This adaptation uses OpenCode's actual APIs instead of placeholder template code.
