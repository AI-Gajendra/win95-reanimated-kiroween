# AI Engine Implementation Plan

- [ ] 1. Create AI Engine type definitions and interfaces
  - [ ] 1.1 Define TypeScript interfaces in types.ts
    - Create AIConfig interface
    - Create Intent interface with type and parameters
    - Create FolderData and FolderExplanation interfaces
    - Create UsageStats interface
    - Create CancellablePromise type
    - Define RewriteStyle type
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2. Implement base provider abstraction
  - [ ] 2.1 Create abstract AIProvider class
    - Define abstract methods: summarize, rewrite, interpret, explainFolder
    - Create base.ts file in providers folder
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Implement Mock Provider
  - [ ] 3.1 Create MockProvider class
    - Extend AIProvider abstract class
    - Create mock.ts file in providers folder
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 3.2 Implement mock summarize function
    - Check text length, return message if too short
    - Extract first sentence and word count
    - Return simulated summary
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.2_
  
  - [ ] 3.3 Implement mock rewrite function
    - Handle formal style (expand contractions)
    - Handle casual style (add contractions)
    - Handle concise style (reduce length)
    - Handle default style (return original)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3_
  
  - [ ] 3.4 Implement mock interpret function
    - Use pattern matching for "open" commands
    - Detect notepad and explorer app requests
    - Handle "create" and "new" commands
    - Detect todo list requests
    - Return search intent as fallback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.4_
  
  - [ ] 3.5 Implement mock explainFolder function
    - Count files and extract extensions
    - Generate description based on file count and types
    - Create generic recommendations
    - Return explanation object
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.5_

- [ ] 4. Implement response caching system
  - [ ] 4.1 Create ResponseCache class
    - Implement LRU cache with Map
    - Set maximum size to 100 entries
    - Create cache.ts file
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  
  - [ ] 4.2 Implement cache get method
    - Check if key exists in cache
    - Move accessed entry to end (LRU)
    - Return cached value or null
    - _Requirements: 11.3_
  
  - [ ] 4.3 Implement cache set method
    - Generate cache key from operation and input
    - Evict oldest entry if at capacity
    - Store new entry with timestamp
    - _Requirements: 11.2, 11.5_
  
  - [ ] 4.4 Implement cache clear method
    - Clear all entries from cache
    - _Requirements: 11.1_

- [ ] 5. Implement usage tracking system
  - [ ] 5.1 Create UsageTracker class
    - Define UsageStats structure
    - Create usage.ts file
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 5.2 Implement track method
    - Increment operation counters
    - Update token usage
    - Update operationsByType map
    - Emit usageUpdate event
    - _Requirements: 10.1, 10.3, 10.4_
  
  - [ ] 5.3 Implement usage persistence
    - Save stats to localStorage after each operation
    - Load stats from localStorage on initialization
    - Handle missing or corrupted data
    - _Requirements: 10.5_
  
  - [ ] 5.4 Implement getStats method
    - Return copy of current statistics
    - _Requirements: 10.2_

- [ ] 6. Implement cancellable promise wrapper
  - [ ] 6.1 Create makeCancellable utility function
    - Accept promise and AbortController
    - Add cancel method to promise
    - Return CancellablePromise
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7. Implement AIClient core class
  - [ ] 7.1 Create AIClient class structure
    - Define private properties: provider, cache, usage, config
    - Create aiClient.ts file
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 7.2 Implement constructor and configuration
    - Accept optional AIConfig parameter
    - Merge with default configuration
    - Initialize provider based on config
    - Initialize cache and usage tracker
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 7.3 Implement provider factory
    - Create method to instantiate provider based on config
    - Support mock, test, openai, anthropic providers
    - Default to mock if no API key provided
    - _Requirements: 6.1, 8.3_

- [ ] 8. Implement AIClient public methods
  - [ ] 8.1 Implement summarize method
    - Check cache for existing response
    - Create AbortController for cancellation
    - Call provider.summarize with timeout
    - Track usage statistics
    - Cache successful response
    - Return CancellablePromise
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 11.3_
  
  - [ ] 8.2 Implement rewrite method
    - Check cache for existing response
    - Create AbortController for cancellation
    - Call provider.rewrite with style parameter
    - Track usage statistics
    - Cache successful response
    - Return CancellablePromise
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 11.3_
  
  - [ ] 8.3 Implement interpret method
    - Check cache for existing response
    - Create AbortController for cancellation
    - Call provider.interpret
    - Track usage statistics
    - Cache successful response
    - Return CancellablePromise
    - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 11.3_
  
  - [ ] 8.4 Implement explainFolder method
    - Check cache for existing response
    - Create AbortController for cancellation
    - Call provider.explainFolder
    - Track usage statistics
    - Cache successful response
    - Return CancellablePromise
    - _Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 11.3_

- [ ] 9. Implement error handling and timeout logic
  - [ ] 9.1 Create executeWithTimeout helper method
    - Create timeout promise based on config
    - Race operation promise against timeout
    - Handle AbortSignal for cancellation
    - Catch and log errors
    - Return fallback responses on errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.3, 9.4_
  
  - [ ] 9.2 Implement getFallbackResponse method
    - Return safe default responses based on operation type
    - Provide user-friendly error messages
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Implement utility methods
  - [ ] 10.1 Implement getUsageStats method
    - Return copy of usage statistics
    - _Requirements: 10.2_
  
  - [ ] 10.2 Implement clearCache method
    - Call cache.clear()
    - _Requirements: 11.1_
  
  - [ ] 10.3 Implement configure method
    - Accept partial configuration
    - Merge with existing config
    - Reinitialize provider if provider changed
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Create Test Provider for deterministic testing
  - [ ] 11.1 Create TestProvider class
    - Extend AIProvider abstract class
    - Create test.ts file in providers folder
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 11.2 Implement test provider methods
    - Return predefined responses for specific inputs
    - Make responses deterministic and realistic
    - Log when operating in test mode
    - _Requirements: 12.2, 12.4, 12.5_

- [ ] 12. Implement OpenAI Provider (optional for real AI)
  - [ ] 12.1 Create OpenAIProvider class
    - Extend AIProvider abstract class
    - Create openai.ts file in providers folder
    - Accept API key in constructor
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.2_
  
  - [ ] 12.2 Implement OpenAI API integration
    - Create makeRequest helper for API calls
    - Implement summarize using chat completions
    - Implement rewrite using chat completions
    - Implement interpret using chat completions
    - Implement explainFolder using chat completions
    - Handle API errors and rate limits
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3_

- [ ] 13. Create singleton instance and exports
  - [ ] 13.1 Create default configuration
    - Define DEFAULT_CONFIG constant
    - Set provider to 'mock' by default
    - Set timeout to 30000ms
    - Enable cache and usage tracking
    - _Requirements: 6.1, 8.4_
  
  - [ ] 13.2 Export singleton and class
    - Create singleton instance with default config
    - Export singleton as named export
    - Export AIClient class for testing
    - Export all TypeScript interfaces
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 14. Testing
  - [ ]* 14.1 Write unit tests for Mock Provider
    - Test summarize with various text lengths
    - Test rewrite with all style options
    - Test interpret with common queries
    - Test explainFolder with different folder data
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 14.2 Write unit tests for caching
    - Test cache hit and miss scenarios
    - Test LRU eviction
    - Test cache key generation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 14.3 Write unit tests for usage tracking
    - Test operation counting
    - Test token tracking
    - Test persistence to localStorage
    - Test event emission
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 14.4 Write integration tests for AIClient
    - Test complete operation flows
    - Test error handling and fallbacks
    - Test cancellation
    - Test timeout handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4_
