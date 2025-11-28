/**
 * Unit tests for Response Cache
 * 
 * Tests the LRU cache implementation for AI responses.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseCache } from './cache';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache(5); // Small cache for testing
  });

  describe('get and set', () => {
    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      const result = cache.get('key1');
      expect(result).toBe('value2');
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      // Fill cache to capacity
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Add one more to trigger eviction
      cache.set('key6', 'value6');

      // First key should be evicted
      expect(cache.get('key1')).toBeNull();
      // New key should exist
      expect(cache.get('key6')).toBe('value6');
    });

    it('should move accessed items to end (most recently used)', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add new items to trigger eviction
      cache.set('key6', 'value6');

      // key2 should be evicted (was oldest after key1 was accessed)
      expect(cache.get('key2')).toBeNull();
      // key1 should still exist (was accessed, moved to end)
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('generateKey', () => {
    it('should generate unique keys for different operations', () => {
      const key1 = cache.generateKey('summarize', 'text');
      const key2 = cache.generateKey('rewrite', 'text');
      expect(key1).not.toBe(key2);
    });

    it('should generate unique keys for different inputs', () => {
      const key1 = cache.generateKey('summarize', 'text1');
      const key2 = cache.generateKey('summarize', 'text2');
      expect(key1).not.toBe(key2);
    });

    it('should generate same key for same operation and input', () => {
      const key1 = cache.generateKey('summarize', 'text');
      const key2 = cache.generateKey('summarize', 'text');
      expect(key1).toBe(key2);
    });

    it('should handle object inputs', () => {
      const key1 = cache.generateKey('rewrite', { text: 'hello', style: 'formal' });
      const key2 = cache.generateKey('rewrite', { text: 'hello', style: 'formal' });
      expect(key1).toBe(key2);
    });
  });

  describe('max size', () => {
    it('should respect default max size of 100', () => {
      const largeCache = new ResponseCache();
      
      // Add 101 items
      for (let i = 0; i < 101; i++) {
        largeCache.set(`key${i}`, `value${i}`);
      }

      // First item should be evicted
      expect(largeCache.get('key0')).toBeNull();
      // Last item should exist
      expect(largeCache.get('key100')).toBe('value100');
    });
  });
});
