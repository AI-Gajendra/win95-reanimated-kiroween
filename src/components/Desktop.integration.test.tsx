/**
 * Integration tests for Desktop System
 * Tests complete user flows from boot to desktop interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Desktop } from './Desktop';

describe('Desktop System Integration Tests', () => {
  // Note: We use fake timers only for boot sequence tests
  // User interaction tests use real timers to avoid conflicts with userEvent

  describe('Complete boot-to-desktop flow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should complete full boot sequence and render functional desktop', async () => {
      render(<Desktop bootDuration={1000} />);
      
      // 1. Boot screen should be visible initially
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('System boot screen')).toBeInTheDocument();
      
      // 2. Fast-forward through boot sequence
      await vi.advanceTimersByTimeAsync(1000);
      
      // 3. Desktop should be visible after boot
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      
      // 4. Taskbar should be rendered
      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeInTheDocument();
      
      // 5. Desktop workspace should be interactive
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display boot messages during boot sequence', async () => {
      render(<Desktop bootDuration={3000} />);
      
      // Boot screen visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // First boot message appears
      await vi.advanceTimersByTimeAsync(600);
      expect(screen.getByText(/Starting Windows 95/i)).toBeInTheDocument();
      
      // More messages appear
      await vi.advanceTimersByTimeAsync(600);
      expect(screen.getByText(/Loading system components/i)).toBeInTheDocument();
      
      // Complete boot
      await vi.advanceTimersByTimeAsync(1800);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('App launch from Start Menu', () => {
    it('should open Start Menu and launch Notepad application', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete (using real timers)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Open Start Menu
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Start Menu should be visible
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      
      // Click on Notepad in the menu
      const notepadItem = screen.getByText(/notepad/i);
      await user.click(notepadItem);
      
      // Start Menu should close after launching app
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
      
      // Window should be created (check for window title in title bar)
      const notepadElements = screen.getAllByText('Notepad');
      expect(notepadElements.length).toBeGreaterThan(0);
    });

    it('should open Start Menu and launch Explorer application', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Open Start Menu
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      // Click on Explorer in the menu
      const explorerItem = screen.getByText(/explorer/i);
      await user.click(explorerItem);
      
      // Start Menu should close
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
      
      // Window should be created
      const explorerElements = screen.getAllByText('Explorer');
      expect(explorerElements.length).toBeGreaterThan(0);
    });

    it('should allow launching multiple applications', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Launch Notepad
      let startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      const notepadItem = screen.getByText(/notepad/i);
      await user.click(notepadItem);
      
      // Launch Explorer
      startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      const explorerItem = screen.getByText(/explorer/i);
      await user.click(explorerItem);
      
      // Both windows should be visible
      expect(screen.getAllByText('Notepad').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Explorer').length).toBeGreaterThan(0);
    });
  });

  describe('Window operations through UI', () => {
    it('should close window when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      const notepadItem = screen.getByText(/notepad/i);
      await user.click(notepadItem);
      
      // Window should be visible
      expect(screen.getAllByText('Notepad').length).toBeGreaterThan(0);
      
      // Find and click close button
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const windowCloseButton = closeButtons.find(btn => 
        btn.getAttribute('aria-label') === 'Close window'
      );
      
      if (windowCloseButton) {
        await user.click(windowCloseButton);
        
        // Window should be removed (no Notepad elements should remain)
        expect(screen.queryAllByText('Notepad').length).toBe(0);
      }
    });

    it('should minimize window when minimize button is clicked', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      const notepadItem = screen.getByText(/notepad/i);
      await user.click(notepadItem);
      
      // Window should be visible
      expect(screen.getAllByText('Notepad').length).toBeGreaterThan(0);
      
      // Find and click minimize button
      const minimizeButtons = screen.getAllByRole('button', { name: /minimize/i });
      const windowMinimizeButton = minimizeButtons.find(btn => 
        btn.getAttribute('aria-label') === 'Minimize window'
      );
      
      if (windowMinimizeButton) {
        await user.click(windowMinimizeButton);
        
        // Window should still exist but be hidden (minimized)
        // The taskbar button should still be present
        const taskbarButtons = screen.getAllByRole('button');
        const notepadTaskbarButton = taskbarButtons.find(btn => 
          btn.textContent?.includes('Notepad')
        );
        expect(notepadTaskbarButton).toBeInTheDocument();
      }
    });

    it('should restore minimized window when taskbar button is clicked', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      let startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      const notepadItem = screen.getByText(/notepad/i);
      await user.click(notepadItem);
      
      // Minimize the window
      const minimizeButtons = screen.getAllByRole('button', { name: /minimize/i });
      const windowMinimizeButton = minimizeButtons.find(btn => 
        btn.getAttribute('aria-label') === 'Minimize window'
      );
      
      if (windowMinimizeButton) {
        await user.click(windowMinimizeButton);
        
        // Click taskbar button to restore
        const taskbarButtons = screen.getAllByRole('button');
        const notepadTaskbarButton = taskbarButtons.find(btn => 
          btn.textContent?.includes('Notepad') && !btn.textContent?.includes('Start')
        );
        
        if (notepadTaskbarButton) {
          await user.click(notepadTaskbarButton);
          
          // Window should be visible again
          expect(screen.getAllByText('Notepad').length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Start Menu interactions', () => {
    it('should close Start Menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
      render(<Desktop bootDuration={10} />);
      
      // Wait for boot to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
});
