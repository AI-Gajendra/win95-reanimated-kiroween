/**
 * Unit tests for EventEmitter and VFS event system
 * Tests event emission for all operations, subscription, unsubscription, and event payloads
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from './eventEmitter';
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

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('should register event listener', () => {
      const callback = vi.fn();
      emitter.on('test', callback);
      emitter.emit('test', { data: 'value' });
      expect(callback).toHaveBeenCalledWith({ data: 'value' });
    });

    it('should allow multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.emit('test', { data: 'value' });
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should unregister event listener', () => {
      const callback = vi.fn();
      emitter.on('test', callback);
      emitter.off('test', callback);
      emitter.emit('test', { data: 'value' });
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.off('test', callback1);
      emitter.emit('test', { data: 'value' });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle unregistering non-existent listener', () => {
      const callback = vi.fn();
      expect(() => emitter.off('test', callback)).not.toThrow();
    });
  });

  describe('emit', () => {
    it('should call all registered listeners', () => {
      const callback = vi.fn();
      emitter.on('test', callback);
      emitter.emit('test', { data: 'value' });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not throw for events with no listeners', () => {
      expect(() => emitter.emit('nonexistent', {})).not.toThrow();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = vi.fn(() => { throw new Error('Test error'); });
      const normalCallback = vi.fn();
      
      emitter.on('test', errorCallback);
      emitter.on('test', normalCallback);
      
      // Should not throw and should continue to other listeners
      expect(() => emitter.emit('test', {})).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('test', callback1);
      emitter.on('other', callback2);
      
      emitter.removeAllListeners('test');
      emitter.emit('test', {});
      emitter.emit('other', {});
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should remove all listeners when no event specified', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      
      emitter.removeAllListeners();
      emitter.emit('test1', {});
      emitter.emit('test2', {});
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});

describe('VFS Event System', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vfs = new VirtualFileSystem();
  });

  describe('fileCreated event', () => {
    it('should emit fileCreated when new file is created', () => {
      const callback = vi.fn();
      vfs.on('fileCreated', callback);
      
      vfs.writeFile('/documents/newfile.txt', 'content');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/documents/newfile.txt',
          timestamp: expect.any(Date)
        })
      );
    });

    it('should include path in event payload', () => {
      const callback = vi.fn();
      vfs.on('fileCreated', callback);
      
      vfs.writeFile('/test.txt', 'content');
      
      const eventData = callback.mock.calls[0][0];
      expect(eventData.path).toBe('/test.txt');
    });
  });

  describe('fileModified event', () => {
    it('should emit fileModified when existing file is updated', () => {
      const callback = vi.fn();
      vfs.on('fileModified', callback);
      
      vfs.writeFile('/documents/readme.txt', 'updated content');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/documents/readme.txt',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('fileDeleted event', () => {
    it('should emit fileDeleted when file is deleted', () => {
      const callback = vi.fn();
      vfs.on('fileDeleted', callback);
      
      vfs.deleteItem('/documents/readme.txt');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/documents/readme.txt',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('folderCreated event', () => {
    it('should emit folderCreated when new folder is created', () => {
      const callback = vi.fn();
      vfs.on('folderCreated', callback);
      
      vfs.createFolder('/newfolder');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/newfolder',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('folderDeleted event', () => {
    it('should emit folderDeleted when folder is deleted', () => {
      const callback = vi.fn();
      vfs.on('folderDeleted', callback);
      
      vfs.createFolder('/todelete');
      vfs.deleteItem('/todelete');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/todelete',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('event subscription management', () => {
    it('should allow unsubscribing from events', () => {
      const callback = vi.fn();
      vfs.on('fileCreated', callback);
      vfs.off('fileCreated', callback);
      
      vfs.writeFile('/test.txt', 'content');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      vfs.on('fileCreated', callback1);
      vfs.on('fileCreated', callback2);
      
      vfs.writeFile('/test.txt', 'content');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('event payload', () => {
    it('should include timestamp in all events', () => {
      const events: any[] = [];
      
      vfs.on('fileCreated', (e: any) => events.push(e));
      vfs.on('fileModified', (e: any) => events.push(e));
      vfs.on('fileDeleted', (e: any) => events.push(e));
      vfs.on('folderCreated', (e: any) => events.push(e));
      vfs.on('folderDeleted', (e: any) => events.push(e));
      
      vfs.writeFile('/test.txt', 'content');
      vfs.writeFile('/test.txt', 'updated');
      vfs.deleteItem('/test.txt');
      vfs.createFolder('/testfolder');
      vfs.deleteItem('/testfolder');
      
      expect(events.length).toBe(5);
      events.forEach(event => {
        expect(event.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should include affected path in all events', () => {
      const events: any[] = [];
      
      vfs.on('fileCreated', (e: any) => events.push(e));
      vfs.on('folderCreated', (e: any) => events.push(e));
      
      vfs.writeFile('/myfile.txt', 'content');
      vfs.createFolder('/myfolder');
      
      expect(events[0].path).toBe('/myfile.txt');
      expect(events[1].path).toBe('/myfolder');
    });
  });
});
