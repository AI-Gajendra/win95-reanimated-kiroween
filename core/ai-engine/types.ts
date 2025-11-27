/**
 * Type definitions for the AI Engine
 */

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'mock' | 'test';
  apiKey?: string;
  timeout: number;
  maxRetries: number;
  enableCache: boolean;
  enableUsageTracking: boolean;
}

export type RewriteStyle = 'formal' | 'casual' | 'concise';

export interface Intent {
  type: 'openApp' | 'createDocument' | 'search' | 'unknown';
  confidence: number;
  parameters: {
    appId?: string;
    content?: string;
    searchTerm?: string;
  };
}

export interface FolderData {
  path: string;
  filenames: string[];
  sampleContents: string[];
}

export interface FolderExplanation {
  description: string;
  recommendations: string[];
  folderPath: string;
}

export interface UsageStats {
  totalOperations: number;
  totalTokens: number;
  operationsByType: Record<string, number>;
  lastUpdated: Date;
}

export interface CancellablePromise<T> extends Promise<T> {
  cancel(): void;
}
