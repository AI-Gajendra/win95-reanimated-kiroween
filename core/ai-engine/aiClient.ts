/**
 * AI Client
 * 
 * Unified interface for all AI operations.
 * Supports multiple providers with caching and usage tracking.
 */

import { AIProvider } from './providers/base';
import { MockProvider } from './providers/mock';
import { TestProvider } from './providers/test';
import { OpenAIProvider } from './providers/openai';
import { ResponseCache } from './cache';
import { UsageTracker } from './usage';
import { makeCancellable } from './cancellable';
import { 
  AIConfig, 
  RewriteStyle, 
  Intent, 
  FolderData, 
  FolderExplanation, 
  UsageStats,
  CancellablePromise 
} from './types';

/**
 * Default configuration for the AI Engine.
 * 
 * - provider: 'mock' - Uses mock provider by default (no API key required)
 * - timeout: 30000ms - 30 second timeout for AI operations
 * - maxRetries: 2 - Retry failed requests up to 2 times
 * - enableCache: true - Cache responses for identical inputs
 * - enableUsageTracking: true - Track usage statistics
 * 
 * Requirements: 6.1, 8.4
 */
export const DEFAULT_CONFIG: AIConfig = {
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

    return makeCancellable(promise, abortController);
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

    return makeCancellable(promise, abortController);
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

    return makeCancellable(promise, abortController);
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

    return makeCancellable(promise, abortController);
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

  /**
   * Execute an AI operation with caching, timeout, and error handling.
   * 
   * This method wraps all AI operations to provide:
   * - Response caching (if enabled)
   * - Timeout handling
   * - Cancellation support
   * - Error handling with fallback responses
   * - Usage tracking
   * 
   * @param operationType - The type of operation (summarize, rewrite, etc.)
   * @param operation - The async operation to execute
   * @param input - The input data (used for cache key generation)
   * @param signal - AbortSignal for cancellation support
   * @returns The operation result or a fallback response on error
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4
   */
  private async executeOperation<T>(
    operationType: string,
    operation: () => Promise<T>,
    input: unknown,
    signal: AbortSignal
  ): Promise<T> {
    try {
      // Check cache if enabled
      if (this.config.enableCache) {
        try {
          const cacheKey = this.cache.generateKey(operationType, input);
          const cached = this.cache.get(cacheKey);
          
          if (cached) {
            console.log(`[AI Engine] Cache hit for ${operationType}`);
            return JSON.parse(cached) as T;
          }
        } catch (cacheError) {
          // Log cache errors but continue with operation
          // Requirement 7.2: Log error details to console
          console.warn(`[AI Engine] Cache read error for ${operationType}:`, cacheError);
        }
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(operation, signal);

      // Cache result if enabled
      if (this.config.enableCache) {
        try {
          const cacheKey = this.cache.generateKey(operationType, input);
          this.cache.set(cacheKey, JSON.stringify(result));
        } catch (cacheError) {
          // Log cache errors but don't fail the operation
          console.warn(`[AI Engine] Cache write error for ${operationType}:`, cacheError);
        }
      }

      // Track usage if enabled
      if (this.config.enableUsageTracking) {
        try {
          this.usage.track(operationType);
        } catch (usageError) {
          // Log usage tracking errors but don't fail the operation
          console.warn(`[AI Engine] Usage tracking error for ${operationType}:`, usageError);
        }
      }

      return result;
    } catch (error) {
      // Requirement 7.2: Log error details to console for debugging
      console.error(`[AI Engine] ${operationType} failed:`, error);
      
      // Requirement 9.3, 9.4: Handle cancellation
      // Check if operation was cancelled - this should throw, not return fallback
      if (signal.aborted) {
        throw new Error('Operation cancelled by user');
      }

      // Check if error message indicates cancellation
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
        throw new Error('Operation cancelled by user');
      }

      // Requirement 7.1: Catch error and return fallback response
      // Requirement 7.5: Never throw unhandled exceptions to calling code
      return this.getFallbackResponse<T>(operationType, error);
    }
  }

  /**
   * Execute an operation with timeout and cancellation support.
   * 
   * Creates a timeout promise based on config, races operation against timeout,
   * handles AbortSignal for cancellation, catches and logs errors,
   * and returns fallback responses on errors.
   * 
   * @param operation - The async operation to execute
   * @param signal - AbortSignal for cancellation support
   * @returns The operation result or throws on timeout/cancellation
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.3, 9.4
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    signal: AbortSignal
  ): Promise<T> {
    // Check if already aborted before starting
    if (signal.aborted) {
      throw new Error('Operation cancelled by user');
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let abortHandler: (() => void) | null = null;

    try {
      // Create timeout promise based on config
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('AI operation timed out'));
        }, this.config.timeout);
      });

      // Create abort promise for cancellation
      const abortPromise = new Promise<never>((_, reject) => {
        abortHandler = () => reject(new Error('Operation cancelled by user'));
        signal.addEventListener('abort', abortHandler);
      });

      // Race operation promise against timeout and abort
      const result = await Promise.race([
        operation(),
        timeoutPromise,
        abortPromise
      ]);

      return result;
    } finally {
      // Clean up timeout timer to prevent memory leaks
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      // Clean up abort listener
      if (abortHandler !== null) {
        signal.removeEventListener('abort', abortHandler);
      }
    }
  }

  /**
   * Get a safe fallback response based on operation type.
   * 
   * Returns user-friendly error messages and safe default responses
   * based on the type of operation that failed.
   * 
   * @param operationType - The type of AI operation that failed
   * @param error - The error that occurred
   * @returns A safe fallback response appropriate for the operation type
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  private getFallbackResponse<T>(operationType: string, error: unknown): T {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Determine the appropriate error message based on error type
    let userMessage: string;
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      // Requirement 7.4: IF a timeout occurs, return "AI operation timed out"
      userMessage = 'AI operation timed out';
    } else if (
      errorMessage.includes('network') || 
      errorMessage.includes('unavailable') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch')
    ) {
      // Requirement 7.3: IF a network error occurs, return "AI service unavailable"
      userMessage = 'AI service unavailable';
    } else {
      userMessage = 'AI service temporarily unavailable';
    }

    // Return operation-specific fallback responses
    // These provide safe defaults that won't break the calling code
    switch (operationType) {
      case 'summarize':
        return `${userMessage}. Summary could not be generated.` as T;
      
      case 'rewrite':
        return `${userMessage}. Text could not be rewritten.` as T;
      
      case 'interpret':
        // Return a valid Intent object with unknown type
        return {
          type: 'unknown',
          confidence: 0,
          parameters: {
            searchTerm: userMessage
          }
        } as T;
      
      case 'explainFolder':
        // Return a valid FolderExplanation object
        return {
          description: `${userMessage}. Folder analysis could not be completed.`,
          recommendations: ['Please try again later when the AI service is available.'],
          folderPath: ''
        } as T;
      
      default:
        return `${userMessage}. Please try again later.` as T;
    }
  }

  private createProvider(): AIProvider {
    switch (this.config.provider) {
      case 'mock':
        return new MockProvider();
      
      case 'openai':
        if (!this.config.apiKey) {
          console.warn('[AI Engine] OpenAI provider requires an API key, falling back to mock');
          return new MockProvider();
        }
        return new OpenAIProvider(this.config.apiKey);
      
      case 'anthropic':
        // TODO: Implement Anthropic provider
        console.warn('[AI Engine] Anthropic provider not yet implemented, falling back to mock');
        return new MockProvider();
      
      case 'test':
        return new TestProvider();
      
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
