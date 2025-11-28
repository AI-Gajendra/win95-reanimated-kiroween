/**
 * Integration tests for VFS localStorage persistence
 * Tests save and load cycle, fallback to default structure, and handling of corrupted data
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualFileSystem } from './vfs';

describe('VFS Persistence', () => {
  let store: Record<string, string>;
  let localStorageMock: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
    };
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
    vi.clearAllMocks();
  });

  describe('save and load cycle', () => {
    it('should persist data to localStorage on file creation', () => {
      const vfs = new VirtualFileSystem();
      vfs.writeFile('/test.txt', 'test content');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('vfs-data', expect.any(String));
    });

    it('should persist data to localStorage on folder creation', () => {
      const vfs = new VirtualFileSystem();
      vfs.createFolder('/newfolder');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('vfs-data', expect.any(String));
    });

    it('should persist data to localStorage on file update', () => {
      const vfs = new VirtualFileSystem();
      const initialCallCount = localStorageMock.setItem.mock.calls.length;
      
      vfs.writeFile('/documents/readme.txt', 'updated content');
      
      expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should persist data to localStorage on deletion', () => {
      const vfs = new VirtualFileSystem();
      const initialCallCount = localStorageMock.setItem.mock.calls.length;
      
      vfs.deleteItem('/documents/readme.txt');
      
      expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should persist data to localStorage on rename', () => {
      const vfs = new VirtualFileSystem();
      const initialCallCount = localStorageMock.setItem.mock.calls.length;
      
      vfs.renameItem('/documents/readme.txt', 'renamed.txt');
      
      expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should persist data to localStorage on move', () => {
      const vfs = new VirtualFileSystem();
      const initialCallCount = localStorageMock.setItem.mock.calls.length;
      
      vfs.moveItem('/documents/readme.txt', '/pictures');
      
      expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should restore data from localStorage on initialization', () => {
      // Create VFS and make changes
      const vfs1 = new VirtualFileSystem();
      vfs1.writeFile('/custom/file.txt', 'custom content');
      
      // Get the saved data
      const savedData = store['vfs-data'];
      expect(savedData).toBeDefined();
      
      // Create new VFS instance - should load from localStorage
      const vfs2 = new VirtualFileSystem();
      
      expect(vfs2.exists('/custom/file.txt')).toBe(true);
      expect(vfs2.readFile('/custom/file.txt')).toBe('custom content');
    });

    it('should preserve file content through save/load cycle', () => {
      const vfs1 = new VirtualFileSystem();
      const testContent = 'This is test content with special chars: äöü @#$%';
      vfs1.writeFile('/test.txt', testContent);
      
      const vfs2 = new VirtualFileSystem();
      expect(vfs2.readFile('/test.txt')).toBe(testContent);
    });

    it('should preserve folder structure through save/load cycle', () => {
      const vfs1 = new VirtualFileSystem();
      vfs1.createFolder('/level1/level2/level3');
      vfs1.writeFile('/level1/level2/level3/deep.txt', 'deep content');
      
      const vfs2 = new VirtualFileSystem();
      expect(vfs2.exists('/level1')).toBe(true);
      expect(vfs2.exists('/level1/level2')).toBe(true);
      expect(vfs2.exists('/level1/level2/level3')).toBe(true);
      expect(vfs2.exists('/level1/level2/level3/deep.txt')).toBe(true);
    });

    it('should preserve timestamps through save/load cycle', () => {
      const vfs1 = new VirtualFileSystem();
      vfs1.writeFile('/timestamped.txt', 'content');
      const metadata1 = vfs1.getMetadata('/timestamped.txt');
      
      const vfs2 = new VirtualFileSystem();
      const metadata2 = vfs2.getMetadata('/timestamped.txt');
      
      expect(metadata2.createdAt).toBe(metadata1.createdAt);
      expect(metadata2.modifiedAt).toBe(metadata1.modifiedAt);
    });
  });

  describe('fallback to default structure', () => {
    it('should initialize with default structure when localStorage is empty', () => {
      store = {}; // Ensure empty
      
      const vfs = new VirtualFileSystem();
      
      expect(vfs.exists('/')).toBe(true);
      expect(vfs.exists('/documents')).toBe(true);
      expect(vfs.exists('/pictures')).toBe(true);
      expect(vfs.exists('/programs')).toBe(true);
      expect(vfs.exists('/documents/readme.txt')).toBe(true);
    });

    it('should create sample files with placeholder content', () => {
      store = {};
      
      const vfs = new VirtualFileSystem();
      
      const readmeContent = vfs.readFile('/documents/readme.txt');
      const notesContent = vfs.readFile('/documents/notes.txt');
      
      expect(readmeContent.length).toBeGreaterThan(0);
      expect(notesContent.length).toBeGreaterThan(0);
    });
  });

  describe('handling of corrupted data', () => {
    it('should fall back to default when localStorage contains invalid JSON', () => {
      store['vfs-data'] = 'not valid json {{{';
      
      const vfs = new VirtualFileSystem();
      
      // Should have default structure
      expect(vfs.exists('/documents')).toBe(true);
      expect(vfs.exists('/pictures')).toBe(true);
    });

    it('should fall back to default when localStorage contains null', () => {
      store['vfs-data'] = 'null';
      
      const vfs = new VirtualFileSystem();
      
      expect(vfs.exists('/documents')).toBe(true);
    });

    it('should fall back to default when localStorage contains incomplete data', () => {
      store['vfs-data'] = JSON.stringify({ incomplete: true });
      
      const vfs = new VirtualFileSystem();
      
      // Should have default structure since data was invalid
      expect(vfs.exists('/')).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      // Make setItem throw an error
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      const vfs = new VirtualFileSystem();
      
      // Should not throw when trying to save
      expect(() => vfs.writeFile('/test.txt', 'content')).not.toThrow();
    });

    it('should handle getItem returning undefined', () => {
      localStorageMock.getItem = vi.fn(() => undefined as any);
      
      const vfs = new VirtualFileSystem();
      
      // Should fall back to default
      expect(vfs.exists('/documents')).toBe(true);
    });
  });

  describe('serialization format', () => {
    it('should store data as JSON string', () => {
      const vfs = new VirtualFileSystem();
      vfs.writeFile('/test.txt', 'content');
      
      const savedData = store['vfs-data'];
      expect(() => JSON.parse(savedData)).not.toThrow();
    });

    it('should use vfs-data as storage key', () => {
      const vfs = new VirtualFileSystem();
      vfs.writeFile('/test.txt', 'content');
      
      expect(store['vfs-data']).toBeDefined();
    });

    it('should serialize dates as ISO strings', () => {
      const vfs = new VirtualFileSystem();
      vfs.writeFile('/test.txt', 'content');
      
      const savedData = JSON.parse(store['vfs-data']);
      
      // Check that dates are ISO strings
      expect(typeof savedData.createdAt).toBe('string');
      expect(typeof savedData.modifiedAt).toBe('string');
      expect(() => new Date(savedData.createdAt)).not.toThrow();
    });

    it('should deserialize ISO strings back to Date objects', () => {
      const vfs1 = new VirtualFileSystem();
      vfs1.writeFile('/test.txt', 'content');
      
      const vfs2 = new VirtualFileSystem();
      const metadata = vfs2.getMetadata('/test.txt');
      
      // getMetadata returns ISO strings, but internally they should be Date objects
      expect(typeof metadata.createdAt).toBe('string');
      expect(new Date(metadata.createdAt).getTime()).toBeGreaterThan(0);
    });
  });
});
