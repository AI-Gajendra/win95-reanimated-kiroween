/**
 * AI Client
 * 
 * Unified interface for all AI operations.
 * Supports multiple providers with caching and usage tracking.
 */

import { AIProvider } from './providers/base';
import { MockProvider } from './providers/mock';
import { ResponseCache } from './cache';
import { UsageTracker } from './usage';
import { 
  AIConfig, 
  RewriteStyle, 
  Intent, 
  FolderData, 
  FolderExplanation, 
  UsageStats,
  CancellablePromise 
} from './types';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'mock',
  timeout: 30000,
  maxRetries: 2,
  enableCache: true,
  enableUsageTracking: true
};

class AIClient {
  private provider: AIProvider;
  private cache: ResponseCache;
  private usage: UsageTracker;
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new ResponseCache();
    this.usage = new UsageTracker();
    this.provider = this.createProvider();

    console.log(`[AI Engine] Initialized with provider: ${this.config.provider}`);
  }

  /**
   * Summarize text
   */
  summarize(text: string): CancellablePromise<string> {
    const abortController = new AbortController();
    
    const promise = this.executeOperation(
      'summarize',
      () => this.provider.summarize(text),
      text,
      abortController.signal
    );

    return this.makeCancellable(promise, abortController);
  }

  /**
   * Rewrite text with optional style
   */
  rewrite(text: string, style?: RewriteStyle): CancellablePromise<string> {
    const abortController = new AbortController();
    
    const promise = this.executeOperation(
      'rewrite',
      () => this.provider.rewrite(text, style),
      { text, style },
      abortController.signal
    );

    return this.makeCancellable(promise, abortController);
  }

  /**
   * Interpret natural language query
   */
  interpret(query: string): CancellablePromise<Intent> {
    const abortController = new AbortController();
    
    const promise = this.executeOperation(
      'interpret',
      () => this.provider.interpret(query),
      query,
      abortController.signal
    ) as Promise<Intent>;

    return this.makeCancellable(promise, abortController);
  }

  /**
   * Explain folder contents
   */
  explainFolder(data: FolderData): CancellablePromise<FolderExplanation> {
    const abortController = new AbortController();
    
    const promise = this.executeOperation(
      'explainFolder',
      () => this.provider.explainFolder(data),
      data,
      abortController.signal
    ) as Promise<FolderExplanation>;

    return this.makeCancellable(promise, abortController);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): UsageStats {
    return this.usage.getStats();
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reconfigure the AI client
   */
  configure(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize provider if provider changed
    if (config.provider) {
      this.provider = this.createProvider();
      console.log(`[AI Engine] Switched to provider: ${this.config.provider}`);
    }
  }

  // Private methods

  private async executeOperation<T>(
    operationType: string,
    operation: () => Promise<T>,
    input: any,
    signal: AbortSignal
  ): Promise<T> {
    try {
      // Check cache if enabled
      if (this.config.enableCache) {
        const cacheKey = this.cache.generateKey(operationType, input);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
          console.log(`[AI Engine] Cache hit for ${operationType}`);
          return JSON.parse(cached) as T;
        }
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(operation, signal);

      // Cache result if enabled
      if (this.config.enableCache) {
        const cacheKey = this.cache.generateKey(operationType, input);
        this.cache.set(cacheKey, JSON.stringify(result));
      }

      // Track usage if enabled
      if (this.config.enableUsageTracking) {
        this.usage.track(operationType);
      }

      return result;
    } catch (error) {
      console.error(`[AI Engine] ${operationType} failed:`, error);
      
      if (signal.aborted) {
        throw new Error('Operation cancelled by user');
      }

      // Return fallback response
      return this.getFallbackResponse(operationType, error) as T;
    }
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    signal: AbortSignal
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI operation timed out')), this.config.timeout);
    });

    const abortPromise = new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Operation cancelled')));
    });

    return Promise.race([
      operation(),
      timeoutPromise,
      abortPromise
    ]);
  }

  private getFallbackResponse(operationType: string, error: any): any {
    const message = error?.message || 'Unknown error';

    if (message.includes('timeout')) {
      return 'AI operation timed out. Please try again.';
    }

    if (message.includes('network') || message.includes('unavailable')) {
      return 'AI service unavailable. Please try again later.';
    }

    // Operation-specific fallbacks
    switch (operationType) {
      case 'summarize':
        return 'Summary unavailable at this time.';
      case 'rewrite':
        return 'Rewrite unavailable at this time.';
      case 'interpret':
        return {
          type: 'unknown',
          confidence: 0,
          parameters: {}
        };
      case 'explainFolder':
        return {
          description: 'Folder analysis unavailable at this time.',
          recommendations: [],
          folderPath: ''
        };
      default:
        return 'AI service temporarily unavailable.';
    }
  }

  private makeCancellable<T>(
    promise: Promise<T>,
    abortController: AbortController
  ): CancellablePromise<T> {
    const cancellablePromise = promise as CancellablePromise<T>;
    
    cancellablePromise.cancel = () => {
      abortController.abort();
    };
    
    return cancellablePromise;
  }

  private createProvider(): AIProvider {
    switch (this.config.provider) {
      case 'mock':
        return new MockProvider();
      
      case 'openai':
        // TODO: Implement OpenAI provider
        console.warn('[AI Engine] OpenAI provider not yet implemented, falling back to mock');
        return new MockProvider();
      
      case 'anthropic':
        // TODO: Implement Anthropic provider
        console.warn('[AI Engine] Anthropic provider not yet implemented, falling back to mock');
        return new MockProvider();
      
      case 'test':
        // TODO: Implement test provider
        console.warn('[AI Engine] Test provider not yet implemented, falling back to mock');
        return new MockProvider();
      
      default:
        console.warn(`[AI Engine] Unknown provider: ${this.config.provider}, falling back to mock`);
        return new MockProvider();
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient();

// Also export class for testing
export { AIClient };
