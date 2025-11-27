/**
 * DesktopWorkspace Component
 * 
 * Renders the main desktop area with grey textured background.
 * Contains the Window Manager and handles desktop-level interactions.
 */

import React, { useState } from 'react';
import { WindowManager } from '../../core/window-manager/WindowManager';
import { useWindowManager } from '../../core/window-manager/WindowContext';
import { Button } from './Button';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';

export const DesktopWorkspace: React.FC = () => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const { openWindow } = useWindowManager();

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

  return (
    <div
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
