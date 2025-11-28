/**
 * Electron Title Bar Component
 * 
 * Custom Win95-style title bar for the Electron shell that provides
 * window controls (minimize, maximize, close) and window dragging.
 * 
 * This component integrates with the Electron API exposed via preload script
 * to control the native window.
 * 
 * @requirements 2.3, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect } from 'react';
import type { ElectronAPI } from '../../electron/electron.d';

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

interface ElectronTitleBarProps {
  title?: string;
  icon?: string;
}

export const ElectronTitleBar: React.FC<ElectronTitleBarProps> = ({
  title = 'Win95 Reanimated',
  icon,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Check initial maximized state and subscribe to changes
  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    // Get initial state
    electronAPI.isMaximized().then(setIsMaximized);

    // Subscribe to maximize/unmaximize events
    const unsubMaximized = electronAPI.onWindowMaximized(() => {
      setIsMaximized(true);
    });

    const unsubUnmaximized = electronAPI.onWindowUnmaximized(() => {
      setIsMaximized(false);
    });

    return () => {
      unsubMaximized();
      unsubUnmaximized();
    };
  }, []);

  /**
   * Minimize window to taskbar
   * @requirements 4.1
   */
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  /**
   * Toggle maximize/unmaximize state
   * @requirements 4.2
   */
  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  /**
   * Close the application
   * @requirements 4.3
   */
  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  // Don't render if not in Electron environment
  if (!window.electronAPI) {
    return null;
  }

  return (
    <div
      className="
        bg-win95-navy
        text-win95-white
        font-win95
        text-[11px]
        h-[24px]
        flex
        items-center
        justify-between
        px-1
        select-none
      "
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left side: Icon and Title */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {icon && (
          <img
            src={icon}
            alt=""
            className="w-4 h-4 flex-shrink-0"
          />
        )}
        <span className="truncate font-bold">{title}</span>
      </div>

      {/* Right side: Window Control Buttons */}
      <div 
        className="flex gap-0.5 flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className="
            w-4 h-4
            bg-win95-gray
            win95-outset
            flex
            items-center
            justify-center
            active:win95-pressed
          "
          aria-label="Minimize"
        >
          <span className="text-win95-black text-[8px] font-bold mb-1">_</span>
        </button>
        
        {/* Maximize/Restore Button */}
        <button
          onClick={handleMaximize}
          className="
            w-4 h-4
            bg-win95-gray
            win95-outset
            flex
            items-center
            justify-center
            active:win95-pressed
          "
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            // Restore icon (overlapping squares)
            <span className="text-win95-black text-[8px] font-bold">❐</span>
          ) : (
            // Maximize icon (single square)
            <span className="text-win95-black text-[10px] font-bold">□</span>
          )}
        </button>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="
            w-4 h-4
            bg-win95-gray
            win95-outset
            flex
            items-center
            justify-center
            active:win95-pressed
          "
          aria-label="Close"
        >
          <span className="text-win95-black text-[10px] font-bold">×</span>
        </button>
      </div>
    </div>
  );
};
