/**
 * Subscribe to OpenCode Bus events and bridge to claude-mem
 * Adapted to use real OpenCode APIs (with fallback for testing)
 */

import { WorkerClient } from './worker-client.js'
import { SessionMapper } from './session-mapper.js'
import { ProjectNameExtractor } from './utils/project-name.js'
import { PrivacyTagStripper } from './utils/privacy.js'

let Bus: any = null
let Session: any = null
let MessageV2: any = null

try {
  const busModule = await import('@/bus')
  Bus = busModule.Bus
  const sessionModule = await import('@/session')
  Session = sessionModule.Session
  MessageV2 = sessionModule.MessageV2
} catch (error) {
  console.log('[EVENT_LISTENERS] OpenCode APIs not available - running in standalone mode')
}

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
    if (!Bus || !Session || !MessageV2) {
      console.log('[EVENT_LISTENERS] OpenCode APIs not available - event listeners will be initialized via manual calls')
      return
    }

    console.log('[EVENT_LISTENERS] Initializing OpenCode event listeners...')

    Bus.subscribe(Session.Event.Created, this.handleSessionCreated.bind(this))
    Bus.subscribe(MessageV2.Event.PartUpdated, this.handleMessagePartUpdated.bind(this))
    Bus.subscribe(Session.Event.Updated, this.handleSessionUpdated.bind(this))

    console.log('[EVENT_LISTENERS] Subscribed to OpenCode Bus events')
  }

  /**
   * Handle session creation - initialize claude-mem session
   * Uses real Session.Info from OpenCode
   */
  private async handleSessionCreated(event: {
    type: string
    properties: { info: any }
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

      if (response.skipped) {
        console.log(`[EVENT_LISTENERS] Session marked as private: ${openCodeSessionId}`)
        console.log(`[EVENT_LISTENERS] Reason: ${response.reason}`)
        return
      }

      this.sessionMapper.mapOpenCodeToClaudeMem(
        openCodeSessionId,
        response.sessionDbId
      )

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
    properties: { part: any }
  }): Promise<void> {
    const { part } = event.properties

    if (part.type !== 'tool_call') {
      return
    }

    const toolName = part.name
    const toolArgs = part.args
    const toolResult = part.result || ''
    const sessionId = part.sessionID
    const cwd = part.cwd || process.cwd()

    const claudeMemSessionId = this.sessionMapper.getClaudeMemSessionId(sessionId)
    if (!claudeMemSessionId) {
      console.log(`[EVENT_LISTENERS] No claude-mem session for: ${sessionId}`)
      return
    }

    const promptNumber = this.getPromptNumber(sessionId)
    console.log(`[EVENT_LISTENERS] Tool usage: ${sessionId} - ${toolName}`)

    try {
      const strippedArgs = this.privacyStripper.stripFromJson(toolArgs)
      const strippedResult = this.privacyStripper.stripFromText(toolResult)

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
    properties: { info: any }
  }): Promise<void> {
    const { info } = event.properties

    if (!info.time.archived) {
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
    const current = this.promptNumberTracker.get(sessionId) ?? 1
    this.promptNumberTracker.set(sessionId, current + 1)
  }
}
