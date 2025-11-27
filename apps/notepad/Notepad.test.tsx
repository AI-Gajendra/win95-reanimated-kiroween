/**
 * Notepad Component Tests
 * 
 * Tests for VFS integration and document persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Notepad } from './Notepad';
import { vfs } from '@core/file-system/vfs';
import { WindowManagerProvider } from '@core/window-manager/WindowContext';
import { aiClient } from '@core/ai-engine/aiClient';

// Mock window ID for testing
const TEST_WINDOW_ID = 'test-window-1';

// Helper to render Notepad with WindowManager context
const renderNotepad = (props = {}) => {
  return render(
    <WindowManagerProvider>
      <Notepad windowId={TEST_WINDOW_ID} {...props} />
    </WindowManagerProvider>
  );
};

describe('Notepad VFS Integration', () => {
  beforeEach(() => {
    // Clear any existing test files
    try {
      vfs.deleteItem('/documents/test-doc.txt');
    } catch {
      // File might not exist
    }
  });

  it('should autosave content after 2 seconds of inactivity', async () => {
    const user = userEvent.setup();
    renderNotepad({ initialContent: '', documentId: 'test-doc' });

    const textarea = screen.getByLabelText('Document content');
    
    // Type some content
    await user.type(textarea, 'Hello World');

    // Wait for autosave (2 seconds + buffer)
    await waitFor(
      () => {
        const savedContent = vfs.readFile('/documents/test-doc.txt');
        expect(savedContent).toBe('Hello World');
      },
      { timeout: 3000 }
    );
  });

  it('should load existing document on mount', () => {
    // Create a test file
    vfs.writeFile('/documents/existing-doc.txt', 'Existing content');

    renderNotepad({ documentId: 'existing-doc' });

    const textarea = screen.getByLabelText('Document content');
    expect(textarea).toHaveValue('Existing content');
  });

  it('should save document on manual save (Ctrl+S)', async () => {
    const user = userEvent.setup();
    renderNotepad({ initialContent: '', documentId: 'manual-save-doc' });

    const textarea = screen.getByLabelText('Document content');
    
    // Type some content
    await user.type(textarea, 'Manual save test');

    // Trigger manual save with Ctrl+S
    await user.keyboard('{Control>}s{/Control}');

    // Verify file was saved immediately
    const savedContent = vfs.readFile('/documents/manual-save-doc.txt');
    expect(savedContent).toBe('Manual save test');
  });

  it('should handle file not found gracefully', () => {
    // Try to load a non-existent file
    renderNotepad({ documentId: 'non-existent-file' });

    const textarea = screen.getByLabelText('Document content');
    // Should show empty content instead of crashing
    expect(textarea).toHaveValue('');
  });

  it('should open document via file picker dialog', async () => {
    const user = userEvent.setup();
    
    // Create test files in VFS
    vfs.writeFile('/documents/test-file-1.txt', 'Content of test file 1');
    vfs.writeFile('/documents/test-file-2.txt', 'Content of test file 2');
    
    renderNotepad({ initialContent: '', documentId: 'initial-doc' });

    // Open File menu
    const fileMenuButton = screen.getByText('File');
    await user.click(fileMenuButton);

    // Click Open
    const openButton = screen.getByText('Open...');
    await user.click(openButton);

    // File picker dialog should appear
    await waitFor(() => {
      expect(screen.getByText('File name:')).toBeInTheDocument();
    });

    // Should list .txt files
    expect(screen.getByText('📄 test-file-1.txt')).toBeInTheDocument();
    expect(screen.getByText('📄 test-file-2.txt')).toBeInTheDocument();

    // Select a file
    await user.click(screen.getByText('📄 test-file-1.txt'));

    // Click Open button in dialog
    const dialogOpenButton = screen.getAllByRole('button', { name: /open/i }).find(
      el => !el.closest('.relative')
    );
    await user.click(dialogOpenButton!);

    // File content should be loaded
    const textarea = screen.getByLabelText('Document content');
    await waitFor(() => {
      expect(textarea).toHaveValue('Content of test file 1');
    });

    // Clean up
    vfs.deleteItem('/documents/test-file-1.txt');
    vfs.deleteItem('/documents/test-file-2.txt');
  });

  it('should open document via keyboard shortcut (Ctrl+O)', async () => {
    const user = userEvent.setup();
    
    // Create test file in VFS
    vfs.writeFile('/documents/keyboard-test.txt', 'Opened via keyboard');
    
    renderNotepad({ initialContent: '', documentId: 'initial-doc' });

    // Trigger Ctrl+O
    await user.keyboard('{Control>}o{/Control}');

    // File picker dialog should appear
    await waitFor(() => {
      expect(screen.getByText('File name:')).toBeInTheDocument();
    });

    // Should list the test file
    expect(screen.getByText('📄 keyboard-test.txt')).toBeInTheDocument();

    // Select and open the file
    await user.click(screen.getByText('📄 keyboard-test.txt'));
    const dialogOpenButton = screen.getAllByRole('button', { name: /open/i }).find(
      el => !el.closest('.relative')
    );
    await user.click(dialogOpenButton!);

    // File content should be loaded
    const textarea = screen.getByLabelText('Document content');
    await waitFor(() => {
      expect(textarea).toHaveValue('Opened via keyboard');
    });

    // Clean up
    vfs.deleteItem('/documents/keyboard-test.txt');
  });

  it('should show error dialog when file fails to load', async () => {
    const user = userEvent.setup();
    
    // Create a file then delete it to simulate a race condition
    vfs.writeFile('/documents/temp-file.txt', 'Temporary content');
    
    renderNotepad({ initialContent: '', documentId: 'initial-doc' });

    // Open File menu
    const fileMenuButton = screen.getByText('File');
    await user.click(fileMenuButton);

    // Click Open
    const openButton = screen.getByText('Open...');
    await user.click(openButton);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText('📄 temp-file.txt')).toBeInTheDocument();
    });

    // Delete the file before opening (simulate error)
    vfs.deleteItem('/documents/temp-file.txt');

    // Try to select and open the file
    await user.click(screen.getByText('📄 temp-file.txt'));
    const dialogOpenButton = screen.getAllByRole('button', { name: /open/i }).find(
      el => !el.closest('.relative')
    );
    await user.click(dialogOpenButton!);

    // Error dialog should appear with retry option
    await waitFor(() => {
      expect(screen.getByText(/File not found: temp-file\.txt/i)).toBeInTheDocument();
      expect(screen.getByText(/Would you like to retry\?/i)).toBeInTheDocument();
    });
  });
});

describe('Notepad AI Integration', () => {
  beforeEach(() => {
    // Clear any existing test files
    try {
      vfs.deleteItem('/documents/ai-test-doc.txt');
    } catch {
      // File might not exist
    }
  });

  it('should show error when summarizing empty document', async () => {
    const user = userEvent.setup();
    renderNotepad({ initialContent: '', documentId: 'ai-test-doc' });

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Summarize
    const summarizeButton = screen.getByText('Summarize');
    await user.click(summarizeButton);

    // Should show error dialog
    await waitFor(() => {
      expect(screen.getByText('No text to summarize')).toBeInTheDocument();
    });
  });

  it('should generate and display summary', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'This is a long document that needs to be summarized. It contains multiple sentences and paragraphs.',
      documentId: 'ai-test-doc' 
    });

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Summarize
    const summarizeButton = screen.getByText('Summarize');
    await user.click(summarizeButton);

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText(/AI Processing/i)).toBeInTheDocument();
    });

    // Wait for summary to appear
    await waitFor(() => {
      expect(screen.getByText('Summary:')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Summary panel should be visible with content
    const summaryPanel = screen.getByText('Summary:').parentElement;
    expect(summaryPanel).toBeInTheDocument();
  });

  it('should clear summary when user edits document', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'Original content for summarization.',
      documentId: 'ai-test-doc' 
    });

    // Generate summary first
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);
    const summarizeButton = screen.getByText('Summarize');
    await user.click(summarizeButton);

    // Wait for summary to appear
    await waitFor(() => {
      expect(screen.getByText('Summary:')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Edit the document
    const textarea = screen.getByLabelText('Document content');
    await user.type(textarea, ' Additional text');

    // Summary should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Summary:')).not.toBeInTheDocument();
    });
  });

  it('should clear summary when creating new document', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'Content with summary.',
      documentId: 'ai-test-doc' 
    });

    // Generate summary first
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);
    const summarizeButton = screen.getByText('Summarize');
    await user.click(summarizeButton);

    // Wait for summary to appear
    await waitFor(() => {
      expect(screen.getByText('Summary:')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Create new document
    const fileMenuButton = screen.getByText('File');
    await user.click(fileMenuButton);
    const newButton = screen.getByText('New');
    await user.click(newButton);

    // Summary should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Summary:')).not.toBeInTheDocument();
    });
  });

  it('should allow closing summary panel', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'Content to summarize.',
      documentId: 'ai-test-doc' 
    });

    // Generate summary
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);
    const summarizeButton = screen.getByText('Summarize');
    await user.click(summarizeButton);

    // Wait for summary to appear
    await waitFor(() => {
      expect(screen.getByText('Summary:')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Click close button
    const closeButton = screen.getByLabelText('Close summary');
    await user.click(closeButton);

    // Summary should be removed
    expect(screen.queryByText('Summary:')).not.toBeInTheDocument();
  });

  it('should show loading indicator during AI operation', async () => {
    const user = userEvent.setup();
    
    // Clear cache to ensure operation takes time
    aiClient.clearCache();
    
    renderNotepad({ 
      initialContent: 'Content to summarize that is unique to avoid cache hits for this specific test case.',
      documentId: 'ai-test-doc' 
    });

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Summarize
    const summarizeButton = screen.getByText('Summarize');
    await user.click(summarizeButton);

    // Verify loading indicator appears (even if briefly)
    // The mock provider is fast, but we should still see the loading state
    await waitFor(() => {
      expect(screen.getByText(/AI Processing/i)).toBeInTheDocument();
    }, { timeout: 100 });
  });

  it('should show error when rewriting with no selection', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'Some text content',
      documentId: 'ai-test-doc' 
    });

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Rewrite (without selecting text)
    const rewriteButton = screen.getByText('Rewrite');
    await user.click(rewriteButton);

    // Should show error dialog
    await waitFor(() => {
      expect(screen.getByText('Please select text to rewrite')).toBeInTheDocument();
    });
  });

  it('should rewrite selected text with default style', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: "I don't think this is correct",
      documentId: 'ai-test-doc' 
    });

    const textarea = screen.getByLabelText('Document content') as HTMLTextAreaElement;
    
    // Select text by triple-clicking (selects all)
    await user.tripleClick(textarea);

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Rewrite
    const rewriteButton = screen.getByText('Rewrite');
    await user.click(rewriteButton);

    // Wait for rewrite to complete
    await waitFor(() => {
      const content = textarea.value;
      expect(content).toBeTruthy();
      // Default style just trims, so content should be similar
      expect(content).toContain('think');
    }, { timeout: 2000 });
  });

  it('should rewrite selected text with formal style', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: "I don't think this can't be done",
      documentId: 'ai-test-doc' 
    });

    const textarea = screen.getByLabelText('Document content') as HTMLTextAreaElement;
    
    // Select text by triple-clicking (selects all)
    await user.tripleClick(textarea);

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Formal style
    const formalButton = screen.getByText('Formal');
    await user.click(formalButton);

    // Wait for rewrite to complete
    await waitFor(() => {
      const content = textarea.value;
      // Formal style should expand contractions
      expect(content).toContain('do not');
      expect(content).toContain('cannot');
    }, { timeout: 2000 });
  });

  it('should rewrite selected text with casual style', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'I do not think this is correct',
      documentId: 'ai-test-doc' 
    });

    const textarea = screen.getByLabelText('Document content') as HTMLTextAreaElement;
    
    // Select text by triple-clicking (selects all)
    await user.tripleClick(textarea);

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Casual style
    const casualButton = screen.getByText('Casual');
    await user.click(casualButton);

    // Wait for rewrite to complete
    await waitFor(() => {
      const content = textarea.value;
      // Casual style should contract phrases
      expect(content).toContain("don't");
    }, { timeout: 2000 });
  });

  it('should rewrite selected text with concise style', async () => {
    const user = userEvent.setup();
    renderNotepad({ 
      initialContent: 'This is a very long sentence with many words that could be shortened',
      documentId: 'ai-test-doc' 
    });

    const textarea = screen.getByLabelText('Document content') as HTMLTextAreaElement;
    
    // Select text by triple-clicking (selects all)
    await user.tripleClick(textarea);

    // Open AI menu
    const aiMenuButton = screen.getByText('AI');
    await user.click(aiMenuButton);

    // Click Concise style
    const conciseButton = screen.getByText('Concise');
    await user.click(conciseButton);

    // Wait for rewrite to complete
    await waitFor(() => {
      const content = textarea.value;
      // Concise style should shorten the text
      expect(content.length).toBeLessThan(70);
      expect(content).toContain('...');
    }, { timeout: 2000 });
  });
});
