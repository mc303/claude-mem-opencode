/**
 * Inject claude-mem memory context into OpenCode sessions
 */

import { WorkerClient } from './worker-client.js'
import { ProjectNameExtractor } from './utils/project-name.js'

export class ContextInjector {
  private workerClient: WorkerClient
  private projectNameExtractor: ProjectNameExtractor

  constructor(workerClient: WorkerClient) {
    this.workerClient = workerClient
    this.projectNameExtractor = new ProjectNameExtractor()
  }

  /**
   * Inject memory context into a session
   * Called when session is created
   */
  async injectContext(project: string): Promise<string> {
    try {
      const context = await this.workerClient.getProjectContext(project)

      if (!context || !context.trim()) {
        console.log(`[CONTEXT_INJECTOR] No memory context available for project: ${project}`)
        return ''
      }

      console.log(`[CONTEXT_INJECTOR] Injected memory context for project: ${project} (${context.length} chars)`)

      return context
    } catch (error) {
      console.warn(`[CONTEXT_INJECTOR] Failed to inject memory context for project: ${project}`, error)
      return ''
    }
  }

  /**
   * Get memory context as system prompt addition
   */
  async getSystemPromptAddition(project: string): Promise<string> {
    const context = await this.injectContext(project)

    if (!context) return ''

    return `
## Relevant Context from Past Sessions

${context}

---
`
  }
}
