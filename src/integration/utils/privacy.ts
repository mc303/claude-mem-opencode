/**
 * Strip privacy tags from text and JSON
 * Consistent with claude-mem's tag-stripping logic
 */

export class PrivacyTagStripper {
  private readonly PRIVATE_TAG_REGEX = /<private>[\s\S]*?<\/private>/gi
  private readonly CONTEXT_TAG_REGEX = /<claude-mem-context>[\s\S]*?<\/claude-mem-context>/gi

  /**
   * Strip privacy tags from text
   */
  stripFromText(text: string): string {
    if (!text) return text

    return text
      .replace(this.PRIVATE_TAG_REGEX, '[private content removed]')
      .replace(this.CONTEXT_TAG_REGEX, '[system context removed]')
  }

  /**
   * Strip privacy tags from JSON (recursive)
   */
  stripFromJson(obj: any): any {
    if (typeof obj === 'string') {
      return this.stripFromText(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.stripFromJson(item))
    }

    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.stripFromJson(value)
      }
      return result
    }

    return obj
  }

  /**
   * Check if text contains only private content
   */
  isFullyPrivate(text: string): boolean {
    const stripped = this.stripFromText(text)
    return stripped.trim().length === 0
  }

  /**
   * Check if text contains privacy tags
   */
  hasPrivacyTags(text: string): boolean {
    return this.PRIVATE_TAG_REGEX.test(text) || this.CONTEXT_TAG_REGEX.test(text)
  }

  /**
   * Count privacy tags in text
   */
  countPrivacyTags(text: string): { private: number; context: number } {
    const privateMatches = text.match(this.PRIVATE_TAG_REGEX)
    const contextMatches = text.match(this.CONTEXT_TAG_REGEX)

    return {
      private: privateMatches ? privateMatches.length : 0,
      context: contextMatches ? contextMatches.length : 0
    }
  }
}
