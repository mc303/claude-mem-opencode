/**
 * HTTP client for the claude-mem worker API (15.x).
 *
 * Targets the worker API shipped with claude-mem >= 15.x, where every request
 * identifies the session by its OpenCode session ID (`contentSessionId`) plus
 * a `platformSource`, and observations use snake_case field names
 * (`tool_name`, `tool_input`, `tool_response`, `tool_use_id`).
 *
 * The worker port is discovered automatically from `~/.claude-mem/worker.pid`
 * (written by `claude-mem worker start`), or falls back to
 * `CLAUDE_MEM_WORKER_PORT` / `CLAUDE_MEM_WORKER_URL`, or the legacy 37777.
 * The legacy 8.x field names (`sessionDbId`, `toolName`, ...) are still accepted
 * on the request types for backward compatibility, but are not what 15.x needs.
 */

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Source platform tag sent with every 15.x request. */
export const PLATFORM_SOURCE = 'opencode'

/**
 * Port the legacy 8.x worker used. Kept only as a last-resort fallback; the
 * real port is read from the worker pid file.
 */
export const LEGACY_WORKER_PORT = 37777

/**
 * Resolve the worker base URL.
 *
 * Priority:
 * 1. `CLAUDE_MEM_WORKER_URL` (explicit full URL)
 * 2. `~/.claude-mem/worker.pid` (`{ port }` JSON, written by `claude-mem worker start`)
 * 3. `CLAUDE_MEM_WORKER_PORT`
 * 4. legacy 37777
 */
export function resolveWorkerBase(): string {
  const url = process.env.CLAUDE_MEM_WORKER_URL
  if (url) return url.replace(/\/$/, '')

  try {
    const pidFile = join(homedir(), '.claude-mem', 'worker.pid')
    if (existsSync(pidFile)) {
      const parsed = JSON.parse(readFileSync(pidFile, 'utf8'))
      if (typeof parsed.port === 'number') {
        return `http://127.0.0.1:${parsed.port}`
      }
    }
  } catch {
    // pid file missing or malformed - fall through
  }

  const port = process.env.CLAUDE_MEM_WORKER_PORT
  if (port) return `http://127.0.0.1:${port}`

  return `http://127.0.0.1:${LEGACY_WORKER_PORT}`
}

/**
 * 15.x session init request.
 *
 * 15.x keys the session by `contentSessionId` (the OpenCode session id) plus
 * `project` / `platformSource` / `cwd`.
 */
export interface InitSessionRequest {
  contentSessionId: string
  project: string
  prompt: string
  platformSource?: string
  cwd?: string
}

export interface InitSessionResponse {
  sessionDbId: number
  promptNumber: number
  skipped: boolean
  reason?: string
  contextInjected?: boolean
  status?: string
}

/**
 * 15.x observation request.
 *
 * Field names are snake_case and the session is keyed by `contentSessionId`,
 * not a numeric `sessionDbId`. `tool_name` and `tool_response` are required by
 * the worker's validation (a request without them is rejected with HTTP 400).
 */
export interface ObservationRequest {
  contentSessionId: string
  tool_name: string
  tool_input?: unknown
  tool_response?: string
  tool_use_id?: string
  cwd?: string
  platformSource?: string
  /** @deprecated 8.x field - not used by the 15.x worker. */
  sessionDbId?: number
  /** @deprecated 8.x field - not used by the 15.x worker. */
  promptNumber?: number
}

/** 15.x summarize request - triggers compression of the session. */
export interface SummarizeRequest {
  contentSessionId: string
  platformSource?: string
  cwd?: string
}

/** 15.x session-end request - archives/closes the session. */
export interface SessionEndRequest {
  contentSessionId: string
  platformSource?: string
  reason?: string
  cwd?: string
}

export class WorkerClient {
  private baseUrl: string
  private timeout: number = 30000

  /**
   * @param portOrUrl explicit base URL (string) or port (number). When omitted,
   *   the port is auto-detected from the worker pid file / env vars.
   */
  constructor(portOrUrl?: number | string) {
    if (typeof portOrUrl === 'string') {
      this.baseUrl = portOrUrl.replace(/\/$/, '')
    } else if (typeof portOrUrl === 'number') {
      this.baseUrl = `http://127.0.0.1:${portOrUrl}`
    } else {
      this.baseUrl = resolveWorkerBase()
    }
  }

  /**
   * Get worker port
   */
  getPort(): number {
    const match = this.baseUrl.match(/:(\d+)(?:\/|$)/)
    return match ? parseInt(match[1]) : LEGACY_WORKER_PORT
  }

  /**
   * Get worker URL
   */
  getWorkerUrl(): string {
    return this.baseUrl
  }

