/**
 * Taskbar Component
 * 
 * The horizontal bar at the bottom of the screen containing:
 * - Start button (left)
 * - Window list (center)
 * - System tray with clock (right)
 */

import React, { useState, useEffect } from 'react';
import { useWindowManager } from '../../core/window-manager/WindowContext';

interface TaskbarProps {
  onStartClick: () => void;
  startMenuOpen?: boolean;
}

export const Taskbar: React.FC<TaskbarProps> = ({ onStartClick, startMenuOpen = false }) => {
  const { windows, focusWindow } = useWindowManager();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // Update immediately
    updateTime();

    // Set up interval to update every minute
    const intervalId = setInterval(updateTime, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Format time in 12-hour format with AM/PM
  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Get the focused window (highest z-index)
  const focusedWindow = windows.length > 0
    ? windows.reduce((max, w) => w.zIndex > max.zIndex ? w : max, windows[0])
    : null;

  // Handle window button click
  const handleWindowButtonClick = (windowId: string) => {
    focusWindow(windowId);
  };

  return (
    <nav
      className="h-7 bg-win95-gray win95-outset flex items-center px-0.5 gap-0.5"
      style={{
        fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', sans-serif",
      }}
      role="navigation"
      aria-label="Taskbar"
    >
      {/* Start Button */}
      <button
        onClick={onStartClick}
        className={`
          px-1 py-0.5
          bg-win95-gray
          font-win95
          text-win95-black
          text-[11px]
          font-bold
          flex items-center gap-1
          ${startMenuOpen ? 'win95-pressed translate-x-[1px] translate-y-[1px]' : 'win95-outset'}
          hover:cursor-pointer
        `}
        aria-label="Start Menu"
        aria-expanded={startMenuOpen}
        aria-haspopup="menu"
      >
        <span className="text-base" aria-hidden="true">🪟</span>
        <span>Start</span>
      </button>

      {/* Window List Area */}
      <div 
        className="flex-1 flex items-center gap-0.5 overflow-x-auto"
        role="group"
        aria-label="Open windows"
      >
        {windows
          .filter(w => !w.isMinimized)
          .map(window => (
            <button
              key={window.id}
              onClick={() => handleWindowButtonClick(window.id)}
              className={`
                px-2 py-0.5
                bg-win95-gray
                font-win95
                text-win95-black
                text-[11px]
                flex items-center gap-1
                max-w-[150px]
                truncate
                ${window.id === focusedWindow?.id ? 'win95-pressed' : 'win95-outset'}
              `}
              title={window.title}
              aria-label={`${window.title} window`}
              aria-pressed={window.id === focusedWindow?.id}
            >
              <span aria-hidden="true">{window.icon}</span>
              <span className="truncate">{window.title}</span>
            </button>
          ))}
      </div>

      {/* System Tray - Clock */}
      <div
        className="win95-inset px-2 py-0.5 bg-win95-gray"
        role="status"
        aria-label="System clock"
      >
        <time 
          className="font-win95 text-[11px] text-win95-black"
          dateTime={currentTime.toISOString()}
        >
          {formatTime(currentTime)}
        </time>
      </div>
    </nav>
  );
};
