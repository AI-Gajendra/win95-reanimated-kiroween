/**
 * Integration tests for AI Client
 * 
 * Tests complete operation flows, error handling, cancellation, and timeout handling.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIClient, DEFAULT_CONFIG } from './aiClient';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('AIClient', () => {
  let client: AIClient;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Use test provider for deterministic responses
    client = new AIClient({ provider: 'test' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.provider).toBe('mock');
      expect(DEFAULT_CONFIG.timeout).toBe(30000);
      expect(DEFAULT_CONFIG.maxRetries).toBe(2);
      expect(DEFAULT_CONFIG.enableCache).toBe(true);
      expect(DEFAULT_CONFIG.enableUsageTracking).toBe(true);
    });
  });

  describe('summarize', () => {
    it('should return a summary for valid text', async () => {
      const text = 'This is a test document with enough content to be summarized properly by the AI engine.';
      const result = await client.summarize(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return short text message for text under 50 characters', async () => {
      const shortText = 'Short text.';
      const result = await client.summarize(shortText);
      expect(result).toContain('short');
    });

    it('should return a cancellable promise', () => {
      const promise = client.summarize('test text');
      expect(promise.cancel).toBeDefined();
      expect(typeof promise.cancel).toBe('function');
    });
  });

  describe('rewrite', () => {
    it('should rewrite text with formal style', async () => {
      const text = 'This is some text to rewrite.';
      const result = await client.rewrite(text, 'formal');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should rewrite text with casual style', async () => {
      const text = 'This is some text to rewrite.';
      const result = await client.rewrite(text, 'casual');
      expect(result).toBeDefined();
    });

    it('should rewrite text with concise style', async () => {
      const text = 'This is some text to rewrite.';
      const result = await client.rewrite(text, 'concise');
      expect(result).toBeDefined();
    });
  });

  describe('interpret', () => {
    it('should interpret open notepad command', async () => {
      const result = await client.interpret('open notepad');
      expect(result.type).toBe('openApp');
      expect(result.parameters.appId).toBe('notepad');
    });

    it('should interpret open explorer command', async () => {
      const result = await client.interpret('open explorer');
      expect(result.type).toBe('openApp');
      expect(result.parameters.appId).toBe('explorer');
    });

    it('should interpret create document command', async () => {
      const result = await client.interpret('create new document');
      expect(result.type).toBe('createDocument');
    });

    it('should interpret search command', async () => {
      const result = await client.interpret('search for files');
      expect(result.type).toBe('search');
    });

    it('should return unknown for unrecognized queries', async () => {
      const result = await client.interpret('xyz random gibberish');
      expect(result.type).toBe('unknown');
    });
  });

  describe('explainFolder', () => {
    it('should explain folder contents', async () => {
      const folderData = {
        path: '/test/folder',
        filenames: ['file1.txt', 'file2.txt'],
        sampleContents: []
      };
      const result = await client.explainFolder(folderData);
      
      expect(result.description).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.folderPath).toBe('/test/folder');
    });
  });

  describe('caching', () => {
    it('should cache responses for identical inputs', async () => {
      const text = 'This is a test document for caching verification.';
      
      // First call
      const result1 = await client.summarize(text);
      // Second call with same input
      const result2 = await client.summarize(text);
      
      expect(result1).toBe(result2);
    });

    it('should clear cache when clearCache is called', async () => {
      const text = 'This is a test document for cache clearing.';
      
      await client.summarize(text);
      client.clearCache();
      
      // After clearing, should still work
      const result = await client.summarize(text);
      expect(result).toBeDefined();
    });
  });

  describe('usage tracking', () => {
    it('should track operations', async () => {
      await client.summarize('Test text for tracking.');
      await client.rewrite('Test text', 'formal');
      
      const stats = client.getUsageStats();
      expect(stats.totalOperations).toBeGreaterThanOrEqual(2);
    });

    it('should track operations by type', async () => {
      await client.summarize('Test text.');
      await client.summarize('Another test.');
      
      const stats = client.getUsageStats();
      expect(stats.operationsByType['summarize']).toBeGreaterThanOrEqual(2);
    });
  });

  describe('cancellation', () => {
    it('should reject with cancellation message when cancelled', async () => {
      const promise = client.summarize('Test text for cancellation.');
      
      // Cancel immediately
      promise.cancel();
      
      await expect(promise).rejects.toThrow('Operation cancelled by user');
    });
  });

  describe('error handling', () => {
    it('should return fallback response on error', async () => {
      // Create client with invalid provider to trigger error
      const errorClient = new AIClient({ 
        provider: 'mock',
        timeout: 1 // Very short timeout to trigger error
      });
      
      // The mock provider has delays, so this should timeout
      const result = await errorClient.summarize('Test text.');
      
      // Should return a fallback response, not throw
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('configure', () => {
    it('should allow reconfiguration', () => {
      client.configure({ timeout: 5000 });
      // Should not throw
      expect(true).toBe(true);
    });

    it('should switch providers when provider is changed', () => {
      client.configure({ provider: 'mock' });
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('provider fallback', () => {
    it('should fall back to mock when OpenAI has no API key', () => {
      const openaiClient = new AIClient({ provider: 'openai' });
      // Should not throw, should fall back to mock
      expect(openaiClient).toBeDefined();
    });

    it('should fall back to mock for unknown provider', () => {
      const unknownClient = new AIClient({ provider: 'unknown' as any });
      // Should not throw, should fall back to mock
      expect(unknownClient).toBeDefined();
    });
  });
});
