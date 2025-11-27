/**
 * Explorer Component Unit Tests
 * 
 * Tests for navigation history management, folder tree expand/collapse,
 * file list rendering, and context menu positioning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Explorer } from './Explorer';
import { vfs } from '@core/file-system/vfs';
import { WindowManagerProvider } from '@core/window-manager/WindowContext';

// Mock window ID for testing
const TEST_WINDOW_ID = 'test-explorer-window';

// Helper to render Explorer with WindowManager context
const renderExplorer = (props = {}) => {
  return render(
    <WindowManagerProvider>
      <Explorer windowId={TEST_WINDOW_ID} {...props} />
    </WindowManagerProvider>
  );
};

describe('Explorer - Navigation History Management', () => {
  beforeEach(() => {
    // Ensure test folders exist
    try {
      vfs.createFolder('/test-folder-1');
      vfs.createFolder('/test-folder-2');
    } catch {
      // Folders might already exist
    }
  });

  it('should initialize with root path in history', () => {
    renderExplorer({ initialPath: '/' });
    
    // Address bar should show root path
    const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
    expect(addressBar.value).toBe('/');
  });

  it('should add new path to history when navigating', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Navigate to a folder by double-clicking - get from file list (second occurrence)
    const folders = screen.getAllByText('test-folder-1');
    await user.dblClick(folders[1]); // Use file list item, not tree item
    
    // Address bar should update
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/test-folder-1');
    });
  });

  it('should enable back button after navigation', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Back button should be disabled initially
    const backButton = screen.getByLabelText('Back');
    expect(backButton).toBeDisabled();
    
    // Navigate to a folder - get from file list (second occurrence)
    const folders = screen.getAllByText('test-folder-1');
    await user.dblClick(folders[1]); // Use file list item, not tree item
    
    // Back button should now be enabled
    await waitFor(() => {
      expect(backButton).not.toBeDisabled();
    });
  });

  it('should navigate back to previous path when back button is clicked', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Navigate to a folder - get from file list (second occurrence)
    const folders = screen.getAllByText('test-folder-1');
    await user.dblClick(folders[1]); // Use file list item, not tree item
    
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/test-folder-1');
    });
    
    // Click back button
    const backButton = screen.getByLabelText('Back');
    await user.click(backButton);
    
    // Should be back at root
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/');
    });
  });

  it('should enable forward button after navigating back', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Navigate to a folder - get from file list (second occurrence)
    const folders = screen.getAllByText('test-folder-1');
    await user.dblClick(folders[1]); // Use file list item, not tree item
    
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/test-folder-1');
    });
    
    // Navigate back
    const backButton = screen.getByLabelText('Back');
    await user.click(backButton);
    
    // Forward button should now be enabled
    await waitFor(() => {
      const forwardButton = screen.getByLabelText('Forward');
      expect(forwardButton).not.toBeDisabled();
    });
  });

  it('should truncate forward history when navigating to new path', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Navigate to folder 1 - get from file list (second occurrence)
    const folders1 = screen.getAllByText('test-folder-1');
    await user.dblClick(folders1[1]); // Use file list item, not tree item
    
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/test-folder-1');
    });
    
    // Navigate back
    const backButton = screen.getByLabelText('Back');
    await user.click(backButton);
    
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/');
    });
    
    // Navigate to folder 2 (should truncate forward history) - get from file list (second occurrence)
    const folders2 = screen.getAllByText('test-folder-2');
    const folder2 = folders2[1]; // Use file list item, not tree item
    await user.dblClick(folder2);
    
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/test-folder-2');
    });
    
    // Forward button should be disabled (no forward history)
    const forwardButton = screen.getByLabelText('Forward');
    expect(forwardButton).toBeDisabled();
  });
});

describe('Explorer - Folder Tree Expand/Collapse', () => {
  beforeEach(() => {
    // Create nested folder structure for testing
    try {
      vfs.createFolder('/parent-folder');
      vfs.createFolder('/parent-folder/child-folder-1');
      vfs.createFolder('/parent-folder/child-folder-2');
    } catch {
      // Folders might already exist
    }
  });

  it('should expand folder when clicking expand icon', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Find all parent-folder elements (one in tree, one in file list)
    const parentFolders = screen.getAllByText('parent-folder');
    // The first one should be in the tree
    const parentFolder = parentFolders[0].closest('[role="treeitem"]');
    // Get the expand/collapse icon (first span with aria-hidden)
    const expandIcon = parentFolder?.querySelector('span[aria-hidden="true"]');
    
    expect(expandIcon?.textContent).toBe('+');
    
    // Click expand icon
    if (expandIcon) {
      await user.click(expandIcon);
    }
    
    // Should show minus icon and children
    await waitFor(() => {
      expect(expandIcon?.textContent).toBe('−');
      expect(screen.getByText('child-folder-1')).toBeInTheDocument();
      expect(screen.getByText('child-folder-2')).toBeInTheDocument();
    });
  });

  it('should collapse folder when clicking collapse icon', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Find all parent-folder elements (one in tree, one in file list)
    const parentFolders = screen.getAllByText('parent-folder');
    // The first one should be in the tree
    const parentTreeItem = parentFolders[0].closest('[role="treeitem"]');
    
    // Get the expand/collapse icon (first span with aria-hidden)
    const expandIcon = parentTreeItem?.querySelector('span[aria-hidden="true"]');
    
    // Should start collapsed
    expect(expandIcon?.textContent).toBe('+');
    
    // Click to expand
    if (expandIcon) {
      await user.click(expandIcon);
    }
    
    // Wait for children to appear in tree
    await waitFor(() => {
      expect(expandIcon?.textContent).toBe('−');
      expect(screen.getByText('child-folder-1')).toBeInTheDocument();
    });
    
    // Click collapse icon
    if (expandIcon) {
      await user.click(expandIcon);
    }
    
    // Tree children should be hidden
    await waitFor(() => {
      expect(expandIcon?.textContent).toBe('+');
      // Children should not appear in tree anymore (only parent-folder is in file list)
      expect(screen.queryByText('child-folder-1')).not.toBeInTheDocument();
    });
  });

  it('should load folder children from VFS on expand', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Spy on VFS readFolder
    const readFolderSpy = vi.spyOn(vfs, 'readFolder');
    
    // Find all parent-folder elements (one in tree, one in file list)
    const parentFolders = screen.getAllByText('parent-folder');
    // The first one should be in the tree
    const parentFolder = parentFolders[0].closest('div');
    const expandIcon = parentFolder?.querySelector('span');
    
    if (expandIcon) {
      await user.click(expandIcon);
    }
    
    // Should call readFolder with parent path
    await waitFor(() => {
      expect(readFolderSpy).toHaveBeenCalledWith('/parent-folder');
    });
    
    readFolderSpy.mockRestore();
  });

  it('should update file list when folder is selected in tree', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/' });
    
    // Find all parent-folder elements (one in tree, one in file list)
    const parentFolders = screen.getAllByText('parent-folder');
    // Click on the first one (in the tree)
    await user.click(parentFolders[0]);
    
    // Address bar should update
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/parent-folder');
    });
  });
});

describe('Explorer - File List Rendering', () => {
  beforeEach(() => {
    // Create test files and folders
    try {
      vfs.createFolder('/test-render');
      vfs.writeFile('/test-render/file1.txt', 'content 1');
      vfs.writeFile('/test-render/file2.md', 'content 2');
      vfs.createFolder('/test-render/subfolder');
    } catch {
      // Items might already exist
    }
  });

  it('should render all items in current folder', async () => {
    renderExplorer({ initialPath: '/test-render' });
    
    // Should show all items
    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.md')).toBeInTheDocument();
      expect(screen.getByText('subfolder')).toBeInTheDocument();
    });
  });

  it('should display item count in status bar', async () => {
    renderExplorer({ initialPath: '/test-render' });
    
    // Status bar should show item count
    await waitFor(() => {
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });
  });

  it('should show empty folder message when folder is empty', async () => {
    // Create empty folder
    try {
      vfs.createFolder('/empty-folder');
    } catch {
      // Folder might already exist
    }
    
    renderExplorer({ initialPath: '/empty-folder' });
    
    // Should show empty message
    await waitFor(() => {
      expect(screen.getByText('This folder is empty')).toBeInTheDocument();
    });
  });

  it('should toggle between list and icon view modes', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/test-render' });
    
    // Find view mode toggle button
    const toggleButton = screen.getByLabelText(/Switch to icon view/i);
    
    // Click to switch to icon view
    await user.click(toggleButton);
    
    // Button label should update
    await waitFor(() => {
      expect(screen.getByLabelText(/Switch to list view/i)).toBeInTheDocument();
    });
  });

  it('should select item when clicked', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/test-render' });
    
    // Click on a file
    const file = screen.getByText('file1.txt');
    await user.click(file);
    
    // Item should be selected (has navy background)
    await waitFor(() => {
      const fileElement = file.closest('div');
      expect(fileElement).toHaveClass('bg-win95-navy');
    });
  });

  it('should navigate into folder on double-click', async () => {
    const user = userEvent.setup();
    renderExplorer({ initialPath: '/test-render' });
    
    // Double-click on subfolder
    const subfolder = screen.getByText('subfolder');
    await user.dblClick(subfolder);
    
    // Should navigate to subfolder
    await waitFor(() => {
      const addressBar = screen.getByLabelText('Address bar') as HTMLInputElement;
      expect(addressBar.value).toBe('/test-render/subfolder');
    });
  });
});

describe('Explorer - Context Menu Positioning', () => {
  beforeEach(() => {
    // Create test folder with items
    try {
      vfs.createFolder('/context-test');
      vfs.writeFile('/context-test/test-file.txt', 'content');
      vfs.createFolder('/context-test/test-folder');
    } catch {
      // Items might already exist
    }
  });

  it('should show context menu when right-clicking empty space', async () => {
    // Create empty folder
    try {
      vfs.createFolder('/empty-context-test');
    } catch {
      // Folder might already exist
    }
    
    renderExplorer({ initialPath: '/empty-context-test' });
    
    // Right-click on empty space
    const emptyMessage = screen.getByText('This folder is empty');
    const emptyContainer = emptyMessage.closest('div');
    
    if (emptyContainer) {
      fireEvent.contextMenu(emptyContainer, { clientX: 100, clientY: 100 });
    }
    
    // Should show new folder option
    await waitFor(() => {
      expect(screen.getByText('New Folder')).toBeInTheDocument();
    });
  });

  it('should position context menu at cursor coordinates', async () => {
    // Create empty folder
    try {
      vfs.createFolder('/empty-context-test-2');
    } catch {
      // Folder might already exist
    }
    
    renderExplorer({ initialPath: '/empty-context-test-2' });
    
    // Right-click on empty space with specific coordinates
    const emptyMessage = screen.getByText('This folder is empty');
    const emptyContainer = emptyMessage.closest('div');
    
    if (emptyContainer) {
      fireEvent.contextMenu(emptyContainer, { clientX: 150, clientY: 200 });
    }
    
    // Context menu should appear at the specified position
    await waitFor(() => {
      const newFolderMenuItem = screen.getByText('New Folder');
      // Get the parent div which is the context menu container (has role="menu")
      const contextMenu = newFolderMenuItem.closest('[role="menu"]');
      expect(contextMenu).toHaveStyle('left: 150px');
      expect(contextMenu).toHaveStyle('top: 200px');
    });
  });

  it('should close context menu when clicking outside', async () => {
    const user = userEvent.setup();
    
    // Create empty folder
    try {
      vfs.createFolder('/empty-context-test-3');
    } catch {
      // Folder might already exist
    }
    
    renderExplorer({ initialPath: '/empty-context-test-3' });
    
    // Right-click to open context menu
    const emptyMessage = screen.getByText('This folder is empty');
    const emptyContainer = emptyMessage.closest('div');
    
    if (emptyContainer) {
      fireEvent.contextMenu(emptyContainer, { clientX: 100, clientY: 100 });
    }
    
    // Context menu should appear
    await waitFor(() => {
      expect(screen.getByText('New Folder')).toBeInTheDocument();
    });
    
    // Click outside (on the address bar) - use mousedown to trigger outside click
    const addressBar = screen.getByLabelText('Address bar');
    fireEvent.mouseDown(addressBar);
    
    // Context menu should close
    await waitFor(() => {
      expect(screen.queryByText('New Folder')).not.toBeInTheDocument();
    });
  });

  it('should close context menu after selecting an action', async () => {
    const user = userEvent.setup();
    
    // Create empty folder
    try {
      vfs.createFolder('/empty-context-test-4');
    } catch {
      // Folder might already exist
    }
    
    renderExplorer({ initialPath: '/empty-context-test-4' });
    
    // Right-click to open context menu
    const emptyMessage = screen.getByText('This folder is empty');
    const emptyContainer = emptyMessage.closest('div');
    
    if (emptyContainer) {
      fireEvent.contextMenu(emptyContainer, { clientX: 100, clientY: 100 });
    }
    
    // Click on New Folder
    const newFolderOption = await screen.findByText('New Folder');
    await user.click(newFolderOption);
    
    // Context menu should close
    await waitFor(() => {
      // Context menu closes, but we should see the new folder in rename mode
      expect(screen.queryByText('New Folder')).not.toBeInTheDocument();
    });
  });
});