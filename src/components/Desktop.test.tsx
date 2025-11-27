/**
 * Unit tests for Desktop component
 * Tests boot sequence state transitions and desktop initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Desktop } from './Desktop';

describe('Desktop Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Boot sequence state transitions', () => {
    it('should initially display the boot screen', () => {
      render(<Desktop bootDuration={3000} />);
      
      // Boot screen should be visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('System boot screen')).toBeInTheDocument();
    });

    it('should transition from boot screen to desktop after boot duration', async () => {
      render(<Desktop bootDuration={3000} />);
      
      // Boot screen should be visible initially
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Fast-forward time by boot duration
      await vi.advanceTimersByTimeAsync(3000);
      
      // Desktop workspace should now be visible
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('System boot screen')).not.toBeInTheDocument();
    });

    it('should use default boot duration of 3000ms when not specified', async () => {
      render(<Desktop />);
      
      // Boot screen should be visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Fast-forward by default duration
      await vi.advanceTimersByTimeAsync(3000);
      
      // Boot screen should be gone
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should respect custom boot duration', async () => {
      render(<Desktop bootDuration={1000} />);
      
      // Boot screen should still be visible after 500ms
      await vi.advanceTimersByTimeAsync(500);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Boot screen should be gone after 1000ms
      await vi.advanceTimersByTimeAsync(500);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Desktop initialization', () => {
    it('should render desktop workspace after boot completes', async () => {
      render(<Desktop bootDuration={100} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      // Desktop workspace should be rendered
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('System boot screen')).not.toBeInTheDocument();
    });
  });
});
