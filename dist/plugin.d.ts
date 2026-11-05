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
type PluginContext = any;
declare const _default: {
    id: string;
    /**
     * OpenCode 2.x entrypoint. Reads `inject` from the plugin options and
     * registers the real capture hooks.
     */
    setup(ctx: PluginContext): Promise<void>;
    /**
     * OpenCode 1.x entrypoint. Drives the same capture from the generic event
     * handler so the plugin still records when only the legacy shape loads.
     */
    server(): Promise<{
        event: ({ event }: {
            event: any;
        }) => Promise<void>;
    }>;
};
export default _default;
//# sourceMappingURL=plugin.d.ts.map