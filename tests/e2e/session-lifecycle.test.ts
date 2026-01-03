import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ClaudeMemIntegration } from '../../src/integration/index.js'

describe('End-to-End: Session Lifecycle', () => {
  let integration: ClaudeMemIntegration
  const testSessionId = 'test-e2e-session-' + Date.now()
  
  beforeAll(async () => {
    integration = new ClaudeMemIntegration()
    await integration.initialize()
  })
  
  afterAll(async () => {
    await integration.shutdown()
  })
  
  it('should initialize session successfully', async () => {
    const result = await integration.getWorkerClient().initSession({
      contentSessionId: testSessionId,
      project: 'e2e-test-project',
      prompt: 'Test E2E session'
    })
    
    expect(result.sessionDbId).toBeNumber()
    expect(result.sessionDbId).toBeGreaterThan(0)
    expect(result.promptNumber).toBeNumber()
    expect(result.promptNumber).toBe(1)
    expect(result.skipped).toBeFalse()
  })
  
  it('should capture tool usage as observation', async () => {
    const status = await integration.getStatus()
    
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: 1,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { command: 'ls -la' },
      toolOutput: 'file1.txt\nfile2.txt',
      cwd: '/test',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
    expect(result.observationId).toBeNumber()
  })
  
  it('should retrieve project context', async () => {
    const context = await integration.getProjectContext()
    
    expect(context).toBeDefined()
    expect(context.length).toBeGreaterThan(0)
  })
  
  it('should complete session successfully', async () => {
    const result = await integration.getWorkerClient().completeSession(1)
    
    expect(result.success).toBeTrue()
    expect(result.compressed).toBeTrue()
  })
})
