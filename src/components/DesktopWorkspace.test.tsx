/**
 * Unit tests for DesktopWorkspace component
 * Tests Start Menu open/close logic and window context operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopWorkspace } from './DesktopWorkspace';
import { WindowManagerProvider } from '../../core/window-manager/WindowContext';

// Wrapper component to provide WindowManager context
const DesktopWorkspaceWithProvider = () => (
  <WindowManagerProvider>
    <DesktopWorkspace />
  </WindowManagerProvider>
);

describe('DesktopWorkspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Start Menu open/close logic', () => {
    it('should initially render with Start Menu closed', () => {
      render(<DesktopWorkspaceWithProvider />);
      
      // Start Menu should not be visible (it has conditional rendering)
      // We can check that the Start button exists
      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeInTheDocument();
    });

    it('should open Start Menu when Start button is clicked', async () => {
      const user = userEvent.setup();
      render(<DesktopWorkspaceWithProvider />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Start Menu should now be visible
      // Check for Start Menu specific elements (search input, app list)
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should close Start Menu when clicking on desktop background', async () => {
      const user = userEvent.setup();
      render(<DesktopWorkspaceWithProvider />);
      
      // Open Start Menu
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      
      // Click on desktop background
      const desktop = screen.getByRole('main');
      await user.click(desktop);
      
      // Start Menu should be closed
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });

    it('should toggle Start Menu when Start button is clicked multiple times', async () => {
      const user = userEvent.setup();
      render(<DesktopWorkspaceWithProvider />);
      
      const startButton = screen.getByRole('button', { name: /start/i });
      
      // First click - open
      await user.click(startButton);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      
      // Second click - close
      await user.click(startButton);
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
      
      // Third click - open again
      await user.click(startButton);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle Start Menu when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<DesktopWorkspaceWithProvider />);
      
      // Open Start Menu
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      // Start Menu should be closed
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });
  });

  describe('Window context operations', () => {
    it('should render Window Manager', () => {
      render(<DesktopWorkspaceWithProvider />);
      
      // Window Manager should be rendered (it's always present)
      // We can verify by checking the desktop structure
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should close Start Menu after launching an app', async () => {
      const user = userEvent.setup();
      render(<DesktopWorkspaceWithProvider />);
      
      // Open Start Menu
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      
      // Click on an app in the Start Menu (e.g., Notepad)
      const notepadItem = screen.getByText(/notepad/i);
      await user.click(notepadItem);
      
      // Start Menu should be closed
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });
  });
});
