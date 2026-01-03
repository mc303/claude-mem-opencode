import { describe, it, expect } from 'bun:test'
import { PrivacyTagStripper } from '../../src/integration/utils/privacy'

describe('PrivacyTagStripper', () => {
  const stripper = new PrivacyTagStripper()

  describe('stripFromText', () => {
    it('should strip <private> tags', () => {
      const text = 'This is <private>secret</private> content'
      const result = stripper.stripFromText(text)
      expect(result).toBe('This is [private content removed] content')
    })

    it('should strip <claude-mem-context> tags', () => {
      const text = 'This is <claude-mem-context>context</claude-mem-context> content'
      const result = stripper.stripFromText(text)
      expect(result).toBe('This is [system context removed] content')
    })

    it('should strip multiple privacy tags', () => {
      const text = '<private>secret1</private> and <private>secret2</private>'
      const result = stripper.stripFromText(text)
      expect(result).toBe('[private content removed] and [private content removed]')
    })

    it('should strip mixed tags', () => {
      const text = '<private>secret</private> and <claude-mem-context>context</claude-mem-context>'
      const result = stripper.stripFromText(text)
      expect(result).toBe('[private content removed] and [system context removed]')
    })

    it('should handle nested tags', () => {
      const text = 'content <private>secret <more>nested</more></private>'
      const result = stripper.stripFromText(text)
      expect(result).toBe('content [private content removed]')
    })

    it('should handle multiline tags', () => {
      const text = 'start\n<private>secret\nmultiline</private>\nend'
      const result = stripper.stripFromText(text)
      expect(result).toBe('start\n[private content removed]\nend')
    })

    it('should not modify text without tags', () => {
      const text = 'This is normal text'
      const result = stripper.stripFromText(text)
      expect(result).toBe('This is normal text')
    })

    it('should handle empty string', () => {
      const result = stripper.stripFromText('')
      expect(result).toBe('')
    })

    it('should be case insensitive', () => {
      const text = 'test <PRIVATE>secret</PRIVATE> test'
      const result = stripper.stripFromText(text)
      expect(result).toBe('test [private content removed] test')
    })
  })

  describe('stripFromJson', () => {
    it('should strip tags from string values', () => {
      const obj = { password: '<private>secret</private>' }
      const result = stripper.stripFromJson(obj)
      expect(result.password).toBe('[private content removed]')
    })

    it('should strip tags from nested objects', () => {
      const obj = {
        config: {
          password: '<private>secret</private>',
          key: '<private>api-key</private>'
        }
      }
      const result = stripper.stripFromJson(obj)
      expect(result.config.password).toBe('[private content removed]')
      expect(result.config.key).toBe('[private content removed]')
    })

    it('should handle arrays', () => {
      const arr = ['<private>secret1</private>', 'normal', '<private>secret2</private>']
      const result = stripper.stripFromJson(arr)
      expect(result).toEqual(['[private content removed]', 'normal', '[private content removed]'])
    })

    it('should handle mixed types', () => {
      const obj = {
        string: '<private>secret</private>',
        number: 123,
        boolean: true,
        null: null,
        array: ['<private>secret</private>']
      }
      const result = stripper.stripFromJson(obj)
      expect(result.string).toBe('[private content removed]')
      expect(result.number).toBe(123)
      expect(result.boolean).toBe(true)
      expect(result.null).toBe(null)
      expect(result.array).toEqual(['[private content removed]'])
    })

    it('should handle complex nested structures', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              secret: '<private>deep</private>'
            }
          }
        }
      }
      const result = stripper.stripFromJson(obj)
      expect(result.level1.level2.level3.secret).toBe('[private content removed]')
    })
  })

  describe('hasPrivacyTags', () => {
    it('should detect <private> tags', () => {
      const text = 'This is <private>secret</private> content'
      expect(stripper.hasPrivacyTags(text)).toBe(true)
    })

    it('should detect <claude-mem-context> tags', () => {
      const text = 'This is <claude-mem-context>context</claude-mem-context>'
      expect(stripper.hasPrivacyTags(text)).toBe(true)
    })

    it('should return false for text without tags', () => {
      const text = 'This is normal text'
      expect(stripper.hasPrivacyTags(text)).toBe(false)
    })

    it('should be case insensitive', () => {
      const text = 'test <PRIVATE>secret</PRIVATE>'
      expect(stripper.hasPrivacyTags(text)).toBe(true)
    })
  })

  describe('countPrivacyTags', () => {
    it('should count <private> tags', () => {
      const text = '<private>a</private> and <private>b</private>'
      const result = stripper.countPrivacyTags(text)
      expect(result.private).toBe(2)
      expect(result.context).toBe(0)
    })

    it('should count <claude-mem-context> tags', () => {
      const text = '<claude-mem-context>a</claude-mem-context> and <claude-mem-context>b</claude-mem-context>'
      const result = stripper.countPrivacyTags(text)
      expect(result.private).toBe(0)
      expect(result.context).toBe(2)
    })

    it('should count mixed tags', () => {
      const text = '<private>a</private> and <claude-mem-context>b</claude-mem-context>'
      const result = stripper.countPrivacyTags(text)
      expect(result.private).toBe(1)
      expect(result.context).toBe(1)
    })

    it('should return zero for no tags', () => {
      const text = 'normal text'
      const result = stripper.countPrivacyTags(text)
      expect(result.private).toBe(0)
      expect(result.context).toBe(0)
    })
  })
})
