/**
 * onTextEdit Hook
 * 
 * Triggered when text is edited in Notepad.
 * Optionally generates an outline or summary for metadata to provide continuous context awareness.
 * 
 * This hook demonstrates real-time AI-driven content analysis during editing.
 */

import { aiClient } from '../core/ai-engine/aiClient';

// Debounce timer to avoid excessive AI calls
let debounceTimer = null;
const DEBOUNCE_DELAY = 3000; // 3 seconds

/**
 * Handle text edit event
 * @param {Object} event - Text edit event with content and document info
 */
export async function onTextEdit(event) {
  console.log('[Hook] onTextEdit triggered');
  
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Debounce: only process after user stops typing for 3 seconds
  debounceTimer = setTimeout(async () => {
    await processTextEdit(event);
  }, DEBOUNCE_DELAY);
}

/**
 * Process the text edit after debounce
 */
async function processTextEdit(event) {
  try {
    const { content, documentId, onMetadataUpdate } = event;
    
    // Only process if content is substantial
    if (!content || content.length < 200) {
      console.log('[Hook] Content too short for analysis');
      return;
    }
    
    console.log('[Hook] Analyzing document content...');
    
    // Generate outline/summary
    const summary = await aiClient.summarize(content);
    
    // Extract key information
    const metadata = {
      summary,
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      lineCount: content.split('\n').length,
      lastAnalyzed: new Date().toISOString(),
      
      // Simple keyword extraction (first 5 capitalized words)
      keywords: extractKeywords(content)
    };
    
    console.log('[Hook] Analysis complete:', metadata);
    
    // Notify the application of updated metadata
    if (onMetadataUpdate) {
      onMetadataUpdate(metadata);
    }
    
  } catch (error) {
    console.error('[Hook] onTextEdit error:', error);
  }
}

/**
 * Extract potential keywords from content
 */
function extractKeywords(content) {
  // Find capitalized words (potential proper nouns/keywords)
  const words = content.match(/\b[A-Z][a-z]+\b/g) || [];
  
  // Get unique words and limit to 5
  const unique = [...new Set(words)];
  return unique.slice(0, 5);
}

/**
 * Cancel any pending analysis
 */
export function cancelPendingAnalysis() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

// Hook metadata for Kiro
export const hookMetadata = {
  name: 'onTextEdit',
  description: 'Analyzes document content during editing and generates metadata for context awareness',
  trigger: 'notepad.textEdit',
  enabled: true,
  parameters: {
    event: 'object'
  },
  debounceDelay: DEBOUNCE_DELAY
};
