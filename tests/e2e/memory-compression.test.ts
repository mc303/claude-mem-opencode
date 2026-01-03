import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ClaudeMemIntegration } from '../../src/integration/index.js'

describe('End-to-End: Memory Compression', () => {
  let integration: ClaudeMemIntegration
  let sessionId: number
  
  beforeAll(async () => {
    integration = new ClaudeMemIntegration()
    await integration.initialize()
    
    const result = await integration.getWorkerClient().initSession({
      contentSessionId: 'compression-test',
      project: 'e2e-compression-test',
      prompt: 'Compression test'
    })
    sessionId = result.sessionDbId
  })
  
  afterAll(async () => {
    await integration.shutdown()
  })
  
  it('should queue multiple observations before compression', async () => {
    const observations = Array.from({ length: 10 }, (_, i) =>
      integration.getWorkerClient().addObservation({
        sessionDbId: sessionId,
        promptNumber: 1,
        toolName: 'bash',
        toolInput: { command: `echo test${i}` },
        toolOutput: `output${i}`.repeat(100),
        cwd: '/test',
        timestamp: Date.now()
      })
    )
    
    const results = await Promise.all(observations)
    results.forEach(result => {
      expect(result.queued).toBeTrue()
    })
  })
  
  it('should trigger compression on session complete', async () => {
    const result = await integration.getWorkerClient().completeSession(sessionId)
    
    expect(result.success).toBeTrue()
    expect(result.compressed).toBeTrue()
  })
  
  it('should have compressed memory available after completion', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const context = await integration.getProjectContext()
    
    expect(context).toBeDefined()
    expect(context.length).toBeGreaterThan(0)
    expect(context.length).toBeLessThan(10000)
  })
})
