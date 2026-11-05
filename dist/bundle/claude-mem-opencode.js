// src/integration/worker-client.ts
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var PLATFORM_SOURCE = "opencode";
var LEGACY_WORKER_PORT = 37777;
function resolveWorkerBase() {
  const url = process.env.CLAUDE_MEM_WORKER_URL;
  if (url)
    return url.replace(/\/$/, "");
  try {
    const pidFile = join(homedir(), ".claude-mem", "worker.pid");
    if (existsSync(pidFile)) {
      const parsed = JSON.parse(readFileSync(pidFile, "utf8"));
      if (typeof parsed.port === "number") {
        return `http://127.0.0.1:${parsed.port}`;
      }
    }
  } catch {}
  const port = process.env.CLAUDE_MEM_WORKER_PORT;
  if (port)
    return `http://127.0.0.1:${port}`;
  return `http://127.0.0.1:${LEGACY_WORKER_PORT}`;
}

class WorkerClient {
  baseUrl;
  timeout = 30000;
  constructor(portOrUrl) {
    if (typeof portOrUrl === "string") {
      this.baseUrl = portOrUrl.replace(/\/$/, "");
    } else if (typeof portOrUrl === "number") {
      this.baseUrl = `http://127.0.0.1:${portOrUrl}`;
    } else {
      this.baseUrl = resolveWorkerBase();
    }
  }
  getPort() {
    const match = this.baseUrl.match(/:(\d+)(?:\/|$)/);
    return match ? parseInt(match[1]) : LEGACY_WORKER_PORT;
  }
  getWorkerUrl() {
    return this.baseUrl;
  }
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log("[WORKER_CLIENT] Health check failed:", error);
      return { status: "error", version: "unknown" };
    }
  }
  async healthCheck() {
    const result = await this.checkHealth();
    return result.status === "ok" || result.status === undefined;
  }
  async waitForReady(timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const ready = await this.readinessCheck();
      if (ready)
        return true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
  }
  async readinessCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/readiness`);
      if (response.ok)
        return true;
    } catch {}
    try {
      const health = await this.checkHealth();
      return health.status === "ok";
    } catch {
      return false;
    }
  }
  async postJson(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`);
    }
    const ct = response.headers.get("content-type") ?? "";
    return ct.includes("application/json") ? response.json() : null;
  }
  async initSession(request) {
    const body = {
      ...request,
      platformSource: request.platformSource ?? PLATFORM_SOURCE
    };
    return this.postJson("/api/sessions/init", body);
  }
  async addObservation(request) {
    const body = {
      contentSessionId: request.contentSessionId,
      tool_name: request.tool_name,
      tool_input: request.tool_input ?? {},
      tool_response: request.tool_response ?? "",
      tool_use_id: request.tool_use_id ?? "",
      cwd: request.cwd,
      platformSource: request.platformSource ?? PLATFORM_SOURCE
    };
    return this.postJson("/api/sessions/observations", body);
  }
  async summarizeSession(contentSessionId, options) {
    return this.postJson("/api/sessions/summarize", {
      contentSessionId,
      platformSource: PLATFORM_SOURCE,
      cwd: options?.cwd
    });
  }
  async sessionEnd(contentSessionId, options) {
    return this.postJson("/api/sessions/session-end", {
      contentSessionId,
      platformSource: PLATFORM_SOURCE,
      reason: options?.reason,
      cwd: options?.cwd
    });
  }
  async completeSession(sessionDbId) {
    return this.summarizeSession(String(sessionDbId));
  }
  async getProjectContext(project) {
    const url = `${this.baseUrl}/api/context/inject?project=${encodeURIComponent(project)}&platformSource=${PLATFORM_SOURCE}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      throw new Error(`Context fetch failed: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }
  async search(query, options) {
    const params = new URLSearchParams({
      q: query,
      limit: String(options?.limit ?? 10)
    });
    if (options?.type)
      params.append("type", options.type);
    if (options?.project)
      params.append("project", options.project);
    const response = await fetch(`${this.baseUrl}/api/search?${params}`, {
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  async searchMemories(params) {
    return this.search(params.query, {
      type: params.type,
      limit: params.limit
    });
  }
  async getObservations(ids) {
    const response = await fetch(`${this.baseUrl}/api/observations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      throw new Error(`Get observations failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  async getTimeline(sessionDbId, observationId, window = 5) {
    const response = await fetch(`${this.baseUrl}/api/timeline?session=${sessionDbId}&observation=${observationId}&window=${window}`, {
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      throw new Error(`Timeline fetch failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
}

// src/integration/session-mapper.ts
class SessionMapper {
  mapping = new Map;
  mapOpenCodeToClaudeMem(openCodeSessionId, claudeMemSessionId) {
    this.mapping.set(openCodeSessionId, claudeMemSessionId);
    console.log(`[SESSION_MAPPER] Mapped ${openCodeSessionId} → ${claudeMemSessionId}`);
  }
  getClaudeMemSessionId(openCodeSessionId) {
    return this.mapping.get(openCodeSessionId);
  }
  getOpenCodeSessionId(claudeMemSessionId) {
    for (const [openCodeId, claudeMemId] of this.mapping.entries()) {
      if (claudeMemId === claudeMemSessionId) {
        return openCodeId;
      }
    }
    return;
  }
  unmapSession(openCodeSessionId) {
    this.mapping.delete(openCodeSessionId);
    console.log(`[SESSION_MAPPER] Unmapped ${openCodeSessionId}`);
  }
  getAllMappings() {
    return new Map(this.mapping);
  }
  hasSession(openCodeSessionId) {
    return this.mapping.has(openCodeSessionId);
  }
  size() {
    return this.mapping.size;
  }
  clear() {
    this.mapping.clear();
    console.log("[SESSION_MAPPER] Cleared all mappings");
  }
}

// src/integration/utils/project-name.ts
import path from "path";

class ProjectNameExtractor {
  extract(directory) {
    const baseName = path.basename(directory);
    if (baseName.startsWith(".")) {
      const parent = path.dirname(directory);
      return path.basename(parent);
    }
    return baseName;
  }
  getCurrentProject() {
    return this.extract(process.cwd());
  }
}

// src/integration/utils/privacy.ts
class PrivacyTagStripper {
  PRIVATE_TAG_REGEX = /<private>[\s\S]*?<\/private>/gi;
  CONTEXT_TAG_REGEX = /<claude-mem-context>[\s\S]*?<\/claude-mem-context>/gi;
  stripFromText(text) {
    if (!text)
      return text;
    return text.replace(this.PRIVATE_TAG_REGEX, "[private content removed]").replace(this.CONTEXT_TAG_REGEX, "[system context removed]");
  }
  stripFromJson(obj) {
    if (typeof obj === "string") {
      return this.stripFromText(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.stripFromJson(item));
    }
    if (obj !== null && typeof obj === "object") {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.stripFromJson(value);
      }
      return result;
    }
    return obj;
  }
  isFullyPrivate(text) {
    const stripped = this.stripFromText(text);
    return stripped.trim().length === 0;
  }
  hasPrivacyTags(text) {
    return this.PRIVATE_TAG_REGEX.test(text) || this.CONTEXT_TAG_REGEX.test(text);
  }
  countPrivacyTags(text) {
    const privateMatches = text.match(this.PRIVATE_TAG_REGEX);
    const contextMatches = text.match(this.CONTEXT_TAG_REGEX);
    return {
      private: privateMatches ? privateMatches.length : 0,
      context: contextMatches ? contextMatches.length : 0
    };
  }
}

// src/integration/event-listeners.ts
var SKIP_TOOLS = new Set(["todowrite", "todoread"]);
var MAX_FIELD_CHARS = 50000;

class EventListeners {
  workerClient;
  sessionMapper;
  projectNameExtractor;
  privacyStripper;
  dbIds = new Map;
  cwds = new Map;
  skipped = new Set;
  queues = new Map;
  constructor(workerClient) {
    this.workerClient = workerClient;
    this.sessionMapper = new SessionMapper;
    this.projectNameExtractor = new ProjectNameExtractor;
    this.privacyStripper = new PrivacyTagStripper;
  }
  async initialize() {}
  enqueue(sessionId, work) {
    const next = (this.queues.get(sessionId) ?? Promise.resolve()).then(work).catch(() => {});
    this.queues.set(sessionId, next);
  }
  projectFor(sessionId) {
    const cwd = this.cwds.get(sessionId) ?? process.cwd();
    return this.projectNameExtractor.extract(cwd);
  }
  clip(text) {
    if (text.length <= MAX_FIELD_CHARS)
      return text;
    return `${text.slice(0, MAX_FIELD_CHARS)}
…[truncated ${text.length - MAX_FIELD_CHARS} chars]`;
  }
  strip(text) {
    return this.privacyStripper.stripFromText(text);
  }
  async handlePrompt(sessionId, promptText, cwd) {
    if (cwd)
      this.cwds.set(sessionId, cwd);
    this.enqueue(sessionId, async () => {
      try {
        const project = this.projectFor(sessionId);
        const response = await this.workerClient.initSession({
          contentSessionId: sessionId,
          project,
          prompt: this.clip(this.strip(promptText)) || "(no text)",
          cwd: this.cwds.get(sessionId),
          platformSource: "opencode"
        });
        if (response.skipped) {
          this.skipped.add(sessionId);
          return;
        }
        this.skipped.delete(sessionId);
        if (typeof response.sessionDbId === "number") {
          this.dbIds.set(sessionId, response.sessionDbId);
          this.sessionMapper.mapOpenCodeToClaudeMem(sessionId, response.sessionDbId);
        }
      } catch (error) {
        console.error(`[CLAUDE_MEM] init failed for ${sessionId}:`, error);
      }
    });
  }
  async handleToolUse(sessionId, tool, input, response, toolUseId, cwd) {
    if (SKIP_TOOLS.has(String(tool).toLowerCase()))
      return;
    if (cwd)
      this.cwds.set(sessionId, cwd);
    this.enqueue(sessionId, async () => {
      if (this.skipped.has(sessionId))
        return;
      try {
        let toolInput = input;
        if (typeof input === "string") {
          try {
            toolInput = JSON.parse(this.clip(this.strip(input)));
          } catch {
            toolInput = { raw: this.clip(this.strip(input)) };
          }
        } else {
          toolInput = this.privacyStripper.stripFromJson(input ?? {});
        }
        await this.workerClient.addObservation({
          contentSessionId: sessionId,
          tool_name: String(tool),
          tool_input: toolInput,
          tool_response: this.clip(this.strip(response ?? "")),
          tool_use_id: toolUseId ?? "",
          cwd: this.cwds.get(sessionId),
          platformSource: "opencode"
        });
      } catch (error) {
        console.error(`[CLAUDE_MEM] observation failed for ${sessionId} (${tool}):`, error);
      }
    });
  }
  async handleSummarize(sessionId) {
    this.enqueue(sessionId, async () => {
      if (this.skipped.has(sessionId))
        return;
      try {
        await this.workerClient.summarizeSession(sessionId, { cwd: this.cwds.get(sessionId) });
      } catch (error) {
        console.error(`[CLAUDE_MEM] summarize failed for ${sessionId}:`, error);
      }
    });
  }
  async handleSessionEnd(sessionId, reason) {
    this.enqueue(sessionId, async () => {
      try {
        await this.workerClient.sessionEnd(sessionId, {
          reason,
          cwd: this.cwds.get(sessionId)
        });
      } catch (error) {
        console.error(`[CLAUDE_MEM] session-end failed for ${sessionId}:`, error);
      } finally {
        this.queues.delete(sessionId);
        this.skipped.delete(sessionId);
        this.cwds.delete(sessionId);
        this.dbIds.delete(sessionId);
        this.sessionMapper.unmapSession(sessionId);
      }
    });
  }
  async getContext(sessionId) {
    const project = this.projectFor(sessionId);
    try {
      return await this.workerClient.getProjectContext(project);
    } catch (error) {
      console.warn(`[CLAUDE_MEM] context fetch failed for ${project}:`, error);
      return "";
    }
  }
  getClaudeMemSessionId(sessionId) {
    return this.dbIds.get(sessionId) ?? this.sessionMapper.getClaudeMemSessionId(sessionId);
  }
}

// src/integration/context-injector.ts
class ContextInjector {
  workerClient;
  projectNameExtractor;
  constructor(workerClient) {
    this.workerClient = workerClient;
    this.projectNameExtractor = new ProjectNameExtractor;
  }
  async injectContext(project) {
    try {
      const context = await this.workerClient.getProjectContext(project);
      if (!context || !context.trim()) {
        console.log(`[CONTEXT_INJECTOR] No memory context available for project: ${project}`);
        return "";
      }
      console.log(`[CONTEXT_INJECTOR] Injected memory context for project: ${project} (${context.length} chars)`);
      return context;
    } catch (error) {
      console.warn(`[CONTEXT_INJECTOR] Failed to inject memory context for project: ${project}`, error);
      return "";
    }
  }
  async getSystemPromptAddition(project) {
    const context = await this.injectContext(project);
    if (!context)
      return "";
    return `
## Relevant Context from Past Sessions

${context}

---
`;
  }
}

// src/integration/utils/logger.ts
var LogLevel;
((LogLevel) => {
  LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
  LogLevel[LogLevel["INFO"] = 1] = "INFO";
  LogLevel[LogLevel["WARN"] = 2] = "WARN";
  LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel ||= {});

class Logger {
  context;
  constructor(context) {
    this.context = context;
  }
  debug(message, ...args) {
    console.log(`[${this.context}] [DEBUG] ${message}`, ...args);
  }
  info(message, ...args) {
    console.log(`[${this.context}] [INFO] ${message}`, ...args);
  }
  warn(message, ...args) {
    console.warn(`[${this.context}] [WARN] ${message}`, ...args);
  }
  error(message, ...args) {
    console.error(`[${this.context}] [ERROR] ${message}`, ...args);
  }
}

// src/integration/index.ts
class ClaudeMemIntegration {
  workerClient;
  eventListeners;
  contextInjector;
  projectNameExtractor;
  logger;
  initialized = false;
  memoryAvailable = false;
  inject;
  constructor(options = {}) {
    const opts = typeof options === "string" ? { workerUrl: options } : options;
    this.workerClient = new WorkerClient(opts.workerUrl);
    this.inject = opts.inject === true;
    this.eventListeners = new EventListeners(this.workerClient);
    this.contextInjector = new ContextInjector(this.workerClient);
    this.projectNameExtractor = new ProjectNameExtractor;
    this.logger = new Logger("CLAUDE_MEM");
  }
  async initialize() {
    if (this.initialized) {
      console.log("[CLAUDE_MEM] Integration already initialized");
      return;
    }
    try {
      console.log("[CLAUDE_MEM] Initializing claude-mem integration...");
      console.log(`[CLAUDE_MEM] Worker: ${this.workerClient.getWorkerUrl()}`);
      const ready = await this.workerClient.waitForReady(30000);
      if (!ready) {
        throw new Error(`Worker not ready at ${this.workerClient.getWorkerUrl()}. Is the claude-mem worker running?`);
      }
      console.log("[CLAUDE_MEM] Worker service is ready");
      await this.eventListeners.initialize();
      this.initialized = true;
      this.memoryAvailable = true;
      console.log("[CLAUDE_MEM] Integration initialized successfully");
      console.log("[CLAUDE_MEM] Project:", this.projectNameExtractor.getCurrentProject());
    } catch (error) {
      console.error("[CLAUDE_MEM] Initialization failed:", error);
      console.warn("[CLAUDE_MEM] Continuing anyway, but expect potential issues");
      this.memoryAvailable = false;
    }
  }
  async getStatus() {
    const workerReady = this.memoryAvailable && await this.workerClient.healthCheck();
    return {
      initialized: this.initialized,
      workerReady,
      currentProject: this.projectNameExtractor.getCurrentProject(),
      workerUrl: this.workerClient.getWorkerUrl(),
      inject: this.inject
    };
  }
  async getProjectContext(project) {
    if (!this.memoryAvailable) {
      this.logger.warn("Memory features are not available");
      return null;
    }
    const projectToUse = project || this.projectNameExtractor.getCurrentProject();
    return this.contextInjector.injectContext(projectToUse);
  }
  async searchMemory(query, options) {
    if (!this.memoryAvailable) {
      this.logger.warn("Memory features are not available");
      throw new Error("Memory features not available");
    }
    return this.workerClient.search(query, options);
  }
  async shutdown() {
    this.logger.info("Shutting down integration");
    this.initialized = false;
    this.memoryAvailable = false;
  }
  getWorkerClient() {
    return this.workerClient;
  }
  getEventListeners() {
    return this.eventListeners;
  }
  getContextInjector() {
    return this.contextInjector;
  }
  isMemoryAvailable() {
    return this.memoryAvailable;
  }
}
var defaultInstance = new ClaudeMemIntegration;
var integration_default = ClaudeMemIntegration;
export {
  ClaudeMemIntegration,
  ContextInjector,
  EventListeners,
  LogLevel,
  Logger,
  PrivacyTagStripper,
  ProjectNameExtractor,
  SessionMapper,
  WorkerClient,
  integration_default as default,
  defaultInstance
};
