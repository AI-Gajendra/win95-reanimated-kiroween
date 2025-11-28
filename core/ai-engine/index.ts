/**
 * AI Engine Module
 * 
 * Unified interface for all AI-powered features in Win95 Reanimated.
 * Provides text summarization, rewriting, intent interpretation, and folder analysis.
 * 
 * @example
 * import { aiClient } from '@/core/ai-engine';
 * 
 * // Summarize text
 * const summary = await aiClient.summarize('Long text here...');
 * 
 * // Rewrite with style
 * const formal = await aiClient.rewrite('hey whats up', 'formal');
 * 
 * // Interpret natural language
 * const intent = await aiClient.interpret('open notepad');
 * 
 * // Explain folder contents
 * const explanation = await aiClient.explainFolder({ path: '/docs', filenames: ['readme.txt'], sampleContents: [] });
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Export singleton instance and class
export { aiClient, AIClient, DEFAULT_CONFIG } from './aiClient';

// Export all TypeScript interfaces and types
export type {
  AIConfig,
  RewriteStyle,
  Intent,
  FolderData,
  FolderExplanation,
  UsageStats,
  CancellablePromise
} from './types';

// Export utility functions
export { makeCancellable, createCancellable } from './cancellable';

// Export cache and usage tracker for advanced use cases
export { ResponseCache } from './cache';
export { UsageTracker } from './usage';

// Export provider base class for custom providers
export { AIProvider } from './providers/base';
