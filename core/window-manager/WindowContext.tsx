/**
 * Window Manager Context
 * 
 * Provides window state management and operations through React Context.
 * Single source of truth for all window state.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WindowState, WindowProps, AppDefinition } from './types';
import { getAppDefinition, getRegisteredApps as getAppsFromRegistry } from './appRegistry';

interface WindowManagerContextType {
  windows: WindowState[];
  openWindow: (appId: string, props?: WindowProps) => string;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (windowId: string, size: { width: number; height: number }) => void;
  updateWindowTitle: (windowId: string, title: string) => void;
  getWindow: (windowId: string) => WindowState | undefined;
  getRegisteredApps: () => AppDefinition[];
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

interface WindowManagerProviderProps {
  children: ReactNode;
}

export function WindowManagerProvider({ children }: WindowManagerProviderProps) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [windowCounter, setWindowCounter] = useState(0);

  const openWindow = useCallback((appId: string, props?: WindowProps): string => {
    const app = getAppDefinition(appId);
    
    if (!app) {
      console.error(`[Window Manager] App not found: ${appId}`);
      return '';
    }

    const windowId = `window-${appId}-${windowCounter}`;
    setWindowCounter(prev => prev + 1);

    // Calculate cascading position
    const offset = (windowCounter % 10) * 30;
    const position = app.defaultPosition || { x: 100 + offset, y: 100 + offset };

    const newWindow: WindowState = {
      id: windowId,
      appId,
      title: app.name,
      icon: app.icon,
      position,
      size: app.defaultSize,
      zIndex: nextZIndex,
      isMinimized: false,
      isMaximized: false,
      content: React.createElement(app.component, { windowId, ...props })
    };

    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);

    console.log(`[Window Manager] Opened window: ${app.name} (${windowId})`);
    return windowId;
  }, [windowCounter, nextZIndex]);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    console.log(`[Window Manager] Closed window: ${windowId}`);
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setWindows(prev => {
      const window = prev.find(w => w.id === windowId);
      if (!window) return prev;

      // If minimized, restore it
      if (window.isMinimized) {
        window.isMinimized = false;
      }

      // Bring to front
      const maxZ = Math.max(...prev.map(w => w.zIndex), 0);
      
      return prev.map(w => 
        w.id === windowId 
          ? { ...w, zIndex: maxZ + 1, isMinimized: false }
          : w
      );
    });

    setNextZIndex(prev => prev + 1);
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === windowId 
          ? { ...w, isMinimized: true }
          : w
      )
    );
    console.log(`[Window Manager] Minimized window: ${windowId}`);
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === windowId 
          ? { ...w, isMaximized: !w.isMaximized }
          : w
      )
    );
  }, []);

  const updateWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === windowId 
          ? { ...w, position }
          : w
      )
    );
  }, []);

  const updateWindowSize = useCallback((windowId: string, size: { width: number; height: number }) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === windowId 
          ? { ...w, size }
          : w
      )
    );
  }, []);

  const updateWindowTitle = useCallback((windowId: string, title: string) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === windowId 
          ? { ...w, title }
          : w
      )
    );
  }, []);

  const getWindow = useCallback((windowId: string): WindowState | undefined => {
    return windows.find(w => w.id === windowId);
  }, [windows]);

  const getRegisteredApps = useCallback((): AppDefinition[] => {
    return getAppsFromRegistry();
  }, []);

  const value: WindowManagerContextType = {
    windows,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    updateWindowTitle,
    getWindow,
    getRegisteredApps
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager(): WindowManagerContextType {
  const context = useContext(WindowManagerContext);
  
  if (!context) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  
  return context;
}
