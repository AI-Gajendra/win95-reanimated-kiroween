/**
 * Window Component
 * 
 * Renders an application window with Win95-style chrome including:
 * - Title bar with app name, icon, and control buttons
 * - Beveled borders and 3D styling
 * - Draggable functionality
 * - Focus management
 */

import React, { useRef, useState, useEffect } from 'react';
import { TitleBar } from '../../src/components/TitleBar';
import { WindowState } from './types';
import { useWindowManager } from './WindowContext';

interface WindowComponentProps {
  window: WindowState;
}

export const Window: React.FC<WindowComponentProps> = ({ window }) => {
  const {
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    windows
  } = useWindowManager();

  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Determine if this window is the focused one (highest z-index)
  const maxZIndex = Math.max(...windows.map(w => w.zIndex), 0);
  const isFocused = window.zIndex === maxZIndex;

  // Handle window click to focus
  const handleWindowClick = () => {
    // Only focus if not already focused
    if (!isFocused) {
      focusWindow(window.id);
    }
  };

  // Handle title bar mouse down for dragging
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking on control buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Don't drag if maximized
    if (window.isMaximized) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }

    // Focus window when starting drag
    if (!isFocused) {
      focusWindow(window.id);
    }
  };

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep window within bounds (use browser window dimensions)
      const maxX = globalThis.window.innerWidth - 100; // Keep at least 100px visible
      const maxY = globalThis.window.innerHeight - 100;
      const minX = -window.size.width + 100;
      const minY = 0; // Don't allow dragging above screen

      const boundedX = Math.max(minX, Math.min(maxX, newX));
      const boundedY = Math.max(minY, Math.min(maxY, newY));

      updateWindowPosition(window.id, { x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, window.id, window.size, updateWindowPosition]);

  // Handle control button clicks
  const handleClose = () => {
    closeWindow(window.id);
  };

  const handleMinimize = () => {
    minimizeWindow(window.id);
  };

  const handleMaximize = () => {
    maximizeWindow(window.id);
  };

  // Don't render if minimized
  if (window.isMinimized) {
    return null;
  }

  // Calculate window style
  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    left: window.isMaximized ? 0 : window.position.x,
    top: window.isMaximized ? 0 : window.position.y,
    width: window.isMaximized ? '100%' : window.size.width,
    height: window.isMaximized ? 'calc(100% - 32px)' : window.size.height, // Account for taskbar
    zIndex: window.zIndex,
    cursor: isDragging ? 'move' : 'default'
  };

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      className="flex flex-col bg-win95-gray win95-outset-thick shadow-lg"
      onClick={handleWindowClick}
    >
      {/* Title Bar */}
      <div onMouseDown={handleTitleBarMouseDown} className="cursor-move">
        <TitleBar
          title={window.title}
          icon={window.icon}
          active={isFocused}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClose={handleClose}
        />
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto bg-win95-gray">
        {window.content}
      </div>
    </div>
  );
};
