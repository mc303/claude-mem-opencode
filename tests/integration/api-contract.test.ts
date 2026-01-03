import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { WorkerClient } from '../../src/integration/worker-client.js'

describe('Integration: API Contract', () => {
  let client: WorkerClient
  let sessionId: number

  beforeAll(async () => {
    client = new WorkerClient('http://localhost:37777')
  })

  afterAll(async () => {
    if (sessionId) {
      try {
        await client.completeSession(sessionId)
      } catch (error) {
        console.log('Cleanup failed:', error)
      }
    }
  })

  describe('GET /api/health', () => {
    it('should return valid health response', async () => {
      const response = await client.checkHealth()
      
      expect(response.status).toBe('ok' || 'error')
      expect(response.version).toBeDefined()
      expect(typeof response.version).toBe('string')
      expect(response.apiVersion).toBeDefined()
      expect(typeof response.apiVersion).toBe('string')
    })

    it('should follow semver version format', async () => {
      const response = await client.checkHealth()
      const versionRegex = /^\d+\.\d+\.\d+$/
      
      expect(versionRegex.test(response.version)).toBe(true)
    })
  })

  describe('POST /api/sessions/init', () => {
    it('should initialize session with valid response', async () => {
      const response = await client.initSession({
        contentSessionId: 'api-contract-test',
        project: 'test-project',
        prompt: 'Test prompt'
      })
      
      expect(response.sessionDbId).toBeDefined()
      expect(typeof response.sessionDbId).toBe('number')
      expect(response.sessionDbId).toBeGreaterThan(0)
      expect(response.promptNumber).toBeDefined()
      expect(typeof response.promptNumber).toBe('number')
      expect(response.promptNumber).toBeGreaterThan(0)
      expect(response.skipped).toBeDefined()
      expect(typeof response.skipped).toBe('boolean')
      
      sessionId = response.sessionDbId
    })

    it('should handle empty prompt', async () => {
      const response = await client.initSession({
        contentSessionId: 'empty-prompt-test',
        project: 'test-project',
        prompt: ''
      })
      
      expect(response.sessionDbId).toBeDefined()
    })

    it('should handle special characters in project name', async () => {
      const response = await client.initSession({
        contentSessionId: 'special-chars-test',
        project: 'test-project_2025',
        prompt: 'Test prompt'
      })
      
      expect(response.sessionDbId).toBeDefined()
    })
  })

  describe('POST /api/observations/queue', () => {
    beforeAll(async () => {
      if (!sessionId) {
        const response = await client.initSession({
          contentSessionId: 'queue-test',
          project: 'test-project',
          prompt: 'Test prompt'
        })
        sessionId = response.sessionDbId
      }
    })

    it('should queue observation with valid response', async () => {
      const response = await client.addObservation({
        sessionDbId: sessionId,
        promptNumber: 1,
        toolName: 'bash',
        toolInput: { command: 'echo test' },
        toolOutput: 'test',
        cwd: '/test',
        timestamp: Date.now()
      })
      
      expect(response.queued).toBeDefined()
      expect(typeof response.queued).toBe('boolean')
      expect(response.queued).toBe(true)
      expect(response.observationId).toBeDefined()
      expect(typeof response.observationId).toBe('number')
    })

    it('should handle large tool output', async () => {
      const largeOutput = 'test'.repeat(10000)
      const response = await client.addObservation({
        sessionDbId: sessionId,
        promptNumber: 1,
        toolName: 'bash',
        toolInput: { command: 'cat large' },
        toolOutput: largeOutput,
        cwd: '/test',
        timestamp: Date.now()
      })
      
      expect(response.queued).toBe(true)
    })

    it('should handle complex tool input', async () => {
      const complexInput = {
        command: 'grep',
        pattern: 'test',
        path: '.',
        options: { recursive: true, ignoreCase: true }
      }
      const response = await client.addObservation({
        sessionDbId: sessionId,
        promptNumber: 1,
        toolName: 'grep',
        toolInput: complexInput,
        toolOutput: 'results',
        cwd: '/test',
        timestamp: Date.now()
      })
      
      expect(response.queued).toBe(true)
    })
  })

  describe('POST /api/sessions/complete/:id', () => {
    let completeSessionId: number

    beforeAll(async () => {
      const response = await client.initSession({
        contentSessionId: 'complete-test',
        project: 'test-project',
        prompt: 'Test prompt'
      })
      completeSessionId = response.sessionDbId
    })

    it('should complete session with valid response', async () => {
      const response = await client.completeSession(completeSessionId)
      
      expect(response.success).toBeDefined()
      expect(typeof response.success).toBe('boolean')
      expect(response.success).toBe(true)
      expect(response.compressed).toBeDefined()
      expect(typeof response.compressed).toBe('boolean')
    })

    it('should handle non-existent session', async () => {
      await expect(client.completeSession(999999)).rejects.toThrow()
    })
  })

  describe('GET /api/observations/context/:project', () => {
    it('should return valid context response', async () => {
      const response = await client.getProjectContext('test-project')
      
      expect(response.context).toBeDefined()
      expect(typeof response.context).toBe('string')
      expect(response.memories).toBeDefined()
      expect(typeof response.memories).toBe('number')
    })

    it('should handle project with no memories', async () => {
      const response = await client.getProjectContext('non-existent-project')
      
      expect(response.context).toBeDefined()
      expect(response.memories).toBe(0)
    })

    it('should handle special characters in project name', async () => {
      const response = await client.getProjectContext('test-project_2025')
      
      expect(response.context).toBeDefined()
    })
  })

  describe('GET /api/observations/search', () => {
    it('should return valid search response', async () => {
      const response = await client.searchMemories({
        query: 'test',
        type: 'all'
      })
      
      expect(response.results).toBeDefined()
      expect(Array.isArray(response.results)).toBe(true)
      expect(response.total).toBeDefined()
      expect(typeof response.total).toBe('number')
    })

    it('should filter by type', async () => {
      const response = await client.searchMemories({
        query: 'test',
        type: 'bash'
      })
      
      expect(response.results).toBeArray()
      response.results.forEach(result => {
        expect(result.toolName).toBe('bash')
      })
    })

    it('should handle limit parameter', async () => {
      const response = await client.searchMemories({
        query: 'test',
        limit: 5
      })
      
      expect(response.results.length).toBeLessThanOrEqual(5)
    })

    it('should handle empty search results', async () => {
      const response = await client.searchMemories({
        query: 'nonexistent-unique-term-xyz123',
        type: 'all'
      })
      
      expect(response.results).toEqual([])
      expect(response.total).toBe(0)
    })

    it('should handle special characters in query', async () => {
      const response = await client.searchMemories({
        query: 'test_2025!',
        type: 'all'
      })
      
      expect(response.results).toBeArray()
    })
  })
})
