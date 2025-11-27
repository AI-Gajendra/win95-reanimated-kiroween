/**
 * Mock AI Provider
 * 
 * Provides simulated AI responses using heuristics and pattern matching.
 * Used as the default provider when no API key is configured.
 */

import { AIProvider } from './base';
import { Intent, FolderData, FolderExplanation, RewriteStyle } from '../types';

export class MockProvider extends AIProvider {
  async summarize(text: string): Promise<string> {
    // Simulate processing delay
    await this.delay(500);

    if (text.length < 50) {
      return "Text too short to summarize";
    }

    // Extract first sentence and key information
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const firstSentence = sentences[0]?.trim() || text.substring(0, 100);
    const wordCount = text.split(/\s+/).length;
    const lineCount = text.split('\n').length;

    return `Summary: ${firstSentence}.\n\nDocument contains approximately ${wordCount} words across ${lineCount} lines.`;
  }

  async rewrite(text: string, style?: RewriteStyle): Promise<string> {
    // Simulate processing delay
    await this.delay(500);

    switch (style) {
      case 'formal':
        return text
          .replace(/don't/gi, 'do not')
          .replace(/can't/gi, 'cannot')
          .replace(/won't/gi, 'will not')
          .replace(/isn't/gi, 'is not')
          .replace(/aren't/gi, 'are not')
          .replace(/wasn't/gi, 'was not')
          .replace(/weren't/gi, 'were not')
          .replace(/haven't/gi, 'have not')
          .replace(/hasn't/gi, 'has not')
          .replace(/hadn't/gi, 'had not')
          .replace(/wouldn't/gi, 'would not')
          .replace(/shouldn't/gi, 'should not')
          .replace(/couldn't/gi, 'could not');

      case 'casual':
        return text
          .replace(/do not/gi, "don't")
          .replace(/cannot/gi, "can't")
          .replace(/will not/gi, "won't")
          .replace(/is not/gi, "isn't")
          .replace(/are not/gi, "aren't");

      case 'concise':
        const words = text.split(/\s+/);
        const targetLength = Math.ceil(words.length * 0.7);
        return words.slice(0, targetLength).join(' ') + '...';

      default:
        // Default: just return the text with minor improvements
        return text.trim();
    }
  }

  async interpret(query: string): Promise<Intent> {
    // Simulate processing delay
    await this.delay(300);

    const lowerQuery = query.toLowerCase();

    // Pattern matching for common intents

    // Open app patterns
    if (lowerQuery.includes('open') || lowerQuery.includes('launch') || lowerQuery.includes('start')) {
      if (lowerQuery.includes('notepad') || lowerQuery.includes('note')) {
        return {
          type: 'openApp',
          confidence: 0.9,
          parameters: { appId: 'notepad' }
        };
      }
      if (lowerQuery.includes('explorer') || lowerQuery.includes('files') || lowerQuery.includes('folder')) {
        return {
          type: 'openApp',
          confidence: 0.9,
          parameters: { appId: 'explorer' }
        };
      }
    }

    // Create document patterns
    if (lowerQuery.includes('create') || lowerQuery.includes('new') || lowerQuery.includes('make')) {
      if (lowerQuery.includes('todo') || lowerQuery.includes('task') || lowerQuery.includes('list')) {
        return {
          type: 'createDocument',
          confidence: 0.85,
          parameters: {
            appId: 'notepad',
            content: '# Todo List\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n'
          }
        };
      }
      if (lowerQuery.includes('note') || lowerQuery.includes('document')) {
        return {
          type: 'createDocument',
          confidence: 0.8,
          parameters: {
            appId: 'notepad',
            content: ''
          }
        };
      }
    }

    // Search patterns
    if (lowerQuery.includes('search') || lowerQuery.includes('find') || lowerQuery.includes('look for')) {
      const searchTerm = query.replace(/search|find|look for/gi, '').trim();
      return {
        type: 'search',
        confidence: 0.7,
        parameters: { searchTerm }
      };
    }

    // Unknown intent
    return {
      type: 'unknown',
      confidence: 0.3,
      parameters: {}
    };
  }

  async explainFolder(data: FolderData): Promise<FolderExplanation> {
    // Simulate processing delay
    await this.delay(800);

    const fileCount = data.filenames.length;
    const extensions = data.filenames
      .map(f => f.split('.').pop())
      .filter(Boolean) as string[];
    const uniqueExtensions = [...new Set(extensions)];

    let description = `This folder contains ${fileCount} item${fileCount !== 1 ? 's' : ''}`;

    if (uniqueExtensions.length > 0) {
      const extList = uniqueExtensions.slice(0, 3).join(', ');
      description += ` including ${extList} files`;
    }

    description += `. The folder appears to be ${this.inferFolderPurpose(data.filenames, data.sampleContents)}.`;

    const recommendations: string[] = [];

    if (fileCount > 10) {
      recommendations.push('Consider organizing files into subfolders by type or date');
    }

    if (uniqueExtensions.length > 3) {
      recommendations.push('Group files by extension or purpose for easier navigation');
    }

    recommendations.push('Add descriptive names to files for easier identification');

    if (fileCount > 5) {
      recommendations.push('Remove any duplicate or temporary files to keep the folder clean');
    }

    return {
      description,
      recommendations: recommendations.slice(0, 3),
      folderPath: data.path
    };
  }

  private inferFolderPurpose(filenames: string[], sampleContents: string[]): string {
    const allText = [...filenames, ...sampleContents].join(' ').toLowerCase();

    if (allText.includes('work') || allText.includes('project')) {
      return 'a work or project folder';
    }
    if (allText.includes('note') || allText.includes('todo')) {
      return 'a notes or task management folder';
    }
    if (allText.includes('document') || allText.includes('report')) {
      return 'a documents folder';
    }
    if (allText.includes('code') || allText.includes('script')) {
      return 'a code or scripts folder';
    }

    return 'a general-purpose storage folder';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
