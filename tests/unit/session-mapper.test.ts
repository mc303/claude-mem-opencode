import { describe, it, expect, beforeEach } from 'bun:test'
import { SessionMapper } from '../../src/integration/session-mapper.js'

describe('SessionMapper', () => {
  let mapper: SessionMapper

  beforeEach(() => {
    mapper = new SessionMapper()
  })

  describe('mapOpenCodeToClaudeMem', () => {
    it('should map OpenCode session ID to claude-mem session ID', () => {
      mapper.mapOpenCodeToClaudeMem('session-123', 456)
      
      expect(mapper.getClaudeMemSessionId('session-123')).toBe(456)
      expect(mapper.getOpenCodeSessionId(456)).toBe('session-123')
    })

    it('should handle multiple sessions', () => {
      mapper.mapOpenCodeToClaudeMem('session-1', 1)
      mapper.mapOpenCodeToClaudeMem('session-2', 2)
      mapper.mapOpenCodeToClaudeMem('session-3', 3)
      
      expect(mapper.getClaudeMemSessionId('session-1')).toBe(1)
      expect(mapper.getClaudeMemSessionId('session-2')).toBe(2)
      expect(mapper.getClaudeMemSessionId('session-3')).toBe(3)
    })

    it('should overwrite existing mapping', () => {
      mapper.mapOpenCodeToClaudeMem('session-123', 456)
      mapper.mapOpenCodeToClaudeMem('session-123', 789)
      
      expect(mapper.getClaudeMemSessionId('session-123')).toBe(789)
      expect(mapper.getOpenCodeSessionId(456)).toBeUndefined()
      expect(mapper.getOpenCodeSessionId(789)).toBe('session-123')
    })
  })

  describe('getClaudeMemSessionId', () => {
    it('should return undefined for non-existent session', () => {
      expect(mapper.getClaudeMemSessionId('non-existent')).toBeUndefined()
    })

    it('should return correct claude-mem session ID', () => {
      mapper.mapOpenCodeToClaudeMem('session-123', 456)
      expect(mapper.getClaudeMemSessionId('session-123')).toBe(456)
    })
  })

  describe('getOpenCodeSessionId', () => {
    it('should return undefined for non-existent session', () => {
      expect(mapper.getOpenCodeSessionId(999)).toBeUndefined()
    })

    it('should return correct OpenCode session ID', () => {
      mapper.mapOpenCodeToClaudeMem('session-123', 456)
      expect(mapper.getOpenCodeSessionId(456)).toBe('session-123')
    })
  })

  describe('unmapSession', () => {
    it('should remove session mapping', () => {
      mapper.mapOpenCodeToClaudeMem('session-123', 456)
      mapper.unmapSession('session-123')
      
      expect(mapper.getClaudeMemSessionId('session-123')).toBeUndefined()
      expect(mapper.getOpenCodeSessionId(456)).toBeUndefined()
    })

    it('should handle non-existent session', () => {
      expect(() => mapper.unmapSession('non-existent')).not.toThrow()
    })

    it('should not affect other sessions', () => {
      mapper.mapOpenCodeToClaudeMem('session-1', 1)
      mapper.mapOpenCodeToClaudeMem('session-2', 2)
      mapper.unmapSession('session-1')
      
      expect(mapper.getClaudeMemSessionId('session-1')).toBeUndefined()
      expect(mapper.getClaudeMemSessionId('session-2')).toBe(2)
    })
  })

  describe('hasSession', () => {
    it('should return true for mapped session', () => {
      mapper.mapOpenCodeToClaudeMem('session-123', 456)
      expect(mapper.hasSession('session-123')).toBe(true)
    })

    it('should return false for non-existent session', () => {
      expect(mapper.hasSession('non-existent')).toBe(false)
    })
  })

  describe('getAllMappings', () => {
    it('should return empty Map for no mappings', () => {
      const mappings = mapper.getAllMappings()
      expect(mappings.size).toBe(0)
    })

    it('should return all mappings', () => {
      mapper.mapOpenCodeToClaudeMem('session-1', 1)
      mapper.mapOpenCodeToClaudeMem('session-2', 2)
      mapper.mapOpenCodeToClaudeMem('session-3', 3)

      const mappings = mapper.getAllMappings()
      expect(mappings.size).toBe(3)
      expect(mappings.get('session-1')).toBe(1)
      expect(mappings.get('session-2')).toBe(2)
      expect(mappings.get('session-3')).toBe(3)
    })
  })

  describe('clear', () => {
    it('should clear all mappings', () => {
      mapper.mapOpenCodeToClaudeMem('session-1', 1)
      mapper.mapOpenCodeToClaudeMem('session-2', 2)
      mapper.clear()

      expect(mapper.getAllMappings().size).toBe(0)
      expect(mapper.size()).toBe(0)
    })
  })

  describe('size', () => {
    it('should return 0 for no mappings', () => {
      expect(mapper.size()).toBe(0)
    })

    it('should return correct count', () => {
      mapper.mapOpenCodeToClaudeMem('session-1', 1)
      mapper.mapOpenCodeToClaudeMem('session-2', 2)
      mapper.mapOpenCodeToClaudeMem('session-3', 3)
      
      expect(mapper.size()).toBe(3)
    })
  })
})
