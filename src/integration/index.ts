/**
 * Main entry point for claude-mem OpenCode integration
 * Initializes worker client, event listeners, and context injection
 */

import { WorkerClient, resolveWorkerBase } from './worker-client.js'
import { EventListeners } from './event-listeners.js'
import { ContextInjector } from './context-injector.js'
import { SessionMapper } from './session-mapper.js'
import { ProjectNameExtractor } from './utils/project-name.js'
import { PrivacyTagStripper } from './utils/privacy.js'
import { Logger, LogLevel } from './utils/logger.js'

export interface ClaudeMemIntegrationOptions {
  /**
   * Explicit worker base URL. When omitted the port is auto-detected from
   * `~/.claude-mem/worker.pid` / `CLAUDE_MEM_WORKER_PORT` / `CLAUDE_MEM_WORKER_URL`.
   */
  workerUrl?: string
  /** Inject relevant memories into new sessions (off by default). */
  inject?: boolean
}

export class ClaudeMemIntegration {
  private workerClient: WorkerClient
  private eventListeners: EventListeners
  private contextInjector: ContextInjector
  private projectNameExtractor: ProjectNameExtractor
  private logger: Logger
  private initialized: boolean = false
  private memoryAvailable: boolean = false
  private inject: boolean

  constructor(options: string | ClaudeMemIntegrationOptions = {}) {
    const opts: ClaudeMemIntegrationOptions = typeof options === 'string'
      ? { workerUrl: options }
      : options

    // A missing worker is fine at construction time; readiness is checked in
    // initialize(). Port resolution happens here so the URL is logged early.
    this.workerClient = new WorkerClient(opts.workerUrl)
    this.inject = opts.inject === true
    this.eventListeners = new EventListeners(this.workerClient)
    this.contextInjector = new ContextInjector(this.workerClient)
    this.projectNameExtractor = new ProjectNameExtractor()
    this.logger = new Logger('CLAUDE_MEM')
  }

  /**
   * Initialize integration.
   *
   * Checks that the worker is reachable. Note that, on 15.x, the actual
   * capture is driven by the OpenCode plugin (see src/plugin.ts); this method
   * is for the library / manual-usage path.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[CLAUDE_MEM] Integration already initialized')
      return
    }

    try {
      console.log('[CLAUDE_MEM] Initializing claude-mem integration...')
      console.log(`[CLAUDE_MEM] Worker: ${this.workerClient.getWorkerUrl()}`)

      const ready = await this.workerClient.waitForReady(30000)

      if (!ready) {
        throw new Error(
          `Worker not ready at ${this.workerClient.getWorkerUrl()}. Is the claude-mem worker running?`
        )
      }

      console.log('[CLAUDE_MEM] Worker service is ready')

      await this.eventListeners.initialize()

      this.initialized = true
      this.memoryAvailable = true
      console.log('[CLAUDE_MEM] Integration initialized successfully')
      console.log('[CLAUDE_MEM] Project:', this.projectNameExtractor.getCurrentProject())
    } catch (error) {
      console.error('[CLAUDE_MEM] Initialization failed:', error)
      console.warn('[CLAUDE_MEM] Continuing anyway, but expect potential issues')
      this.memoryAvailable = false
    }
  }

  /**
   * Get integration status
   */
  async getStatus(): Promise<{
    initialized: boolean
    workerReady: boolean
    workerUrl: string
    currentProject: string
    inject: boolean
  }> {
    const workerReady = this.memoryAvailable && 
                        (await this.workerClient.healthCheck())

    return {
      initialized: this.initialized,
      workerReady,
      currentProject: this.projectNameExtractor.getCurrentProject(),
      workerUrl: this.workerClient.getWorkerUrl(),
      inject: this.inject
    }
  }

  /**
   * Get project context
   */
  async getProjectContext(project?: string): Promise<string | null> {
    if (!this.memoryAvailable) {
      this.logger.warn('Memory features are not available')
      return null
    }

    const projectToUse = project || this.projectNameExtractor.getCurrentProject()
    return this.contextInjector.injectContext(projectToUse)
  }

  /**
   * Search memories
   */
  async searchMemory(query: string, options?: {
    limit?: number
    type?: 'all' | 'code' | 'file' | 'web' | 'bash'
    project?: string
  }): Promise<any> {
    if (!this.memoryAvailable) {
      this.logger.warn('Memory features are not available')
      throw new Error('Memory features not available')
    }

    return this.workerClient.search(query, options)
  }

  /**
   * Shutdown integration
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down integration')
    this.initialized = false
    this.memoryAvailable = false
  }

  /**
   * Get worker client (for advanced usage)
   */
  getWorkerClient(): WorkerClient {
    return this.workerClient
  }

  /**
   * Get event listeners (for advanced usage)
   */
  getEventListeners(): EventListeners {
    return this.eventListeners
  }

  /**
   * Get context injector (for advanced usage)
   */
  getContextInjector(): ContextInjector {
    return this.contextInjector
  }

  /**
   * Check if memory features are available
   */
  isMemoryAvailable(): boolean {
    return this.memoryAvailable
  }
}

// Create singleton instance for convenience
const defaultInstance = new ClaudeMemIntegration()

// Export the class as default, and the singleton as a named export
export default ClaudeMemIntegration
export { defaultInstance }
