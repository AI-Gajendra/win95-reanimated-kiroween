# AI Engine Design

## Overview

The AI Engine is implemented as a TypeScript module that provides a clean, provider-agnostic API for AI operations. It supports multiple backends (OpenAI, Anthropic, mock) through a strategy pattern, includes caching and usage tracking, and gracefully handles errors and timeouts.

## Architecture

### Module Structure

```
core/ai-engine/
├── aiClient.ts          # Public API and singleton
├── types.ts             # TypeScript interfaces
├── providers/
│   ├── base.ts          # Abstract provider interface
│   ├── openai.ts        # OpenAI implementation
│   ├── anthropic.ts     # Anthropic implementation
│   ├── mock.ts          # Mock implementation
│   └── test.ts          # Test implementation
├── cache.ts             # Response caching
├── usage.ts             # Usage tracking
└── config.ts            # Configuration management
```

### Strategy Pattern

The AI Engine uses the strategy pattern to support multiple providers:

```typescript
abstract class AIProvider {
  abstract summarize(text: string): Promise<string>;
  abstract rewrite(text: string, style?: string): Promise<string>;
  abstract interpret(query: string): Promise<Intent>;
  abstract explainFolder(data: FolderData): Promise<FolderExplanation>;
}
```

## Components and Interfaces

### Public API

```typescript
// Main AI Client
class AIClient {
  private provider: AIProvider;
  private cache: ResponseCache;
  private usage: UsageTracker;
  private config: AIConfig;
  
  constructor(config?: AIConfig);
  
  summarize(text: string): CancellablePromise<string>;
  rewrite(text: string, style?: RewriteStyle): CancellablePromise<string>;
  interpret(query: string): CancellablePromise<Intent>;
  explainFolder(data: FolderData): CancellablePromise<FolderExplanation>;
  
  getUsageStats(): UsageStats;
  clearCache(): void;
  configure(config: Partial<AIConfig>): void;
}

// Singleton export
export const aiClient = new AIClient();
export { AIClient };
```

### Type Definitions

```typescript
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'mock' | 'test';
  apiKey?: string;
  timeout: number;
  maxRetries: number;
  enableCache: boolean;
  enableUsageTracking: boolean;
}

type RewriteStyle = 'formal' | 'casual' | 'concise';

interface Intent {
  type: 'openApp' | 'createDocument' | 'search' | 'unknown';
  confidence: number;
  parameters: {
    appId?: string;
    content?: string;
    searchTerm?: string;
  };
}

interface FolderData {
  path: string;
  filenames: string[];
  sampleContents: string[];
}

interface FolderExplanation {
  description: string;
  recommendations: string[];
  folderPath: string;
}

interface UsageStats {
  totalOperations: number;
  totalTokens: number;
  operationsByType: Record<string, number>;
  lastUpdated: Date;
}

interface CancellablePromise<T> extends Promise<T> {
  cancel(): void;
}
```

## Provider Implementations

### Mock Provider

The mock provider uses heuristics and pattern matching to simulate AI responses:

```typescript
class MockProvider extends AIProvider {
  async summarize(text: string): Promise<string> {
    if (text.length < 50) {
      return "Text too short to summarize";
    }
    
    // Extract first sentence and key phrases
    const sentences = text.split(/[.!?]+/);
    const firstSentence = sentences[0];
    const wordCount = text.split(/\s+/).length;
    
    return `Summary: ${firstSentence}. (Original: ${wordCount} words)`;
  }
  
  async rewrite(text: string, style?: RewriteStyle): Promise<string> {
    switch (style) {
      case 'formal':
        return text.replace(/don't/g, 'do not')
                   .replace(/can't/g, 'cannot')
                   .replace(/won't/g, 'will not');
      case 'casual':
        return text.replace(/do not/g, "don't")
                   .replace(/cannot/g, "can't");
      case 'concise':
        return text.split(/\s+/).slice(0, Math.ceil(text.split(/\s+/).length * 0.7)).join(' ');
      default:
        return text;
    }
  }
  
  async interpret(query: string): Promise<Intent> {
    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for common intents
    if (lowerQuery.includes('open') || lowerQuery.includes('launch')) {
      if (lowerQuery.includes('notepad')) {
        return {
          type: 'openApp',
          confidence: 0.9,
          parameters: { appId: 'notepad' }
        };
      }
      if (lowerQuery.includes('explorer')) {
        return {
          type: 'openApp',
          confidence: 0.9,
          parameters: { appId: 'explorer' }
        };
      }
    }
    
    if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
      if (lowerQuery.includes('todo') || lowerQuery.includes('list')) {
        return {
          type: 'createDocument',
          confidence: 0.8,
          parameters: {
            appId: 'notepad',
            content: '# Todo List\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3'
          }
        };
      }
    }
    
    return {
      type: 'search',
      confidence: 0.5,
      parameters: { searchTerm: query }
    };
  }
  
  async explainFolder(data: FolderData): Promise<FolderExplanation> {
    const fileCount = data.filenames.length;
    const extensions = data.filenames
      .map(f => f.split('.').pop())
      .filter(Boolean);
    const uniqueExtensions = [...new Set(extensions)];
    
    let description = `This folder contains ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
    
    if (uniqueExtensions.length > 0) {
      description += ` including ${uniqueExtensions.slice(0, 3).join(', ')} files`;
    }
    
    const recommendations = [
      'Consider organizing files by type or date',
      'Remove any duplicate or temporary files',
      'Add descriptive names to files for easier identification'
    ];
    
    return {
      description,
      recommendations: recommendations.slice(0, Math.min(3, fileCount > 10 ? 3 : 2)),
      folderPath: data.path
    };
  }
}
```

### OpenAI Provider

```typescript
class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }
  
  async summarize(text: string): Promise<string> {
    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text concisely.'
        },
        {
          role: 'user',
          content: `Summarize the following text in 2-3 sentences:\n\n${text}`
        }
      ],
      max_tokens: 150
    });
    
    return response.choices[0].message.content;
  }
  
  private async makeRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## Caching System

