import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { WorkerClient } from '../../src/integration/worker-client.js'

describe('WorkerClient', () => {
  let client: WorkerClient
  let mockServer: any

  beforeAll(async () => {
    mockServer = Bun.serve({
      port: 37888,
      async fetch(req) {
        const url = new URL(req.url)
        
        if (url.pathname === '/api/health') {
          return Response.json({
            status: 'ok',
            version: '1.0.0',
            apiVersion: '1.0'
          })
        }
        
        if (url.pathname === '/api/sessions/init' && req.method === 'POST') {
          return Response.json({
            sessionDbId: 123,
            promptNumber: 1,
            skipped: false
          })
        }
        
        if (url.pathname === '/api/sessions/observations' && req.method === 'POST') {
          return new Response(null, { status: 200 })
        }

        if (url.pathname.match(/^\/sessions\/\d+\/complete$/) && req.method === 'POST') {
          return new Response(null, { status: 200 })
        }

        if (url.pathname === '/api/context/inject' && url.searchParams.get('project') === 'test-project') {
          return new Response('Test memory context', { status: 200 })
        }
        
        if (url.pathname === '/api/search') {
          return Response.json({
            results: [
              { id: 1, toolName: 'bash', summary: 'Test command', timestamp: Date.now() }
            ],
            total: 1
          })
        }
        
        return new Response('Not found', { status: 404 })
      }
    })
    
    client = new WorkerClient('http://localhost:37888')
  })

  afterAll(() => {
    if (mockServer) {
      mockServer.stop()
    }
  })

  describe('checkHealth', () => {
    it('should return health status', async () => {
      const result = await client.checkHealth()

      expect(result.status).toBe('ok')
      expect(result.version).toBe('1.0.0')
      expect(result.apiVersion).toBe('1.0')
    })

    it('should handle server errors', async () => {
      const badClient = new WorkerClient('http://localhost:9999')

      const result = await badClient.checkHealth()
      expect(result.status).toBe('error')
      expect(result.version).toBe('unknown')
    })
  })

  describe('initSession', () => {
    it('should initialize session', async () => {
      const result = await client.initSession({
        contentSessionId: 'test-session',
        project: 'test-project',
        prompt: 'Test prompt'
      })
      
      expect(result.sessionDbId).toBe(123)
      expect(result.promptNumber).toBe(1)
      expect(result.skipped).toBe(false)
    })
  })

  describe('addObservation', () => {
    it('should add observation', async () => {
      const result = await client.addObservation({
        sessionDbId: 1,
        promptNumber: 1,
        toolName: 'bash',
        toolInput: { command: 'test' },
        toolOutput: 'output',
        cwd: '/test',
        timestamp: Date.now()
      })

      expect(result).toBeUndefined()
    })
  })

  describe('completeSession', () => {
    it('should complete session', async () => {
      const result = await client.completeSession(123)

      expect(result).toBeUndefined()
    })
  })

  describe('getProjectContext', () => {
    it('should get project context as text', async () => {
      const result = await client.getProjectContext('test-project')

      expect(result).toBe('Test memory context')
    })
  })

  describe('searchMemories', () => {
    it('should search memories', async () => {
      const result = await client.searchMemories({
        query: 'test',
        type: 'all'
      })
      
      expect(result.results).toBeArray()
      expect(result.results.length).toBe(1)
      expect(result.total).toBe(1)
    })

    it('should handle type filter', async () => {
      const result = await client.searchMemories({
        query: 'test',
        type: 'bash'
      })
      
      expect(result.results).toBeArray()
      expect(result.total).toBeNumber()
    })

    it('should handle limit', async () => {
      const result = await client.searchMemories({
        query: 'test',
        limit: 5
      })
      
      expect(result.results).toBeArray()
      expect(result.total).toBeNumber()
    })
  })

  describe('getWorkerUrl', () => {
    it('should return worker URL', () => {
      expect(client.getPort()).toBe(37888)
    })
  })
})
