/**
 * Unit tests for PathUtils
 * Tests path normalization, joining, dirname, basename, split, and edge cases
 * Requirements: All path-related operations
 */

import { describe, it, expect } from 'vitest';
import { PathUtils } from './pathUtils';

describe('PathUtils', () => {
  describe('normalize', () => {
    it('should return root for empty path', () => {
      expect(PathUtils.normalize('')).toBe('/');
    });

    it('should ensure path starts with /', () => {
      expect(PathUtils.normalize('documents')).toBe('/documents');
      expect(PathUtils.normalize('documents/file.txt')).toBe('/documents/file.txt');
    });

    it('should remove trailing slashes', () => {
      expect(PathUtils.normalize('/documents/')).toBe('/documents');
      expect(PathUtils.normalize('/documents/work/')).toBe('/documents/work');
    });

    it('should preserve root path', () => {
      expect(PathUtils.normalize('/')).toBe('/');
    });

    it('should resolve . references', () => {
      expect(PathUtils.normalize('/documents/./file.txt')).toBe('/documents/file.txt');
      expect(PathUtils.normalize('./documents')).toBe('/documents');
    });

    it('should resolve .. references', () => {
      expect(PathUtils.normalize('/documents/../pictures')).toBe('/pictures');
      expect(PathUtils.normalize('/documents/work/../file.txt')).toBe('/documents/file.txt');
    });

    it('should handle multiple consecutive slashes', () => {
      expect(PathUtils.normalize('/documents//file.txt')).toBe('/documents/file.txt');
      expect(PathUtils.normalize('//documents///work')).toBe('/documents/work');
    });

    it('should handle .. at root level', () => {
      expect(PathUtils.normalize('/../documents')).toBe('/documents');
      expect(PathUtils.normalize('/documents/../../pictures')).toBe('/pictures');
    });
  });

  describe('join', () => {
    it('should join path components', () => {
      expect(PathUtils.join('/documents', 'file.txt')).toBe('/documents/file.txt');
      expect(PathUtils.join('/', 'documents', 'work')).toBe('/documents/work');
    });

    it('should handle empty components', () => {
      expect(PathUtils.join('/documents', '', 'file.txt')).toBe('/documents/file.txt');
    });

    it('should normalize the result', () => {
      expect(PathUtils.join('/documents/', '/file.txt')).toBe('/documents/file.txt');
      expect(PathUtils.join('/documents', '../pictures')).toBe('/pictures');
    });
  });

  describe('dirname', () => {
    it('should return parent directory', () => {
      expect(PathUtils.dirname('/documents/file.txt')).toBe('/documents');
      expect(PathUtils.dirname('/documents/work/file.txt')).toBe('/documents/work');
    });

    it('should return root for top-level items', () => {
      expect(PathUtils.dirname('/documents')).toBe('/');
      expect(PathUtils.dirname('/file.txt')).toBe('/');
    });

    it('should return root for root path', () => {
      expect(PathUtils.dirname('/')).toBe('/');
    });
  });

  describe('basename', () => {
    it('should return file name', () => {
      expect(PathUtils.basename('/documents/file.txt')).toBe('file.txt');
      expect(PathUtils.basename('/documents/work/notes.md')).toBe('notes.md');
    });

    it('should return folder name', () => {
      expect(PathUtils.basename('/documents')).toBe('documents');
      expect(PathUtils.basename('/documents/work')).toBe('work');
    });

    it('should return root for root path', () => {
      expect(PathUtils.basename('/')).toBe('/');
    });
  });

  describe('split', () => {
    it('should split path into components', () => {
      expect(PathUtils.split('/documents/file.txt')).toEqual(['documents', 'file.txt']);
      expect(PathUtils.split('/documents/work/notes.md')).toEqual(['documents', 'work', 'notes.md']);
    });

    it('should return empty array for root', () => {
      expect(PathUtils.split('/')).toEqual([]);
    });

    it('should handle single component', () => {
      expect(PathUtils.split('/documents')).toEqual(['documents']);
    });
  });

  describe('isAbsolute', () => {
    it('should return true for absolute paths', () => {
      expect(PathUtils.isAbsolute('/documents')).toBe(true);
      expect(PathUtils.isAbsolute('/')).toBe(true);
      expect(PathUtils.isAbsolute('/documents/file.txt')).toBe(true);
    });

    it('should return false for relative paths', () => {
      expect(PathUtils.isAbsolute('documents')).toBe(false);
      expect(PathUtils.isAbsolute('documents/file.txt')).toBe(false);
      expect(PathUtils.isAbsolute('./documents')).toBe(false);
    });
  });
});
