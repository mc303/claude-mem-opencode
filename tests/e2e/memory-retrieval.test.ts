import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ClaudeMemIntegration } from '../../src/integration/index.js'

describe('End-to-End: Memory Retrieval', () => {
  let integration: ClaudeMemIntegration
  
  beforeAll(async () => {
    integration = new ClaudeMemIntegration()
    await integration.initialize()
  })
  
  afterAll(async () => {
    await integration.shutdown()
  })
  
  it('should search memories by query', async () => {
    const results = await integration.getWorkerClient().searchMemories({
      query: 'test',
      type: 'all'
    })
    
    expect(results.results).toBeArray()
    expect(results.total).toBeNumber()
  })
  
  it('should filter memories by type', async () => {
    const bashResults = await integration.getWorkerClient().searchMemories({
      query: 'test',
      type: 'bash'
    })
    
    expect(bashResults.results).toBeArray()
    bashResults.results.forEach(result => {
      expect(result.toolName).toBe('bash')
    })
  })
  
  it('should get project context', async () => {
    const context = await integration.getProjectContext()
    
    expect(context).toBeDefined()
    expect(typeof context).toBe('string')
  })
  
  it('should handle empty search results gracefully', async () => {
    const results = await integration.getWorkerClient().searchMemories({
      query: 'nonexistent-unique-term-xyz123',
      type: 'all'
    })
    
    expect(results.results).toBeArray()
    expect(results.results.length).toBe(0)
    expect(results.total).toBe(0)
  })
})
