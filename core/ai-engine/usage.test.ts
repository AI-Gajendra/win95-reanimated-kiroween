/**
 * Unit tests for Usage Tracker
 * 
 * Tests the usage tracking system for AI operations.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UsageTracker } from './usage';

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

describe('UsageTracker', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    tracker = new UsageTracker();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('track', () => {
    it('should increment total operations', () => {
      tracker.track('summarize');
      tracker.track('rewrite');
      
      const stats = tracker.getStats();
      expect(stats.totalOperations).toBe(2);
    });

    it('should track tokens', () => {
      tracker.track('summarize', 100);
      tracker.track('rewrite', 50);
      
      const stats = tracker.getStats();
      expect(stats.totalTokens).toBe(150);
    });

    it('should track operations by type', () => {
      tracker.track('summarize');
      tracker.track('summarize');
      tracker.track('rewrite');
      
      const stats = tracker.getStats();
      expect(stats.operationsByType['summarize']).toBe(2);
      expect(stats.operationsByType['rewrite']).toBe(1);
    });

    it('should update lastUpdated timestamp', () => {
      const before = new Date();
      tracker.track('summarize');
      const stats = tracker.getStats();
      const after = new Date();
      
      expect(stats.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(stats.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getStats', () => {
    it('should return a copy of statistics', () => {
      tracker.track('summarize');
      
      const stats1 = tracker.getStats();
      const stats2 = tracker.getStats();
      
      // Should be equal but not the same object
      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });

    it('should include all required fields', () => {
      const stats = tracker.getStats();
      
      expect(stats).toHaveProperty('totalOperations');
      expect(stats).toHaveProperty('totalTokens');
      expect(stats).toHaveProperty('operationsByType');
      expect(stats).toHaveProperty('lastUpdated');
    });
  });

  describe('persistence', () => {
    it('should save stats to localStorage after tracking', () => {
      tracker.track('summarize', 100);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-usage-stats',
        expect.any(String)
      );
    });

    it('should load stats from localStorage on initialization', () => {
      const savedStats = {
        totalOperations: 5,
        totalTokens: 500,
        operationsByType: { summarize: 3, rewrite: 2 },
        lastUpdated: new Date().toISOString()
      };
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedStats));
      
      const newTracker = new UsageTracker();
      const stats = newTracker.getStats();
      
      expect(stats.totalOperations).toBe(5);
      expect(stats.totalTokens).toBe(500);
    });

    it('should handle missing localStorage data', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const newTracker = new UsageTracker();
      const stats = newTracker.getStats();
      
      expect(stats.totalOperations).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');
      
      const newTracker = new UsageTracker();
      const stats = newTracker.getStats();
      
      // Should reset to defaults
      expect(stats.totalOperations).toBe(0);
    });
  });

  describe('event emission', () => {
    it('should emit usageUpdate event after tracking', () => {
      const callback = vi.fn();
      tracker.on('usageUpdate', callback);
      
      tracker.track('summarize');
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        totalOperations: 1
      }));
    });

    it('should allow unsubscribing from events', () => {
      const callback = vi.fn();
      tracker.on('usageUpdate', callback);
      tracker.off('usageUpdate', callback);
      
      tracker.track('summarize');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all statistics', () => {
      tracker.track('summarize', 100);
      tracker.track('rewrite', 50);
      
      tracker.reset();
      
      const stats = tracker.getStats();
      expect(stats.totalOperations).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.operationsByType).toEqual({});
    });
  });
});
