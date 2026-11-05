import { WorkerClient, resolveWorkerBase } from './integration/worker-client.js';
import { EventListeners } from './integration/event-listeners.js';
function isV2Context(ctx) {
    return Boolean(ctx && typeof ctx.tool?.hook === 'function' && typeof ctx.session?.hook === 'function');
}
function makeIntegration(options) {
    const workerClient = new WorkerClient();
    const listeners = new EventListeners(workerClient);
    const doInject = options?.inject === true;
    const contexts = new Map();
    return { workerClient, listeners, inject: doInject, contexts };
}
function resultText(result) {
    const content = result?.content;
    if (typeof content === 'string')
        return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => (part?.type === 'text' ? part.text : `[${part?.type ?? 'content'}]`))
            .join('\n');
    }
    return '';
}
async function v2Setup(ctx) {
    const { listeners, inject: doInject, contexts } = makeIntegration();
    // Prompt: register the session with claude-mem.
    await ctx.session.hook('prompt', (event) => {
        const sessionID = String(event.sessionID ?? '');
        if (!sessionID)
            return;
        const promptText = String(event.prompt?.text ?? '');
        const cwd = typeof event.directory === 'string' ? event.directory : ctx.location?.directory;
        listeners.handlePrompt(sessionID, promptText, cwd);
    });
    // Tool execution: record an observation.
    await ctx.tool.hook('execute.after', (event) => {
        const sessionID = String(event.sessionID ?? '');
        if (!sessionID)
            return;
        const tool = String(event.tool ?? '');
        const response = event.status === 'completed'
            ? resultText(event.result)
            : `Error: ${event.error?.message ?? 'unknown error'}`;
        listeners.handleToolUse(sessionID, tool, event.input, response, String(event.id ?? ''), event.directory);
    });
    // Session lifecycle: summarize on success, end on archive/delete.
    const controller = new AbortController();
    void (async () => {
        try {
            for await (const event of ctx.event.subscribe({
                types: ['session.execution.succeeded', 'session.archived', 'session.deleted'],
                signal: controller.signal
            })) {
                const sessionID = String(event.data?.sessionID ?? '');
                if (!sessionID)
                    continue;
                if (event.type === 'session.execution.succeeded') {
                    listeners.handleSummarize(sessionID);
                }
                else {
                    listeners.handleSessionEnd(sessionID, event.type);
                }
            }
        }
        catch (error) {
            if (!controller.signal.aborted) {
                console.error('[CLAUDE_MEM] event stream ended:', error);
            }
        }
    })();
    if (doInject) {
        await ctx.session.hook('context', async (event) => {
            const sessionID = String(event.sessionID ?? '');
            if (!sessionID || contexts.has(sessionID)) {
                const existing = contexts.get(sessionID);
                if (existing)
                    event.system?.push?.({ type: 'text', text: `<claude-mem-context>\n${existing}\n</claude-mem-context>` });
                return;
            }
            const text = await listeners.getContext(sessionID);
            if (text) {
                contexts.set(sessionID, text);
                event.system?.push?.({ type: 'text', text: `<claude-mem-context>\n${text}\n</claude-mem-context>` });
            }
        });
    }
    // Teardown: stop the event stream and release hook registrations.
    return () => {
        controller.abort();
    };
}
export default {
    id: 'claude-mem',
    /**
     * OpenCode 2.x entrypoint. Reads `inject` from the plugin options and
     * registers the real capture hooks.
     */
    async setup(ctx) {
        const inject = ctx?.options?.inject === true;
        try {
            await v2Setup(ctx);
            console.log(`[CLAUDE_MEM] plugin ready (worker: ${resolveWorkerBase()}, inject: ${inject})`);
        }
        catch (error) {
            console.error('[CLAUDE_MEM] failed to register hooks:', error);
        }
    },
    /**
     * OpenCode 1.x entrypoint. Drives the same capture from the generic event
     * handler so the plugin still records when only the legacy shape loads.
     */
    async server() {
        const { listeners, contexts } = makeIntegration();
        return {
            event: async ({ event }) => {
                try {
                    const type = String(event.type ?? '');
                    const data = event.data ?? {};
                    if (type === 'message.updated' || type === 'session.created') {
                        const sessionID = String(data.sessionID ?? data.id ?? '');
                        if (sessionID) {
                            const text = String(data.text ?? data.title ?? '');
                            listeners.handlePrompt(sessionID, text, data.directory);
                        }
                        return;
                    }
                    if (type === 'tool.execute.after') {
                        const sessionID = String(data.sessionID ?? '');
                        if (!sessionID)
                            return;
                        const tool = String(data.tool ?? data.name ?? '');
                        const response = String(data.output ?? data.result ?? data.error ?? '');
                        listeners.handleToolUse(sessionID, tool, data.args ?? data.input, response, String(data.id ?? ''));
                        return;
                    }
                    if (type === 'session.idle' || type === 'session.compacted') {
                        const sessionID = String(data.sessionID ?? data.id ?? '');
                        if (sessionID)
                            listeners.handleSummarize(sessionID);
                        return;
                    }
                    if (type === 'session.deleted' || type === 'session.archived') {
                        const sessionID = String(data.sessionID ?? data.id ?? '');
                        if (sessionID)
                            listeners.handleSessionEnd(sessionID, type);
                    }
                }
                catch (error) {
                    console.error('[CLAUDE_MEM] event handler failed:', error);
                }
            }
        };
    }
};
//# sourceMappingURL=plugin.js.map