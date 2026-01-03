/**
 * Extract project name from directory path
 * Consistent with claude-mem's project name logic
 */

import path from 'path'

export class ProjectNameExtractor {
  /**
   * Extract project name from directory
   * Uses same logic as claude-mem's getProjectName()
   */
  extract(directory: string): string {
    // Get base directory name
    const baseName = path.basename(directory)

    // If it's a hidden directory, use parent
    if (baseName.startsWith('.')) {
      const parent = path.dirname(directory)
      return path.basename(parent)
    }

    return baseName
  }

  /**
   * Extract project name for current directory
   */
  getCurrentProject(): string {
    return this.extract(process.cwd())
  }
}
