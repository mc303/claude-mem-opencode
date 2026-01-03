/**
 * Bundle entry point for OpenCode
 * This file is bundled with all dependencies
 */

export { ClaudeMemIntegration, default as instance } from '../integration/index.js'
export { WorkerClient } from '../integration/worker-client.js'
export { EventListeners } from '../integration/event-listeners.js'
export { ContextInjector } from '../integration/context-injector.js'
export { Logger, LogLevel } from '../integration/utils/logger.js'
export { ProjectNameExtractor } from '../integration/utils/project-name.js'
export { PrivacyTagStripper } from '../integration/utils/privacy.js'
export { SessionMapper } from '../integration/session-mapper.js'
