import { describe, it, expect } from 'bun:test'
import { ProjectNameExtractor } from '../../src/integration/utils/project-name.js'

describe('ProjectNameExtractor', () => {
  const extractor = new ProjectNameExtractor()

  it('should extract project name from simple path', () => {
    const result = extractor.extract('/home/user/my-project')
    expect(result).toBe('my-project')
  })

  it('should extract from nested path', () => {
    const result = extractor.extract('/home/user/projects/my-project/src')
    expect(result).toBe('src')
  })

  it('should handle path with special characters', () => {
    const result = extractor.extract('/home/user/my-project-v2.0')
    expect(result).toBe('my-project-v2.0')
  })

  it('should handle root path', () => {
    const result = extractor.extract('/')
    expect(result).toBe('')
  })

  it('should handle hidden directories', () => {
    const result = extractor.extract('/home/user/.git')
    expect(result).toBe('user')
  })
})
