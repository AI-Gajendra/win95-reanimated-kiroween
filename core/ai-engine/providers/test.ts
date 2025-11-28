/**
 * Test AI Provider
 * 
 * Provides deterministic, predefined responses for testing purposes.
 * Used when provider is set to 'test' in configuration.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { AIProvider } from './base';
import { Intent, FolderData, FolderExplanation, RewriteStyle } from '../types';

/**
 * Predefined test responses for deterministic testing
 */
const TEST_RESPONSES = {
  summarize: {
    default: 'This is a test summary of the provided text.',
    short: 'Text too short to summarize',
    long: 'This document discusses multiple topics. Key points include the main subject matter and supporting details.',
  },
  rewrite: {
    formal: 'This is the formal version of the text.',
    casual: "Here's the casual version of the text.",
    concise: 'Concise version.',
    default: 'This is the improved version of the text.',
  },
  interpret: {
    openNotepad: {
      type: 'openApp' as const,
      confidence: 0.95,
      parameters: { appId: 'notepad' },
    },
    openExplorer: {
      type: 'openApp' as const,
      confidence: 0.95,
      parameters: { appId: 'explorer' },
    },
    createDocument: {
      type: 'createDocument' as const,
      confidence: 0.9,
      parameters: {
        appId: 'notepad',
        content: '# New Document\n\nContent here.',
      },
    },
    search: {
      type: 'search' as const,
      confidence: 0.85,
      parameters: { searchTerm: 'test query' },
    },
    unknown: {
      type: 'unknown' as const,
      confidence: 0.3,
      parameters: {},
    },
  },
  explainFolder: {
    default: {
      description: 'This is a test folder containing various files.',
      recommendations: [
        'Organize files by type',
        'Remove temporary files',
        'Add descriptive names',
      ],
    },
  },
};

export class TestProvider extends AIProvider {
  private static isLogged = false;

  constructor() {
    super();
    this.logTestMode();
  }

  /**
   * Log when operating in test mode (only once per session)
   */
  private logTestMode(): void {
    if (!TestProvider.isLogged) {
      console.log('[AI Engine] Operating in TEST mode - responses are deterministic');
      TestProvider.isLogged = true;
    }
  }

  async summarize(text: string): Promise<string> {
    // Deterministic response based on input characteristics
    if (text.length < 50) {
      return TEST_RESPONSES.summarize.short;
    }

    if (text.length > 500) {
      return TEST_RESPONSES.summarize.long;
    }

    return TEST_RESPONSES.summarize.default;
  }

  async rewrite(text: string, style?: RewriteStyle): Promise<string> {
    // Deterministic response based on style parameter
    switch (style) {
      case 'formal':
        return TEST_RESPONSES.rewrite.formal;
      case 'casual':
        return TEST_RESPONSES.rewrite.casual;
      case 'concise':
        return TEST_RESPONSES.rewrite.concise;
      default:
        return TEST_RESPONSES.rewrite.default;
    }
  }

  async interpret(query: string): Promise<Intent> {
    const lowerQuery = query.toLowerCase();

    // Deterministic pattern matching for specific test inputs
    if (lowerQuery.includes('open notepad') || lowerQuery === 'notepad') {
      return { ...TEST_RESPONSES.interpret.openNotepad };
    }

    if (lowerQuery.includes('open explorer') || lowerQuery === 'explorer') {
      return { ...TEST_RESPONSES.interpret.openExplorer };
    }

    if (lowerQuery.includes('create') || lowerQuery.includes('new document')) {
      return { ...TEST_RESPONSES.interpret.createDocument };
    }

    if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
      return {
        ...TEST_RESPONSES.interpret.search,
        parameters: { searchTerm: query.replace(/search|find/gi, '').trim() || 'test query' },
      };
    }

    return { ...TEST_RESPONSES.interpret.unknown };
  }

  async explainFolder(data: FolderData): Promise<FolderExplanation> {
    const fileCount = data.filenames.length;
    
    return {
      description: `This is a test folder at "${data.path}" containing ${fileCount} file${fileCount !== 1 ? 's' : ''}.`,
      recommendations: [...TEST_RESPONSES.explainFolder.default.recommendations],
      folderPath: data.path,
    };
  }
}