### LRU Cache Implementation

```typescript
class ResponseCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  set(key: string, value: string): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private generateKey(operation: string, input: any): string {
    return `${operation}:${JSON.stringify(input)}`;
  }
}

interface CacheEntry {
  value: string;
  timestamp: number;
}
```

## Usage Tracking

```typescript
class UsageTracker {
  private stats: UsageStats;
  private eventEmitter: EventEmitter;
  
  constructor() {
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
  
  private saveToStorage(): void {
    localStorage.setItem('ai-usage-stats', JSON.stringify(this.stats));
  }
  
  private loadFromStorage(): void {
    const data = localStorage.getItem('ai-usage-stats');
    if (data) {
      this.stats = JSON.parse(data);
    } else {
      this.reset();
    }
  }
}
```

## Cancellable Promises

```typescript
function makeCancellable<T>(
  promise: Promise<T>,
  abortController: AbortController
): CancellablePromise<T> {
  const cancellablePromise = promise as CancellablePromise<T>;
  
  cancellablePromise.cancel = () => {
    abortController.abort();
  };
  
  return cancellablePromise;
}

// Usage in AIClient
summarize(text: string): CancellablePromise<string> {
  const abortController = new AbortController();
  
  const promise = this.executeWithTimeout(
    () => this.provider.summarize(text),
    abortController.signal
  );
  
  return makeCancellable(promise, abortController);
}
```

## Error Handling

```typescript
class AIClient {
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    signal: AbortSignal
  ): Promise<T> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI operation timed out')), this.config.timeout);
      });
      
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error('AI operation failed:', error);
      
      if (signal.aborted) {
        throw new Error('Operation cancelled by user');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('AI operation timed out');
      }
      
      if (error.message.includes('network')) {
        throw new Error('AI service unavailable');
      }
      
      // Return fallback response
      return this.getFallbackResponse(error);
    }
  }
  
  private getFallbackResponse(error: Error): any {
    // Return safe default based on operation type
    return 'AI service temporarily unavailable. Please try again.';
  }
}
```

## Testing Strategy

### Unit Tests
- Mock provider logic for each operation
- Cache hit/miss scenarios
- Usage tracking accuracy
- Error handling and fallbacks

### Integration Tests
- Provider switching
- Cancellation flow
- Timeout handling
- Cache persistence

### E2E Tests
- Complete AI operation flows
- Error recovery
- Usage statistics accuracy

## Performance Considerations

- Cache responses to avoid redundant API calls
- Use AbortController for cancellation
- Implement request debouncing in UI layer
- Lazy load provider implementations
- Batch multiple operations when possible

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG: AIConfig = {
  provider: 'mock',
  timeout: 30000,
  maxRetries: 2,
  enableCache: true,
  enableUsageTracking: true
};
```

### Environment-based Configuration

```typescript
function getConfigFromEnv(): Partial<AIConfig> {
  return {
    provider: (process.env.AI_PROVIDER as any) || 'mock',
    apiKey: process.env.AI_API_KEY,
    timeout: parseInt(process.env.AI_TIMEOUT || '30000')
  };
}
```
