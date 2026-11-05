/**
 * Bridge OpenCode sessions to claude-mem (15.x worker API).
 *
 * This module intentionally does NOT import OpenCode internals (`@/bus`,
 * `@/session`). Those paths are private to the OpenCode package and cannot be
 * resolved from a plugin, so importing them silently disabled the whole
 * integration (the old behavior recorded nothing). Instead, the handler
 * methods here are plain, framework-agnostic entry points that the plugin
 * (`src/plugin.ts`) calls from OpenCode's own plugin hooks
 * (`tool.execute.after`, session lifecycle events).
 *
 * All work is best-effort: a missing or slow worker never throws out to
 * OpenCode.
 */

import { WorkerClient } from './worker-client.js'
import { SessionMapper } from './session-mapper.js'
import { ProjectNameExtractor } from './utils/project-name.js'
import { PrivacyTagStripper } from './utils/privacy.js'

/** Tools that carry no useful memory signal. */
const SKIP_TOOLS = new Set(['todowrite', 'todoread'])

/** Hard cap on a single observation field to avoid oversized payloads. */
const MAX_FIELD_CHARS = 50_000

export class EventListeners {
  private workerClient: WorkerClient
  private sessionMapper: SessionMapper
  private projectNameExtractor: ProjectNameExtractor
  private privacyStripper: PrivacyTagStripper
  /** OpenCode session ID -> claude-mem sessionDbId. */
  private dbIds = new Map<string, number>()
  /** OpenCode session ID -> working directory. */
  private cwds = new Map<string, string>()
  /** OpenCode session IDs the worker marked as private (skip capture). */
  private skipped = new Set<string>()
  /** Per-session FIFO so init always lands before that session's observations. */
  private queues = new Map<string, Promise<void>>()

  constructor(workerClient: WorkerClient) {
    this.workerClient = workerClient
    this.sessionMapper = new SessionMapper()
    this.projectNameExtractor = new ProjectNameExtractor()
    this.privacyStripper = new PrivacyTagStripper()
  }

  /**
   * Keep for backward compatibility with `integration.initialize()`.
   *
   * No-op now that event capture is driven by the plugin's OpenCode hooks.
   */
  async initialize(): Promise<void> {
    // No-op: handlers are invoked by the plugin (see src/plugin.ts).
  }

  private enqueue(sessionId: string, work: () => Promise<void>): void {
    const next = (this.queues.get(sessionId) ?? Promise.resolve())
      .then(work)
      .catch(() => {})
    this.queues.set(sessionId, next)
  }

  private projectFor(sessionId: string): string {
    const cwd = this.cwds.get(sessionId) ?? process.cwd()
    return this.projectNameExtractor.extract(cwd)
  }

  private clip(text: string): string {
    if (text.length <= MAX_FIELD_CHARS) return text
    return `${text.slice(0, MAX_FIELD_CHARS)}\n…[truncated ${text.length - MAX_FIELD_CHARS} chars]`
  }

  private strip(text: string): string {
    return this.privacyStripper.stripFromText(text)
  }

  /**
   * Called on a user prompt. Registers the OpenCode session with claude-mem.
   *
   * @param sessionId OpenCode session id
   * @param promptText the prompt text (privacy tags stripped by the caller)
   * @param cwd working directory for the session
   */
  async handlePrompt(sessionId: string, promptText: string, cwd?: string): Promise<void> {
    if (cwd) this.cwds.set(sessionId, cwd)
    this.enqueue(sessionId, async () => {
      try {
        const project = this.projectFor(sessionId)
        const response = await this.workerClient.initSession({
          contentSessionId: sessionId,
          project,
          prompt: this.clip(this.strip(promptText)) || '(no text)',
          cwd: this.cwds.get(sessionId),
          platformSource: 'opencode'
        })

        if (response.skipped) {
          this.skipped.add(sessionId)
          return
        }
        this.skipped.delete(sessionId)

        if (typeof response.sessionDbId === 'number') {
          this.dbIds.set(sessionId, response.sessionDbId)
          this.sessionMapper.mapOpenCodeToClaudeMem(sessionId, response.sessionDbId)
        }
      } catch (error) {
        console.error(`[CLAUDE_MEM] init failed for ${sessionId}:`, error)
      }
    })
  }

  /**
   * Called after a tool executes. Records a claude-mem observation.
   *
   * @param sessionId OpenCode session id
   * @param tool tool name
   * @param input tool input (object or JSON string)
   * @param response tool result text
   * @param toolUseId optional tool-use id
   * @param cwd working directory
   */
  async handleToolUse(
    sessionId: string,
    tool: string,
    input: unknown,
    response: string,
    toolUseId?: string,
    cwd?: string
  ): Promise<void> {
    if (SKIP_TOOLS.has(String(tool).toLowerCase())) return
    if (cwd) this.cwds.set(sessionId, cwd)

    this.enqueue(sessionId, async () => {
      if (this.skipped.has(sessionId)) return
      try {
        let toolInput: unknown = input
        if (typeof input === 'string') {
          try {
            toolInput = JSON.parse(this.clip(this.strip(input)))
          } catch {
            toolInput = { raw: this.clip(this.strip(input)) }
          }
        } else {
          toolInput = this.privacyStripper.stripFromJson(input ?? {})
        }

        await this.workerClient.addObservation({
          contentSessionId: sessionId,
          tool_name: String(tool),
          tool_input: toolInput,
          tool_response: this.clip(this.strip(response ?? '')),
          tool_use_id: toolUseId ?? '',
          cwd: this.cwds.get(sessionId),
          platformSource: 'opencode'
        })
      } catch (error) {
        console.error(`[CLAUDE_MEM] observation failed for ${sessionId} (${tool}):`, error)
      }
    })
  }

  /**
   * Called when a session's execution succeeds. Triggers compression.
   */
  async handleSummarize(sessionId: string): Promise<void> {
    this.enqueue(sessionId, async () => {
      if (this.skipped.has(sessionId)) return
      try {
        await this.workerClient.summarizeSession(sessionId, { cwd: this.cwds.get(sessionId) })
      } catch (error) {
        console.error(`[CLAUDE_MEM] summarize failed for ${sessionId}:`, error)
      }
    })
  }

  /**
   * Called when a session is archived or deleted. Closes the claude-mem session.
   */
  async handleSessionEnd(sessionId: string, reason?: string): Promise<void> {
    this.enqueue(sessionId, async () => {
      try {
        await this.workerClient.sessionEnd(sessionId, {
          reason,
          cwd: this.cwds.get(sessionId)
        })
      } catch (error) {
        console.error(`[CLAUDE_MEM] session-end failed for ${sessionId}:`, error)
      } finally {
        this.queues.delete(sessionId)
        this.skipped.delete(sessionId)
        this.cwds.delete(sessionId)
        this.dbIds.delete(sessionId)
        this.sessionMapper.unmapSession(sessionId)
      }
    })
  }

  /**
   * Fetch memory context for a session's project (used by the context hook).
   */
  async getContext(sessionId: string): Promise<string> {
    const project = this.projectFor(sessionId)
    try {
      return await this.workerClient.getProjectContext(project)
    } catch (error) {
      console.warn(`[CLAUDE_MEM] context fetch failed for ${project}:`, error)
      return ''
    }
  }

  /**
   * Get claude-mem session DB id for an OpenCode session (if known).
   */
  getClaudeMemSessionId(sessionId: string): number | undefined {
    return this.dbIds.get(sessionId) ?? this.sessionMapper.getClaudeMemSessionId(sessionId)
  }
}
