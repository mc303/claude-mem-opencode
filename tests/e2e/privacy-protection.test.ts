import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ClaudeMemIntegration } from '../../src/integration/index.js'
import { PrivacyTagStripper } from '../../src/integration/utils/privacy.js'

describe('End-to-End: Privacy Protection', () => {
  let integration: ClaudeMemIntegration
  let sessionId: number
  
  beforeAll(async () => {
    integration = new ClaudeMemIntegration()
    await integration.initialize()
    
    const result = await integration.getWorkerClient().initSession({
      contentSessionId: 'privacy-test',
      project: 'e2e-privacy-test',
      prompt: 'Privacy protection test'
    })
    sessionId = result.sessionDbId
  })
  
  afterAll(async () => {
    await integration.shutdown()
  })
  
  it('should strip <private> tags from tool input', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { 
        command: 'password',
        secret: '<private>api-key</private>'
      },
      toolOutput: 'output',
      cwd: '/test',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should strip <claude-mem-context> tags from tool output', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { command: 'test' },
      toolOutput: '<claude-mem-context>injected context</claude-mem-context>',
      cwd: '/test',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should handle nested privacy tags', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { 
        config: {
          password: '<private>secret</private>',
          settings: {
            key: '<private>another-secret</private>'
          }
        }
      },
      toolOutput: 'output',
      cwd: '/test',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should handle multiple privacy tags in single text', async () => {
    const result = await integration.getWorkerClient().addObservation({
      sessionDbId: sessionId,
      promptNumber: 1,
      toolName: 'bash',
      toolInput: { 
        command: 'test',
        data: '<private>secret1</private> and <private>secret2</private>'
      },
      toolOutput: '<private>output1</private> and <private>output2</private>',
      cwd: '/test',
      timestamp: Date.now()
    })
    
    expect(result.queued).toBeTrue()
  })
  
  it('should not strip malformed tags', async () => {
    const stripper = new PrivacyTagStripper()
    const text = 'This is <private not closed'
    const result = stripper.stripFromText(text)
    
    expect(result).toBe(text)
  })
})
