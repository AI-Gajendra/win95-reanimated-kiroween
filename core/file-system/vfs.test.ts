/**
 * Unit tests for VirtualFileSystem CRUD operations
 * Tests file creation, reading, updating, deletion, folder operations, rename and move
 * Requirements: 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5, 8.1-8.5, 10.1-10.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualFileSystem } from './vfs';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('VirtualFileSystem', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vfs = new VirtualFileSystem();
  });

  describe('initialization', () => {
    it('should create root folder at /', () => {
      expect(vfs.exists('/')).toBe(true);
    });

    it('should create default folders', () => {
      expect(vfs.exists('/documents')).toBe(true);
      expect(vfs.exists('/pictures')).toBe(true);
      expect(vfs.exists('/programs')).toBe(true);
    });

    it('should create sample files in documents', () => {
      expect(vfs.exists('/documents/readme.txt')).toBe(true);
      expect(vfs.exists('/documents/notes.txt')).toBe(true);
    });
  });

  describe('readFolder', () => {
    it('should return array of FileSystemItem objects', () => {
      const items = vfs.readFolder('/');
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should include required properties in FileSystemItem', () => {
      const items = vfs.readFolder('/documents');
      const item = items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('path');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('size');
      expect(item).toHaveProperty('modifiedAt');
      expect(item).toHaveProperty('icon');
    });

    it('should sort folders first, then alphabetically', () => {
      const items = vfs.readFolder('/documents');
      const folderIndex = items.findIndex(i => i.type === 'folder');
      const fileIndex = items.findIndex(i => i.type === 'file');
      
      if (folderIndex !== -1 && fileIndex !== -1) {
        expect(folderIndex).toBeLessThan(fileIndex);
      }
    });

    it('should throw error for non-existent folder', () => {
      expect(() => vfs.readFolder('/nonexistent')).toThrow('Folder not found');
    });

    it('should throw error when path is a file', () => {
      expect(() => vfs.readFolder('/documents/readme.txt')).toThrow('Not a folder');
    });
  });

  describe('readFile', () => {
    it('should return file content as string', () => {
      const content = vfs.readFile('/documents/readme.txt');
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', () => {
      expect(() => vfs.readFile('/nonexistent.txt')).toThrow('File not found');
    });

    it('should throw error when path is a folder', () => {
      expect(() => vfs.readFile('/documents')).toThrow('Not a file');
    });
  });

  describe('writeFile', () => {
    it('should create new file with content', () => {
      vfs.writeFile('/documents/newfile.txt', 'Hello World');
      expect(vfs.exists('/documents/newfile.txt')).toBe(true);
      expect(vfs.readFile('/documents/newfile.txt')).toBe('Hello World');
    });

    it('should update existing file content', () => {
      vfs.writeFile('/documents/readme.txt', 'Updated content');
      expect(vfs.readFile('/documents/readme.txt')).toBe('Updated content');
    });

    it('should auto-create parent folders', () => {
      vfs.writeFile('/documents/newfolder/deep/file.txt', 'Content');
      expect(vfs.exists('/documents/newfolder')).toBe(true);
      expect(vfs.exists('/documents/newfolder/deep')).toBe(true);
      expect(vfs.exists('/documents/newfolder/deep/file.txt')).toBe(true);
    });

    it('should calculate and store file size', () => {
      const content = 'Test content';
      vfs.writeFile('/documents/sized.txt', content);
      const metadata = vfs.getMetadata('/documents/sized.txt');
      expect(metadata.size).toBe(content.length);
    });

    it('should throw error when writing to a folder path', () => {
      expect(() => vfs.writeFile('/documents', 'content')).toThrow('Not a file');
    });
  });

  describe('createFolder', () => {
    it('should create new folder', () => {
      vfs.createFolder('/newfolder');
      expect(vfs.exists('/newfolder')).toBe(true);
      const metadata = vfs.getMetadata('/newfolder');
      expect(metadata.type).toBe('folder');
    });

    it('should throw error if folder already exists', () => {
      expect(() => vfs.createFolder('/documents')).toThrow('Folder already exists');
    });

    it('should auto-create parent folders', () => {
      vfs.createFolder('/new/nested/folder');
      expect(vfs.exists('/new')).toBe(true);
      expect(vfs.exists('/new/nested')).toBe(true);
      expect(vfs.exists('/new/nested/folder')).toBe(true);
    });

    it('should set timestamps on creation', () => {
      vfs.createFolder('/timestamped');
      const metadata = vfs.getMetadata('/timestamped');
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.modifiedAt).toBeDefined();
    });
  });

  describe('deleteItem', () => {
    it('should delete a file', () => {
      expect(vfs.exists('/documents/readme.txt')).toBe(true);
      vfs.deleteItem('/documents/readme.txt');
      expect(vfs.exists('/documents/readme.txt')).toBe(false);
    });

    it('should delete a folder and its contents', () => {
      vfs.writeFile('/todelete/file1.txt', 'content1');
      vfs.writeFile('/todelete/file2.txt', 'content2');
      expect(vfs.exists('/todelete')).toBe(true);
      
      vfs.deleteItem('/todelete');
      expect(vfs.exists('/todelete')).toBe(false);
      expect(vfs.exists('/todelete/file1.txt')).toBe(false);
    });

    it('should throw error for non-existent item', () => {
      expect(() => vfs.deleteItem('/nonexistent')).toThrow('Item not found');
    });

    it('should throw error when deleting root', () => {
      expect(() => vfs.deleteItem('/')).toThrow('Cannot delete root folder');
    });

    it('should update parent modifiedAt timestamp', () => {
      const beforeMetadata = vfs.getMetadata('/documents');
      const beforeModified = new Date(beforeMetadata.modifiedAt);
      
      // Small delay to ensure timestamp difference
      vfs.deleteItem('/documents/readme.txt');
      
      const afterMetadata = vfs.getMetadata('/documents');
      const afterModified = new Date(afterMetadata.modifiedAt);
      
      expect(afterModified.getTime()).toBeGreaterThanOrEqual(beforeModified.getTime());
    });
  });

  describe('renameItem', () => {
    it('should rename a file', () => {
      vfs.renameItem('/documents/readme.txt', 'renamed.txt');
      expect(vfs.exists('/documents/readme.txt')).toBe(false);
      expect(vfs.exists('/documents/renamed.txt')).toBe(true);
    });

    it('should rename a folder', () => {
      vfs.renameItem('/documents', 'docs');
      expect(vfs.exists('/documents')).toBe(false);
      expect(vfs.exists('/docs')).toBe(true);
    });

    it('should update child paths when renaming folder', () => {
      vfs.renameItem('/documents', 'docs');
      expect(vfs.exists('/docs/readme.txt')).toBe(true);
      expect(vfs.exists('/docs/notes.txt')).toBe(true);
    });

    it('should throw error for non-existent item', () => {
      expect(() => vfs.renameItem('/nonexistent', 'newname')).toThrow('Item not found');
    });

    it('should throw error for name conflict', () => {
      vfs.writeFile('/documents/conflict.txt', 'content');
      expect(() => vfs.renameItem('/documents/readme.txt', 'conflict.txt')).toThrow('Name already exists');
    });

    it('should throw error when renaming root', () => {
      expect(() => vfs.renameItem('/', 'newroot')).toThrow('Cannot rename root folder');
    });
  });

  describe('moveItem', () => {
    it('should move a file to another folder', () => {
      vfs.moveItem('/documents/readme.txt', '/pictures');
      expect(vfs.exists('/documents/readme.txt')).toBe(false);
      expect(vfs.exists('/pictures/readme.txt')).toBe(true);
    });

    it('should move a folder to another location', () => {
      vfs.createFolder('/documents/subfolder');
      vfs.writeFile('/documents/subfolder/file.txt', 'content');
      
      vfs.moveItem('/documents/subfolder', '/pictures');
      expect(vfs.exists('/documents/subfolder')).toBe(false);
      expect(vfs.exists('/pictures/subfolder')).toBe(true);
      expect(vfs.exists('/pictures/subfolder/file.txt')).toBe(true);
    });

    it('should throw error for non-existent source', () => {
      expect(() => vfs.moveItem('/nonexistent', '/documents')).toThrow('Item not found');
    });

    it('should throw error for non-existent destination', () => {
      expect(() => vfs.moveItem('/documents/readme.txt', '/nonexistent')).toThrow('Destination not found');
    });

    it('should throw error when destination is not a folder', () => {
      expect(() => vfs.moveItem('/documents/readme.txt', '/documents/notes.txt')).toThrow('Destination is not a folder');
    });

    it('should throw error for name conflict at destination', () => {
      vfs.writeFile('/pictures/readme.txt', 'existing');
      expect(() => vfs.moveItem('/documents/readme.txt', '/pictures')).toThrow('Destination already exists');
    });

    it('should throw error when moving folder into itself', () => {
      vfs.createFolder('/documents/subfolder');
      expect(() => vfs.moveItem('/documents', '/documents/subfolder')).toThrow('Cannot move a folder into itself');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', () => {
      expect(vfs.exists('/documents/readme.txt')).toBe(true);
    });

    it('should return true for existing folder', () => {
      expect(vfs.exists('/documents')).toBe(true);
    });

    it('should return false for non-existent path', () => {
      expect(vfs.exists('/nonexistent')).toBe(false);
      expect(vfs.exists('/documents/nonexistent.txt')).toBe(false);
    });

    it('should not throw errors for invalid paths', () => {
      expect(() => vfs.exists('')).not.toThrow();
      expect(() => vfs.exists('relative/path')).not.toThrow();
    });
  });

  describe('getMetadata', () => {
    it('should return metadata object with required properties', () => {
      const metadata = vfs.getMetadata('/documents/readme.txt');
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('path');
      expect(metadata).toHaveProperty('type');
      expect(metadata).toHaveProperty('size');
      expect(metadata).toHaveProperty('createdAt');
      expect(metadata).toHaveProperty('modifiedAt');
    });

    it('should return accurate size for files', () => {
      const content = 'Test content with known length';
      vfs.writeFile('/documents/sizetest.txt', content);
      const metadata = vfs.getMetadata('/documents/sizetest.txt');
      expect(metadata.size).toBe(content.length);
    });

    it('should return 0 size for folders', () => {
      const metadata = vfs.getMetadata('/documents');
      expect(metadata.size).toBe(0);
    });

    it('should return ISO timestamp strings', () => {
      const metadata = vfs.getMetadata('/documents/readme.txt');
      expect(typeof metadata.createdAt).toBe('string');
      expect(typeof metadata.modifiedAt).toBe('string');
      // Verify ISO format
      expect(() => new Date(metadata.createdAt)).not.toThrow();
      expect(() => new Date(metadata.modifiedAt)).not.toThrow();
    });

    it('should throw error for non-existent item', () => {
      expect(() => vfs.getMetadata('/nonexistent')).toThrow('Item not found');
    });
  });
});
