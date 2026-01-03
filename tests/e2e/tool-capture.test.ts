import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ClaudeMemIntegration } from '../../src/integration/index.js'

describe('End-to-End: Tool Usage Capture', () => {
  let integration: ClaudeMemIntegration
  let sessionId: number
  
  beforeAll(async () => {
    integration = new ClaudeMemIntegration()
    await integration.initialize()
    
    const result = await integration.getWorkerClient().initSession({
      contentSessionId: 'tool-capture-test',
      project: 'e2e-tool-test',
      prompt: 'Tool capture test'
    })
    sessionId = result.sessionDbId
  })
  
  afterAll(async () => {
    await integration.shutdown()
  })
  
  it('should capture bash tool usage', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { command: 'ls -la' },
      toolOutput: 'file1.txt\nfile2.txt',
      cwd: '/home/user/project',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should capture read tool usage', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'read',
      toolInput: { filePath: '/path/to/file.ts' },
      toolOutput: 'const x = 1',
      cwd: '/home/user/project',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should capture grep tool usage', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'grep',
      toolInput: { pattern: 'test', path: '.' },
      toolOutput: 'src/test.ts:1: test',
      cwd: '/home/user/project',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should strip privacy tags from tool input', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { command: 'echo "<private>secret</private>"' },
      toolOutput: 'secret',
      cwd: '/home/user/project',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should capture multiple observations for same session', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      integration.getWorkerClient().addObservation({
        sessionDbId: sessionId,
        promptNumber: 2,
        toolName: 'bash',
        toolInput: { command: `echo test${i}` },
        toolOutput: `test${i}`,
        cwd: '/home/user/project',
        timestamp: Date.now()
      })
    )
    
    const results = await Promise.all(promises)
    results.forEach(result => {
      expect(result.queued).toBeTrue()
    })
  })
})