  /**
   * Check if worker is running (returns full health data)
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000)
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.log('[WORKER_CLIENT] Health check failed:', error)
      return { status: 'error', version: 'unknown' }
    }
  }

  /**
   * Check if worker is running (boolean)
   */
  async healthCheck(): Promise<boolean> {
    const result = await this.checkHealth()
    return result.status === 'ok' || result.status === undefined
  }

  /**
   * Wait for worker to be ready
   */
  async waitForReady(timeoutMs: number = 30000): Promise<boolean> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const ready = await this.readinessCheck()
      if (ready) return true
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    return false
  }

  /**
   * Check if worker is ready to accept requests.
   *
   * 15.x exposes `/api/health` but not always `/api/readiness`, so a healthy
   * response counts as ready.
   */
  async readinessCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/readiness`)
      if (response.ok) return true
    } catch {
      // fall through to health
    }
    try {
      const health = await this.checkHealth()
      return health.status === 'ok'
    } catch {
      return false
    }
  }

  private async postJson(path: string, body: unknown): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout)
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`)
    }
    const ct = response.headers.get('content-type') ?? ''
    return ct.includes('application/json') ? response.json() : null
  }

  /**
   * Initialize a new claude-mem session (15.x: keyed by contentSessionId).
   */
  async initSession(request: InitSessionRequest): Promise<InitSessionResponse> {
    const body: Record<string, unknown> = {
      ...request,
      platformSource: request.platformSource ?? PLATFORM_SOURCE
    }
    return this.postJson('/api/sessions/init', body)
  }

  /**
   * Add an observation (tool usage) to a session (15.x: snake_case fields).
   */
  async addObservation(request: ObservationRequest): Promise<any> {
    const body: Record<string, unknown> = {
      contentSessionId: request.contentSessionId,
      tool_name: request.tool_name,
      tool_input: request.tool_input ?? {},
      tool_response: request.tool_response ?? '',
      tool_use_id: request.tool_use_id ?? '',
      cwd: request.cwd,
      platformSource: request.platformSource ?? PLATFORM_SOURCE
    }
    return this.postJson('/api/sessions/observations', body)
  }

  /**
   * Complete a session (triggers summarization).
   *
   * 15.x endpoint. The 8.x `POST /sessions/:id/complete` path no longer
   * exists on 15.x workers (it returns 404).
   */
  async summarizeSession(contentSessionId: string, options?: { cwd?: string }): Promise<any> {
    return this.postJson('/api/sessions/summarize', {
      contentSessionId,
      platformSource: PLATFORM_SOURCE,
      cwd: options?.cwd
    })
  }

  /**
   * End/close a session (archives it and releases resources).
   *
   * 15.x endpoint.
   */
  async sessionEnd(contentSessionId: string, options?: { reason?: string; cwd?: string }): Promise<any> {
    return this.postJson('/api/sessions/session-end', {
      contentSessionId,
      platformSource: PLATFORM_SOURCE,
      reason: options?.reason,
      cwd: options?.cwd
    })
  }

  /**
   * Backward-compatibility alias.
   *
   * On 15.x workers "completing" a session maps to `/api/sessions/summarize`.
   * The caller is expected to hold the OpenCode session id as `sessionDbId`
   * for this legacy signature.
   */
  async completeSession(sessionDbId: number | string): Promise<any> {
    return this.summarizeSession(String(sessionDbId))
  }

  /**
   * Get memory context for a project (15.x: `/api/context/inject`).
   */
  async getProjectContext(project: string): Promise<string> {
    const url = `${this.baseUrl}/api/context/inject?project=${encodeURIComponent(project)}&platformSource=${PLATFORM_SOURCE}`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      throw new Error(`Context fetch failed: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  /**
   * Search memory (basic search, returns observation IDs)
   */
  async search(query: string, options?: {
    limit?: number
    type?: string
    project?: string
  }): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      limit: String(options?.limit ?? 10)
    })

    if (options?.type) params.append('type', options.type)
    if (options?.project) params.append('project', options.project)

    const response = await fetch(`${this.baseUrl}/api/search?${params}`, {
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Search memories (alias for search with object parameter)
   */
  async searchMemories(params: {
    query: string
    type?: string
    limit?: number
  }): Promise<any> {
    return this.search(params.query, {
      type: params.type,
      limit: params.limit
    })
  }

  /**
   * Get full observations by IDs
   */
  async getObservations(ids: number[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/observations/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      throw new Error(`Get observations failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get timeline context around an observation
   */
  async getTimeline(sessionDbId: number, observationId: number, window: number = 5): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/timeline?session=${sessionDbId}&observation=${observationId}&window=${window}`,
      {
        signal: AbortSignal.timeout(this.timeout)
      }
    )

    if (!response.ok) {
      throw new Error(`Timeline fetch failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}
