import { WorkerClient, resolveWorkerBase } from './integration/worker-client.js'
import { EventListeners } from './integration/event-listeners.js'

/**
 * OpenCode plugin for claude-mem (15.x).
 *
 * Exports a single default object that satisfies BOTH OpenCode plugin shapes:
 *
 * - OpenCode 2.x (object form): `setup(ctx)` receives a context with
 *   `ctx.session.hook(...)`, `ctx.tool.hook(...)` and `ctx.event.subscribe(...)`.
 *   The registered hooks are what actually drive capture.
 *
 * - OpenCode 1.x (function form): the returned `event: ({event}) => ...`
 *   handler also drives capture from the generic event stream, so the plugin
 *   works even when only the legacy shape is loaded.
 *
 * Capture is best-effort and never throws into OpenCode: every handler is
 * wrapped, and a missing/slow worker only logs.
 */

type PluginContext = any

function isV2Context(ctx: PluginContext): boolean {
  return Boolean(ctx && typeof ctx.tool?.hook === 'function' && typeof ctx.session?.hook === 'function')
}

function makeIntegration(options?: { inject?: boolean }) {
  const workerClient = new WorkerClient()
  const listeners = new EventListeners(workerClient)
  const doInject = options?.inject === true
  const contexts = new Map<string, string>()
  return { workerClient, listeners, inject: doInject, contexts }
}

function resultText(result: any): string {
  const content = result?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (part?.type === 'text' ? part.text : `[${part?.type ?? 'content'}]`))
      .join('\n')
  }
  return ''
}

async function v2Setup(ctx: PluginContext) {
  const { listeners, inject: doInject, contexts } = makeIntegration()

  // Prompt: register the session with claude-mem.
  await ctx.session.hook('prompt', (event: any) => {
    const sessionID = String(event.sessionID ?? '')
    if (!sessionID) return
    const promptText = String(event.prompt?.text ?? '')
    const cwd = typeof event.directory === 'string' ? event.directory : ctx.location?.directory
    listeners.handlePrompt(sessionID, promptText, cwd)
  })

  // Tool execution: record an observation.
  await ctx.tool.hook('execute.after', (event: any) => {
    const sessionID = String(event.sessionID ?? '')
    if (!sessionID) return
    const tool = String(event.tool ?? '')
    const response =
      event.status === 'completed'
        ? resultText(event.result)
        : `Error: ${event.error?.message ?? 'unknown error'}`
    listeners.handleToolUse(sessionID, tool, event.input, response, String(event.id ?? ''), event.directory)
  })

  // Session lifecycle: summarize on success, end on archive/delete.
  const controller = new AbortController()
  void (async () => {
    try {
      for await (const event of ctx.event.subscribe({
        types: ['session.execution.succeeded', 'session.archived', 'session.deleted'],
        signal: controller.signal
      })) {
        const sessionID = String((event as any).data?.sessionID ?? '')
        if (!sessionID) continue
        if (event.type === 'session.execution.succeeded') {
          listeners.handleSummarize(sessionID)
        } else {
          listeners.handleSessionEnd(sessionID, event.type)
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('[CLAUDE_MEM] event stream ended:', error)
      }
    }
  })()

  if (doInject) {
    await ctx.session.hook('context', async (event: any) => {
      const sessionID = String(event.sessionID ?? '')
      if (!sessionID || contexts.has(sessionID)) {
        const existing = contexts.get(sessionID)
        if (existing) event.system?.push?.({ type: 'text', text: `<claude-mem-context>\n${existing}\n</claude-mem-context>` })
        return
      }
      const text = await listeners.getContext(sessionID)
      if (text) {
        contexts.set(sessionID, text)
        event.system?.push?.({ type: 'text', text: `<claude-mem-context>\n${text}\n</claude-mem-context>` })
      }
    })
  }

  // Teardown: stop the event stream and release hook registrations.
  return () => {
    controller.abort()
  }
}

export default {
  id: 'claude-mem',

  /**
   * OpenCode 2.x entrypoint. Reads `inject` from the plugin options and
   * registers the real capture hooks.
   */
  async setup(ctx: PluginContext) {
    const inject = ctx?.options?.inject === true
    try {
      await v2Setup(ctx)
      console.log(`[CLAUDE_MEM] plugin ready (worker: ${resolveWorkerBase()}, inject: ${inject})`)
    } catch (error) {
      console.error('[CLAUDE_MEM] failed to register hooks:', error)
    }
  },

  /**
   * OpenCode 1.x entrypoint. Drives the same capture from the generic event
   * handler so the plugin still records when only the legacy shape loads.
   */
  async server() {
    const { listeners, contexts } = makeIntegration()
    return {
      event: async ({ event }: { event: any }) => {
        try {
          const type = String(event.type ?? '')
          const data = event.data ?? {}

          if (type === 'message.updated' || type === 'session.created') {
            const sessionID = String(data.sessionID ?? data.id ?? '')
            if (sessionID) {
              const text = String(data.text ?? data.title ?? '')
              listeners.handlePrompt(sessionID, text, data.directory)
            }
            return
          }

          if (type === 'tool.execute.after') {
            const sessionID = String(data.sessionID ?? '')
            if (!sessionID) return
            const tool = String(data.tool ?? data.name ?? '')
            const response = String(data.output ?? data.result ?? data.error ?? '')
            listeners.handleToolUse(sessionID, tool, data.args ?? data.input, response, String(data.id ?? ''))
            return
          }

          if (type === 'session.idle' || type === 'session.compacted') {
            const sessionID = String(data.sessionID ?? data.id ?? '')
            if (sessionID) listeners.handleSummarize(sessionID)
            return
          }

          if (type === 'session.deleted' || type === 'session.archived') {
            const sessionID = String(data.sessionID ?? data.id ?? '')
            if (sessionID) listeners.handleSessionEnd(sessionID, type)
          }
        } catch (error) {
          console.error('[CLAUDE_MEM] event handler failed:', error)
        }
      }
    }
  }
}
