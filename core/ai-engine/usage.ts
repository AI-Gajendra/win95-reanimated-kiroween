/**
 * Usage tracking for AI operations
 */

import { UsageStats } from './types';
import { EventEmitter } from '../file-system/eventEmitter';

export class UsageTracker {
  private stats: UsageStats;
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.loadFromStorage();
  }

  track(operation: string, tokens: number = 0): void {
    this.stats.totalOperations++;
    this.stats.totalTokens += tokens;
    this.stats.operationsByType[operation] = 
      (this.stats.operationsByType[operation] || 0) + 1;
    this.stats.lastUpdated = new Date();

    this.saveToStorage();
    this.eventEmitter.emit('usageUpdate', this.stats);
  }

  getStats(): UsageStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      totalOperations: 0,
      totalTokens: 0,
      operationsByType: {},
      lastUpdated: new Date()
    };
    this.saveToStorage();
  }

  on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('ai-usage-stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('ai-usage-stats');
      if (data) {
        this.stats = JSON.parse(data);
        this.stats.lastUpdated = new Date(this.stats.lastUpdated);
      } else {
        this.reset();
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      this.reset();
    }
  }
}
