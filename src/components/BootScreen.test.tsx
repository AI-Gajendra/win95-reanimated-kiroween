/**
 * Unit tests for BootScreen component
 * Tests boot message display and completion callback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BootScreen } from './BootScreen';

describe('BootScreen Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render boot screen with initial styling', () => {
    render(<BootScreen duration={3000} />);
    
    const bootScreen = screen.getByRole('alert');
    expect(bootScreen).toBeInTheDocument();
    expect(bootScreen).toHaveAttribute('aria-label', 'System boot screen');
  });

  it('should display boot messages sequentially', async () => {
    render(<BootScreen duration={3000} />);
    
    // Initially no messages
    expect(screen.queryByText(/Starting Windows 95/i)).not.toBeInTheDocument();
    
    // First message appears after first interval (3000ms / 5 messages = 600ms)
    await vi.advanceTimersByTimeAsync(600);
    expect(screen.getByText(/Starting Windows 95/i)).toBeInTheDocument();
    
    // Second message appears
    await vi.advanceTimersByTimeAsync(600);
    expect(screen.getByText(/Loading system components/i)).toBeInTheDocument();
    
    // Third message appears
    await vi.advanceTimersByTimeAsync(600);
    expect(screen.getByText(/Initializing virtual file system/i)).toBeInTheDocument();
    
    // Fourth message appears
    await vi.advanceTimersByTimeAsync(600);
    expect(screen.getByText(/Resurrecting system components/i)).toBeInTheDocument();
    
    // Fifth message appears
    await vi.advanceTimersByTimeAsync(600);
    expect(screen.getByText(/Preparing desktop environment/i)).toBeInTheDocument();
  });

  it('should call onBootComplete callback after duration', async () => {
    const onBootComplete = vi.fn();
    render(<BootScreen duration={3000} onBootComplete={onBootComplete} />);
    
    // Callback should not be called initially
    expect(onBootComplete).not.toHaveBeenCalled();
    
    // Fast-forward to completion
    await vi.advanceTimersByTimeAsync(3000);
    
    // Callback should be called once
    expect(onBootComplete).toHaveBeenCalledTimes(1);
  });

  it('should use default duration of 3000ms when not specified', async () => {
    const onBootComplete = vi.fn();
    render(<BootScreen onBootComplete={onBootComplete} />);
    
    // Should not complete before 3000ms
    await vi.advanceTimersByTimeAsync(2999);
    expect(onBootComplete).not.toHaveBeenCalled();
    
    // Should complete at 3000ms
    await vi.advanceTimersByTimeAsync(1);
    expect(onBootComplete).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timers on unmount', () => {
    const onBootComplete = vi.fn();
    const { unmount } = render(<BootScreen duration={3000} onBootComplete={onBootComplete} />);
    
    // Unmount before completion
    unmount();
    
    // Fast-forward time
    vi.advanceTimersByTime(3000);
    
    // Callback should not be called after unmount
    expect(onBootComplete).not.toHaveBeenCalled();
  });
});
