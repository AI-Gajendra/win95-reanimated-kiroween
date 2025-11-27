/**
 * Path utility functions for VFS
 */

export class PathUtils {
  /**
   * Normalize a path by removing redundant separators and resolving . and ..
   */
  static normalize(path: string): string {
    if (!path) return '/';
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remove trailing slash unless it's root
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Split and filter empty parts
    const parts = path.split('/').filter(p => p && p !== '.');
    
    // Resolve .. references
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    
    return resolved.length === 0 ? '/' : '/' + resolved.join('/');
  }

  /**
   * Join path components
   */
  static join(...parts: string[]): string {
    const joined = parts.join('/');
    return this.normalize(joined);
  }

  /**
   * Get the directory name (parent path)
   */
  static dirname(path: string): string {
    const normalized = this.normalize(path);
    if (normalized === '/') return '/';
    
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === 0) return '/';
    
    return normalized.substring(0, lastSlash);
  }

  /**
   * Get the base name (file or folder name)
   */
  static basename(path: string): string {
    const normalized = this.normalize(path);
    if (normalized === '/') return '/';
    
    const lastSlash = normalized.lastIndexOf('/');
    return normalized.substring(lastSlash + 1);
  }

  /**
   * Split path into components
   */
  static split(path: string): string[] {
    const normalized = this.normalize(path);
    if (normalized === '/') return [];
    
    return normalized.substring(1).split('/');
  }

  /**
   * Check if path is absolute
   */
  static isAbsolute(path: string): boolean {
    return path.startsWith('/');
  }
}
