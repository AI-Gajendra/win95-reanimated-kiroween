/**
 * Unit tests for Mock AI Provider
 * 
 * Tests the mock provider's heuristic-based AI responses.
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider } from './mock';
import { FolderData } from '../types';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('summarize', () => {
    it('should return "Text too short to summarize" for text under 50 characters', async () => {
      const shortText = 'This is short.';
      const result = await provider.summarize(shortText);
      expect(result).toBe('Text too short to summarize');
    });

    it('should return a summary for text over 50 characters', async () => {
      const longText = 'This is a longer piece of text that contains more than fifty characters and should be summarized properly.';
      const result = await provider.summarize(longText);
      expect(result).toContain('Summary:');
      expect(result).toContain('words');
    });

    it('should include word count in summary', async () => {
      const text = 'This is a test document with multiple words that should be counted in the summary output.';
      const result = await provider.summarize(text);
      expect(result).toMatch(/\d+ words/);
    });

    it('should include line count in summary', async () => {
      const text = 'Line one of the document.\nLine two of the document.\nLine three of the document.';
      const result = await provider.summarize(text);
      expect(result).toMatch(/\d+ lines/);
    });
  });

  describe('rewrite', () => {
    it('should expand contractions for formal style', async () => {
      const text = "I don't think we can't do this.";
      const result = await provider.rewrite(text, 'formal');
      expect(result).toContain('do not');
      expect(result).toContain('cannot');
    });

    it('should add contractions for casual style', async () => {
      const text = 'I do not think we cannot do this.';
      const result = await provider.rewrite(text, 'casual');
      expect(result).toContain("don't");
      expect(result).toContain("can't");
    });

    it('should reduce length for concise style', async () => {
      const text = 'This is a long sentence with many words that should be shortened.';
      const result = await provider.rewrite(text, 'concise');
      expect(result.split(/\s+/).length).toBeLessThan(text.split(/\s+/).length);
      expect(result).toContain('...');
    });

    it('should return trimmed text for undefined style', async () => {
      const text = '  Some text with spaces  ';
      const result = await provider.rewrite(text);
      expect(result).toBe('Some text with spaces');
    });
  });

  describe('interpret', () => {
    it('should detect notepad open intent', async () => {
      const result = await provider.interpret('open notepad');
      expect(result.type).toBe('openApp');
      expect(result.parameters.appId).toBe('notepad');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect explorer open intent', async () => {
      const result = await provider.interpret('launch explorer');
      expect(result.type).toBe('openApp');
      expect(result.parameters.appId).toBe('explorer');
    });

    it('should detect create document intent for todo list', async () => {
      const result = await provider.interpret('create a new todo list');
      expect(result.type).toBe('createDocument');
      expect(result.parameters.appId).toBe('notepad');
      expect(result.parameters.content).toContain('Todo');
    });

    it('should detect search intent', async () => {
      const result = await provider.interpret('search for documents');
      expect(result.type).toBe('search');
      expect(result.parameters.searchTerm).toBeDefined();
    });

    it('should return unknown intent for unrecognized queries', async () => {
      const result = await provider.interpret('xyz random gibberish');
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('explainFolder', () => {
    it('should describe folder with file count', async () => {
      const folderData: FolderData = {
        path: '/test/folder',
        filenames: ['file1.txt', 'file2.txt', 'file3.txt'],
        sampleContents: []
      };
      const result = await provider.explainFolder(folderData);
      expect(result.description).toContain('3 items');
      expect(result.folderPath).toBe('/test/folder');
    });

    it('should include file extensions in description', async () => {
      const folderData: FolderData = {
        path: '/test/folder',
        filenames: ['doc.txt', 'image.png', 'script.js'],
        sampleContents: []
      };
      const result = await provider.explainFolder(folderData);
      expect(result.description).toMatch(/txt|png|js/);
    });

    it('should provide recommendations', async () => {
      const folderData: FolderData = {
        path: '/test/folder',
        filenames: Array(15).fill(null).map((_, i) => `file${i}.txt`),
        sampleContents: []
      };
      const result = await provider.explainFolder(folderData);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty folder', async () => {
      const folderData: FolderData = {
        path: '/empty/folder',
        filenames: [],
        sampleContents: []
      };
      const result = await provider.explainFolder(folderData);
      expect(result.description).toContain('0 items');
    });
  });
});
