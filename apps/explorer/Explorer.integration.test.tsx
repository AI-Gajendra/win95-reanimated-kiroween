/**
 * Explorer Integration Tests
 * 
 * Tests VFS integration, AI Engine integration, navigation flow, and CRUD operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Explorer } from './Explorer';
import { vfs } from '@core/file-system/vfs';
import { aiClient } from '@core/ai-engine/aiClient';
import { WindowManagerProvider } from '@core/window-manager/WindowContext';

// Mock window ID for testing
const TEST_WINDOW_ID = 'test-explorer-integration';

// Helper to render Explorer with WindowManager context
const renderExplorer = (props = {}) => {
  return render(
    <WindowManagerProvider>
      <Explorer windowId={TEST_WINDOW_ID} {...props} />
    </WindowManagerProvider>
  );
};

// Helper to clean up test folders
const cleanupTestFolders = () => {
  const testPaths = [
    '/integration-test',
    '/vfs-test',
    '/nav-test',
    '/crud-test',
    '/ai-test',
  ];

  testPaths.forEach(path => {
    try {
      vfs.deleteItem(path);
    } catch {
      // Folder might not exist
    }
  });
};

describe('Explorer - VFS Integration', () => {
  beforeEach(() => {
    cleanupTestFolders();
  });

  afterEach(() => {
    cleanupTestFolders();
  });

  it('should load folder contents from VFS on mount', async () => {
    // Create test folder structure
    vfs.createFolder('/vfs-test');
    vfs.writeFile('/vfs-test/file1.txt', 'content 1');
    vfs.writeFile('/vfs-test/file2.txt', 'content 2');
    vfs.createFolder('/vfs-test/subfolder');

    renderExplorer({ initialPath: '/vfs-test' });

    // Should display all items from VFS
    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
      expect(screen.getByText('subfolder')).toBeInTheDocument();
    });

    // Status bar should show correct count
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('should refresh file list when VFS emits fileCreated event', async () => {
    vfs.createFolder('/vfs-test');
    renderExplorer({ initialPath: '/vfs-test' });

    // Initially empty
    await waitFor(() => {
      expect(screen.getByText('This folder is empty')).toBeInTheDocument();
    });

    // Create a file through VFS
    vfs.writeFile('/vfs-test/new-file.txt', 'new content');

    // Manually trigger refresh (F5)
    const user = userEvent.setup();
    await user.keyboard('{F5}');

    // File should appear
    await waitFor(() => {
      expect(screen.getByText('new-file.txt')).toBeInTheDocument();
    });
  });

  it('should handle VFS errors gracefully', async () => {
    renderExplorer({ initialPath: '/non-existent-folder' });

    // Should show error dialog
    await waitFor(() => {
      expect(screen.getByText('Folder Not Found')).toBeInTheDocument();
    });
  });

  it('should persist folder structure across navigation', async () => {
    const user = userEvent.setup();

    // Create nested structure
    vfs.createFolder('/vfs-test');
    vfs.createFolder('/vfs-test/level1');
    vfs.createFolder('/vfs-test/level1/level2');
    vfs.writeFile('/vfs-test/level1/level2/deep-file.txt', 'deep content');

    renderExplorer({ initialPath: '/vfs-test' });

    // Navigate to level1
    const level1Folder = await screen.findByText('level1');
    await user.dblClick(level1Folder);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/vfs-test/level1');
    });

    // Navigate to level2
    const level2Folder = await screen.findByText('level2');
    await user.dblClick(level2Folder);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/vfs-test/level1/level2');
    });

    // Should show deep file
    expect(screen.getByText('deep-file.txt')).toBeInTheDocument();
  });

  it('should read file metadata correctly from VFS', async () => {
    vfs.createFolder('/vfs-test');
    const testContent = 'Test file content with some length';
    vfs.writeFile('/vfs-test/metadata-test.txt', testContent);

    renderExplorer({ initialPath: '/vfs-test' });

    // File should be displayed with size
    await waitFor(() => {
      expect(screen.getByText('metadata-test.txt')).toBeInTheDocument();
    });

    // Size should be displayed (content length in KB)
    const sizeInKB = Math.ceil(testContent.length / 1024);
    expect(screen.getByText(`${sizeInKB} KB`)).toBeInTheDocument();
  });
});

describe('Explorer - AI Engine Integration', () => {
  beforeEach(() => {
    cleanupTestFolders();
    aiClient.clearCache(); // Clear AI cache for consistent tests
  });

  afterEach(() => {
    cleanupTestFolders();
  });

  it('should call AI Engine explainFolder with correct data', async () => {
    const user = userEvent.setup();

    // Create test folder with files
    vfs.createFolder('/ai-test');
    vfs.writeFile('/ai-test/note1.txt', 'This is a note about work');
    vfs.writeFile('/ai-test/note2.txt', 'Another work-related note');
    vfs.writeFile('/ai-test/todo.txt', 'Todo list for project');

    // Spy on AI client
    const explainSpy = vi.spyOn(aiClient, 'explainFolder');

    renderExplorer({ initialPath: '/' });

    // Find, click to select, and right-click on ai-test folder
    const aiTestFolder = await screen.findByText('ai-test');
    await user.click(aiTestFolder);
    fireEvent.contextMenu(aiTestFolder, { clientX: 100, clientY: 100 });

    // Wait for context menu with folder-specific options
    await waitFor(() => {
      expect(screen.getByText('Explain this folder')).toBeInTheDocument();
    });

    // Click explain option
    await user.click(screen.getByText('Explain this folder'));

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText('Analyzing folder...')).toBeInTheDocument();
    });

    // Wait for AI call to complete
    await waitFor(() => {
      expect(explainSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify AI was called with correct data
    const callArgs = explainSpy.mock.calls[0][0];
    expect(callArgs.path).toBe('/ai-test');
    expect(callArgs.filenames).toContain('note1.txt');
    expect(callArgs.filenames).toContain('note2.txt');
    expect(callArgs.filenames).toContain('todo.txt');
    expect(callArgs.sampleContents.length).toBeGreaterThan(0);

    explainSpy.mockRestore();
  });

  it('should display AI explanation in panel', async () => {
    const user = userEvent.setup();

    // Create test folder
    vfs.createFolder('/ai-test');
    vfs.writeFile('/ai-test/document.txt', 'Important document');

    renderExplorer({ initialPath: '/' });

    // Find and right-click on ai-test folder
    const folder = await screen.findByText('ai-test');
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });

    // Click "Explain this folder"
    const explainOption = await screen.findByText('Explain this folder');
    await user.click(explainOption);

    // Wait for explanation panel
    await waitFor(() => {
      expect(screen.getByText('Folder Explanation')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Panel should show folder path
    expect(screen.getByText('/ai-test')).toBeInTheDocument();

    // Panel should show description
    expect(screen.getByText(/Description:/i)).toBeInTheDocument();

    // Panel should show recommendations
    expect(screen.getByText(/Recommendations:/i)).toBeInTheDocument();
  });

  it('should handle AI timeout gracefully', async () => {
    const user = userEvent.setup();

    // Mock AI client to simulate timeout
    const originalExplain = aiClient.explainFolder;
    aiClient.explainFolder = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Folder explanation timed out after 30 seconds')), 100);
      });
    });

    vfs.createFolder('/ai-test');
    renderExplorer({ initialPath: '/' });

    // Right-click on folder
    const folder = await screen.findByText('ai-test');
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });

    // Click explain
    const explainOption = await screen.findByText('Explain this folder');
    await user.click(explainOption);

    // Should show error dialog
    await waitFor(() => {
      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Restore original function
    aiClient.explainFolder = originalExplain;
  });

  it('should close explanation panel when close button is clicked', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/ai-test');
    vfs.writeFile('/ai-test/file.txt', 'content');

    renderExplorer({ initialPath: '/' });

    // Right-click on ai-test folder
    const folder = await screen.findByText('ai-test');
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });

    // Click "Explain this folder"
    const explainOption = await screen.findByText('Explain this folder');
    await user.click(explainOption);

    // Wait for explanation panel
    await waitFor(() => {
      expect(screen.getByText('Folder Explanation')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Click close button
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    // Panel should be closed
    await waitFor(() => {
      expect(screen.queryByText('Folder Explanation')).not.toBeInTheDocument();
    });
  });
});

describe('Explorer - Navigation Flow', () => {
  beforeEach(() => {
    cleanupTestFolders();
  });

  afterEach(() => {
    cleanupTestFolders();
  });

  it('should complete full navigation cycle: forward, back, up', async () => {
    const user = userEvent.setup();

    // Create folder structure
    vfs.createFolder('/nav-test');
    vfs.createFolder('/nav-test/child1');
    vfs.createFolder('/nav-test/child2');

    renderExplorer({ initialPath: '/' });

    // Navigate to nav-test
    const navTestFolder = await screen.findByText('nav-test');
    await user.dblClick(navTestFolder);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test');
    });

    // Navigate to child1
    const child1Folder = await screen.findByText('child1');
    await user.dblClick(child1Folder);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test/child1');
    });

    // Go back to nav-test
    const backButton = screen.getByLabelText('Back');
    await user.click(backButton);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test');
    });

    // Go forward to child1
    const forwardButton = screen.getByLabelText('Forward');
    await user.click(forwardButton);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test/child1');
    });

    // Go up to nav-test
    const upButton = screen.getByLabelText('Up');
    await user.click(upButton);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test');
    });
  });

  it('should navigate using address bar', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/nav-test');
    vfs.createFolder('/nav-test/deep');
    vfs.createFolder('/nav-test/deep/nested');

    renderExplorer({ initialPath: '/' });

    // Type path in address bar
    const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
    await user.clear(addressBar);
    await user.type(addressBar, '/nav-test/deep/nested');
    await user.keyboard('{Enter}');

    // Should navigate to the path
    await waitFor(() => {
      expect(addressBar.value).toBe('/nav-test/deep/nested');
    });
  });

  it('should handle invalid address bar navigation', async () => {
    const user = userEvent.setup();

    renderExplorer({ initialPath: '/' });

    // Type invalid path
    const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
    await user.clear(addressBar);
    await user.type(addressBar, '/invalid/path/that/does/not/exist');
    await user.keyboard('{Enter}');

    // Should show error dialog
    await waitFor(() => {
      expect(screen.getByText('Folder Not Found')).toBeInTheDocument();
    });
  });

  it('should navigate using folder tree', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/nav-test');
    vfs.createFolder('/nav-test/tree-child');

    renderExplorer({ initialPath: '/' });

    // Find nav-test in tree (first occurrence should be in tree)
    const navTestInTree = screen.getAllByText('nav-test')[0];
    
    // Expand the folder in tree
    const expandIcon = navTestInTree.closest('div')?.querySelector('span');
    if (expandIcon && expandIcon.textContent === '+') {
      await user.click(expandIcon);
    }

    // Wait for children to load
    await waitFor(() => {
      expect(screen.getByText('tree-child')).toBeInTheDocument();
    });

    // Click on tree-child in tree
    const treeChild = screen.getByText('tree-child');
    await user.click(treeChild);

    // Should navigate to tree-child
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test/tree-child');
    });
  });

  it('should use keyboard shortcuts for navigation', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/nav-test');
    vfs.createFolder('/nav-test/keyboard-nav');

    renderExplorer({ initialPath: '/' });

    // Navigate to nav-test
    const navTestFolder = await screen.findByText('nav-test');
    await user.dblClick(navTestFolder);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test');
    });

    // Use Backspace to go up
    await user.keyboard('{Backspace}');

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/');
    });

    // Navigate back to nav-test
    await user.dblClick(navTestFolder);

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test');
    });

    // Use Alt+Left to go back
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/');
    });

    // Use Alt+Right to go forward
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');

    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/nav-test');
    });

    // Use F5 to refresh
    await user.keyboard('{F5}');

    // Should still be at nav-test
    const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
    expect(addressBar.value).toBe('/nav-test');
  });
});

describe('Explorer - CRUD Operations', () => {
  beforeEach(() => {
    cleanupTestFolders();
  });

  afterEach(() => {
    cleanupTestFolders();
  });

  it('should create a new folder', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    renderExplorer({ initialPath: '/crud-test' });

    // Wait for empty folder message
    await waitFor(() => {
      expect(screen.getByText('This folder is empty')).toBeInTheDocument();
    });

    // Right-click in empty space
    const emptyArea = screen.getByText('This folder is empty');
    fireEvent.contextMenu(emptyArea, { clientX: 100, clientY: 100 });

    // Click "New Folder"
    const newFolderOption = await screen.findByText('New Folder');
    await user.click(newFolderOption);

    // Should enter rename mode with default name
    await waitFor(() => {
      const input = screen.getByDisplayValue('New Folder');
      expect(input).toBeInTheDocument();
    });

    // Type new name
    const input = screen.getByDisplayValue('New Folder') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'My New Folder');
    await user.keyboard('{Enter}');

    // Folder should be created and visible
    await waitFor(() => {
      expect(screen.getByText('My New Folder')).toBeInTheDocument();
    });

    // Verify in VFS
    expect(vfs.exists('/crud-test/My New Folder')).toBe(true);
  });

  it('should rename a folder', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    vfs.createFolder('/crud-test/old-name');

    renderExplorer({ initialPath: '/crud-test' });

    // Wait for folder to appear and click to select it
    const folder = await screen.findByText('old-name');
    await user.click(folder);

    // Right-click on folder
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });

    // Click "Rename"
    const renameOption = await screen.findByText('Rename');
    await user.click(renameOption);

    // Should enter rename mode
    await waitFor(() => {
      const input = screen.getByDisplayValue('old-name');
      expect(input).toBeInTheDocument();
    });

    // Type new name
    const input = screen.getByDisplayValue('old-name') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'new-name');
    await user.keyboard('{Enter}');

    // Folder should be renamed
    await waitFor(() => {
      expect(screen.getByText('new-name')).toBeInTheDocument();
      expect(screen.queryByText('old-name')).not.toBeInTheDocument();
    });

    // Verify in VFS
    expect(vfs.exists('/crud-test/new-name')).toBe(true);
    expect(vfs.exists('/crud-test/old-name')).toBe(false);
  });

  it('should delete a folder with confirmation', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    vfs.createFolder('/crud-test/to-delete');

    renderExplorer({ initialPath: '/crud-test' });

    // Wait for folder to appear
    const folder = await screen.findByText('to-delete');

    // Right-click on folder
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });

    // Click "Delete"
    const deleteOption = await screen.findByText('Delete');
    await user.click(deleteOption);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "to-delete"\?/)).toBeInTheDocument();
    });

    // Click "Yes" to confirm
    const yesButton = screen.getByRole('button', { name: 'Yes' });
    await user.click(yesButton);

    // Folder should be deleted
    await waitFor(() => {
      expect(screen.queryByText('to-delete')).not.toBeInTheDocument();
    });

    // Verify in VFS
    expect(vfs.exists('/crud-test/to-delete')).toBe(false);
  });

  it('should cancel delete operation', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    vfs.createFolder('/crud-test/keep-me');

    renderExplorer({ initialPath: '/crud-test' });

    // Wait for folder to appear
    const folder = await screen.findByText('keep-me');

    // Right-click on folder
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });

    // Click "Delete"
    const deleteOption = await screen.findByText('Delete');
    await user.click(deleteOption);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    // Click "No" to cancel
    const noButton = screen.getByRole('button', { name: 'No' });
    await user.click(noButton);

    // Folder should still exist
    await waitFor(() => {
      expect(screen.getByText('keep-me')).toBeInTheDocument();
    });

    // Verify in VFS
    expect(vfs.exists('/crud-test/keep-me')).toBe(true);
  });

  it('should delete using Delete key', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    vfs.createFolder('/crud-test/delete-with-key');

    renderExplorer({ initialPath: '/crud-test' });

    // Wait for folder and select it
    const folder = await screen.findByText('delete-with-key');
    await user.click(folder);

    // Press Delete key
    await user.keyboard('{Delete}');

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    // Confirm deletion
    const yesButton = screen.getByRole('button', { name: 'Yes' });
    await user.click(yesButton);

    // Folder should be deleted
    await waitFor(() => {
      expect(screen.queryByText('delete-with-key')).not.toBeInTheDocument();
    });
  });

  it('should handle rename conflicts', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    vfs.createFolder('/crud-test/folder1');
    vfs.createFolder('/crud-test/folder2');

    renderExplorer({ initialPath: '/crud-test' });

    // Wait for folders to appear
    const folder1 = await screen.findByText('folder1');

    // Right-click on folder1
    fireEvent.contextMenu(folder1, { clientX: 100, clientY: 100 });

    // Click "Rename"
    const renameOption = await screen.findByText('Rename');
    await user.click(renameOption);

    // Try to rename to existing name
    const input = await screen.findByDisplayValue('folder1') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'folder2');
    await user.keyboard('{Enter}');

    // Should show error dialog
    await waitFor(() => {
      expect(screen.getByText('Rename Failed')).toBeInTheDocument();
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('should complete full CRUD cycle', async () => {
    const user = userEvent.setup();

    vfs.createFolder('/crud-test');
    renderExplorer({ initialPath: '/crud-test' });

    // CREATE: Create new folder
    const emptyArea = await screen.findByText('This folder is empty');
    fireEvent.contextMenu(emptyArea, { clientX: 100, clientY: 100 });
    const newFolderOption = await screen.findByText('New Folder');
    await user.click(newFolderOption);

    const createInput = await screen.findByDisplayValue('New Folder') as HTMLInputElement;
    await user.clear(createInput);
    await user.type(createInput, 'test-folder');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('test-folder')).toBeInTheDocument();
    });

    // READ: Verify folder exists
    expect(vfs.exists('/crud-test/test-folder')).toBe(true);

    // UPDATE: Rename folder
    const folder = screen.getByText('test-folder');
    fireEvent.contextMenu(folder, { clientX: 100, clientY: 100 });
    const renameOption = await screen.findByText('Rename');
    await user.click(renameOption);

    const renameInput = await screen.findByDisplayValue('test-folder') as HTMLInputElement;
    await user.clear(renameInput);
    await user.type(renameInput, 'renamed-folder');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('renamed-folder')).toBeInTheDocument();
      expect(screen.queryByText('test-folder')).not.toBeInTheDocument();
    });

    // DELETE: Delete folder
    const renamedFolder = screen.getByText('renamed-folder');
    fireEvent.contextMenu(renamedFolder, { clientX: 100, clientY: 100 });
    const deleteOption = await screen.findByText('Delete');
    await user.click(deleteOption);

    const yesButton = await screen.findByRole('button', { name: 'Yes' });
    await user.click(yesButton);

    await waitFor(() => {
      expect(screen.queryByText('renamed-folder')).not.toBeInTheDocument();
      expect(screen.getByText('This folder is empty')).toBeInTheDocument();
    });

    // Verify deletion in VFS
    expect(vfs.exists('/crud-test/renamed-folder')).toBe(false);
  });
});
