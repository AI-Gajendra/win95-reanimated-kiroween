/**
 * DesktopWorkspace Component
 * 
 * Renders the main desktop area with grey textured background.
 * Contains the Window Manager and handles desktop-level interactions.
 */

import React, { useState, useEffect } from 'react';
import { WindowManager } from '../../core/window-manager/WindowManager';
import { useWindowManager } from '../../core/window-manager/WindowContext';
import { Button } from './Button';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';

export const DesktopWorkspace: React.FC = () => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const { openWindow, windows, focusWindow } = useWindowManager();

  // Handle clicks on the desktop background to close Start Menu
  const handleDesktopClick = () => {
    if (startMenuOpen) {
      setStartMenuOpen(false);
    }
  };

  const handleOpenTestWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWindow('testapp');
  };

  const handleStartClick = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const handleAppLaunch = (appId: string) => {
    openWindow(appId);
    setStartMenuOpen(false); // Close menu after launching app
  };

  const handleSearch = (query: string) => {
    // Placeholder for AI search integration
    console.log('Search query:', query);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows key (Meta) or Control+Escape to toggle Start Menu
      if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
        e.preventDefault();
        setStartMenuOpen(prev => !prev);
      }
      
      // Escape key to close Start Menu
      if (e.key === 'Escape' && startMenuOpen) {
        e.preventDefault();
        setStartMenuOpen(false);
      }
      
      // Alt+Tab for window cycling
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        
        // Get visible (non-minimized) windows
        const visibleWindows = windows.filter(w => !w.isMinimized);
        
        if (visibleWindows.length > 0) {
          // Find currently focused window
          const maxZIndex = Math.max(...visibleWindows.map(w => w.zIndex), 0);
          const currentIndex = visibleWindows.findIndex(w => w.zIndex === maxZIndex);
          
          // Cycle to next window (or first if at end)
          const nextIndex = (currentIndex + 1) % visibleWindows.length;
          const nextWindow = visibleWindows[nextIndex];
          
          focusWindow(nextWindow.id);
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startMenuOpen, windows, focusWindow]);

  return (
    <div
      role="main"
      className="w-screen h-screen bg-win95-teal flex flex-col"
      style={{
        fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', sans-serif",
      }}
      onClick={handleDesktopClick}
    >
      {/* Main desktop area - contains Window Manager */}
      <div className="flex-1 relative">
        <WindowManager />
        
        {/* Temporary test button */}
        <div className="absolute top-4 left-4">
          <Button onClick={handleOpenTestWindow}>
            Open Test Window
          </Button>
        </div>
      </div>

      {/* Start Menu */}
      <StartMenu
        isOpen={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        onAppLaunch={handleAppLaunch}
        onSearch={handleSearch}
      />

      {/* Taskbar */}
      <Taskbar onStartClick={handleStartClick} startMenuOpen={startMenuOpen} />
    </div>
  );
};
