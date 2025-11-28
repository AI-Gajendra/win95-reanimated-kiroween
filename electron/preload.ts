/**
 * Electron Preload Script
 * 
 * Provides secure IPC communication between main and renderer processes.
 * Uses contextBridge to create a secure API surface without exposing Node.js APIs.
 * 
 * SECURITY CONFIGURATION:
 * =======================
 * - contextIsolation: ENABLED - Renderer cannot access Node.js globals
 * - nodeIntegration: DISABLED - No direct Node.js API access in renderer
 * - sandbox: ENABLED - Additional process isolation for security
 * - webSecurity: ENABLED - Same-origin policy enforced
 * 
 * SECURITY MEASURES:
 * ==================
 * 1. All IPC methods use invoke pattern (request-response) for type safety
 * 2. Only specific, whitelisted methods are exposed to renderer
 * 3. No direct access to ipcRenderer, fs, path, or other Node.js modules
 * 4. All exposed methods are documented and type-safe
 * 5. Event listeners return cleanup functions to prevent memory leaks
 * 
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Update state interface for auto-updater.
 * @requirements 12.1, 12.2, 12.3
 */
export interface UpdateState {
  available: boolean;
  downloaded: boolean;
  info: {
    version: string;
    releaseNotes?: string;
  } | null;
}

/**
 * Update status event data.
 */
export interface UpdateStatusEvent {
  status: 'checking-for-update' | 'update-available' | 'update-not-available' | 'download-progress' | 'update-downloaded' | 'error';
  data?: unknown;
}

/**
 * ElectronAPI interface defines the secure API surface exposed to the renderer.
 * All methods use IPC invoke pattern for request-response communication.
 */
export interface ElectronAPI {
  // Window control methods
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  
  // Platform information
  platform: NodeJS.Platform;
  
  // Event listeners for window state changes
  onWindowMaximized: (callback: () => void) => () => void;
  onWindowUnmaximized: (callback: () => void) => () => void;
  
  // Settings methods for close-to-tray behavior
  getCloseToTray: () => Promise<boolean>;
  setCloseToTray: (enabled: boolean) => Promise<void>;
  
  // Keyboard shortcut event listeners
  // @requirements 8.5
  onShortcut: (shortcut: string, callback: () => void) => () => void;
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;
  
  // Auto-updater methods
  // @requirements 12.1, 12.2, 12.3, 12.5
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  getUpdateState: () => Promise<UpdateState>;
  onUpdateStatus: (callback: (event: UpdateStatusEvent) => void) => () => void;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Minimize the main window to the taskbar.
   * @requirements 4.1, 4.4
   */
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  
  /**
   * Toggle maximize/unmaximize state of the main window.
   * @requirements 4.2, 4.4
   */
  maximizeWindow: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
  
  /**
   * Close the application window.
   * @requirements 4.3, 4.4
   */
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  
  /**
   * Check if the window is currently maximized.
   * @requirements 4.4, 4.5
   */
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  
  /**
   * Current platform identifier (win32, darwin, linux).
   * @requirements 6.2
   */
  platform: process.platform,
  
  /**
   * Register a callback for when the window is maximized.
   * Returns an unsubscribe function.
   */
  onWindowMaximized: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('window:maximized', handler);
    return () => ipcRenderer.removeListener('window:maximized', handler);
  },
  
  /**
   * Register a callback for when the window is unmaximized.
   * Returns an unsubscribe function.
   */
  onWindowUnmaximized: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('window:unmaximized', handler);
    return () => ipcRenderer.removeListener('window:unmaximized', handler);
  },
  
  /**
   * Get the current close-to-tray setting.
   * @requirements 10.5
   */
  getCloseToTray: (): Promise<boolean> => ipcRenderer.invoke('settings:getCloseToTray'),
  
  /**
   * Set the close-to-tray setting.
   * @requirements 10.5
   */
  setCloseToTray: (enabled: boolean): Promise<void> => ipcRenderer.invoke('settings:setCloseToTray', enabled),
  
  /**
   * Register a callback for a specific keyboard shortcut.
   * The main process will emit 'shortcut:triggered' events when global shortcuts are pressed.
   * Returns an unsubscribe function.
   * @requirements 8.5
   */
  onShortcut: (shortcut: string, callback: () => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, triggeredShortcut: string) => {
      if (triggeredShortcut === shortcut) {
        callback();
      }
    };
    ipcRenderer.on('shortcut:triggered', handler);
    return () => ipcRenderer.removeListener('shortcut:triggered', handler);
  },
  
  /**
   * Register a callback for fullscreen state changes.
   * Returns an unsubscribe function.
   * @requirements 8.3
   */
  onFullscreenChange: (callback: (isFullscreen: boolean) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isFullscreen: boolean) => {
      callback(isFullscreen);
    };
    ipcRenderer.on('window:fullscreenChange', handler);
    return () => ipcRenderer.removeListener('window:fullscreenChange', handler);
  },
  
  /**
   * Check for application updates.
   * @requirements 12.1
   */
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('update:check'),
  
  /**
   * Download the available update.
   * @requirements 12.3
   */
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke('update:download'),
  
  /**
   * Install the downloaded update and restart the application.
   * @requirements 12.3, 12.5
   */
  installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),
  
  /**
   * Get the current update state.
   * @returns Promise resolving to the current update state
   */
  getUpdateState: (): Promise<UpdateState> => ipcRenderer.invoke('update:getState'),
  
  /**
   * Register a callback for update status changes.
   * Returns an unsubscribe function.
   * @requirements 12.2
   */
  onUpdateStatus: (callback: (event: UpdateStatusEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, statusEvent: UpdateStatusEvent) => {
      callback(statusEvent);
    };
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  }
} satisfies ElectronAPI);

// Global type declarations for TypeScript
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
