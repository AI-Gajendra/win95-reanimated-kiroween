/**
 * TypeScript declarations for Electron API exposed to renderer process.
 * 
 * This file provides type definitions for the electronAPI object
 * that is exposed via contextBridge in the preload script.
 * 
 * @requirements 6.1, 6.2
 */

/**
 * Type declarations for electron-reload module.
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
declare module 'electron-reload' {
  interface ElectronReloadOptions {
    /** Path to the electron executable */
    electron?: string;
    /** Method to use for hard reset: 'exit' or 'quit' */
    hardResetMethod?: 'exit' | 'quit';
    /** Force hard reset on every change */
    forceHardReset?: boolean;
  }
  
  function electronReload(paths: string | string[], options?: ElectronReloadOptions): void;
  export default electronReload;
}

/**
 * Type declarations for electron-devtools-installer module.
 * @requirements 9.1
 */
declare module 'electron-devtools-installer' {
  interface ExtensionOptions {
    loadExtensionOptions?: {
      allowFileAccess?: boolean;
    };
  }
  
  interface ExtensionReference {
    id: string;
    electron: string;
  }
  
  export const REACT_DEVELOPER_TOOLS: ExtensionReference;
  export const REDUX_DEVTOOLS: ExtensionReference;
  
  function installExtension(
    extensionReference: ExtensionReference | ExtensionReference[],
    options?: ExtensionOptions
  ): Promise<string>;
  
  export default installExtension;
}

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
  /**
   * Minimize the main window to the taskbar.
   * @requirements 4.1, 4.4
   */
  minimizeWindow: () => Promise<void>;
  
  /**
   * Toggle maximize/unmaximize state of the main window.
   * If maximized, will unmaximize. If not maximized, will maximize.
   * @requirements 4.2, 4.4
   */
  maximizeWindow: () => Promise<void>;
  
  /**
   * Close the application window.
   * @requirements 4.3, 4.4
   */
  closeWindow: () => Promise<void>;
  
  /**
   * Check if the window is currently maximized.
   * @returns Promise resolving to true if maximized, false otherwise
   * @requirements 4.4, 4.5
   */
  isMaximized: () => Promise<boolean>;
  
  /**
   * Current platform identifier.
   * - 'win32' for Windows
   * - 'darwin' for macOS
   * - 'linux' for Linux
   * @requirements 6.2
   */
  platform: NodeJS.Platform;
  
  /**
   * Register a callback for when the window is maximized.
   * @param callback Function to call when window is maximized
   * @returns Unsubscribe function to remove the listener
   */
  onWindowMaximized: (callback: () => void) => () => void;
  
  /**
   * Register a callback for when the window is unmaximized.
   * @param callback Function to call when window is unmaximized
   * @returns Unsubscribe function to remove the listener
   */
  onWindowUnmaximized: (callback: () => void) => () => void;
  
  /**
   * Get the current close-to-tray setting.
   * @returns Promise resolving to true if close-to-tray is enabled
   * @requirements 10.5
   */
  getCloseToTray: () => Promise<boolean>;
  
  /**
   * Set the close-to-tray setting.
   * @param enabled Whether to enable close-to-tray behavior
   * @requirements 10.5
   */
  setCloseToTray: (enabled: boolean) => Promise<void>;
  
  /**
   * Register a callback for a specific keyboard shortcut.
   * The main process will emit events when global shortcuts are pressed.
   * @param shortcut The shortcut name to listen for ('quit', 'fullscreen', 'reload')
   * @param callback Function to call when the shortcut is triggered
   * @returns Unsubscribe function to remove the listener
   * @requirements 8.5
   */
  onShortcut: (shortcut: string, callback: () => void) => () => void;
  
  /**
   * Register a callback for fullscreen state changes.
   * @param callback Function to call with the new fullscreen state
   * @returns Unsubscribe function to remove the listener
   * @requirements 8.3
   */
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;
  
  /**
   * Check for application updates.
   * @requirements 12.1
   */
  checkForUpdates: () => Promise<void>;
  
  /**
   * Download the available update.
   * @requirements 12.3
   */
  downloadUpdate: () => Promise<void>;
  
  /**
   * Install the downloaded update and restart the application.
   * @requirements 12.3, 12.5
   */
  installUpdate: () => Promise<void>;
  
  /**
   * Get the current update state.
   * @returns Promise resolving to the current update state
   */
  getUpdateState: () => Promise<UpdateState>;
  
  /**
   * Register a callback for update status changes.
   * @param callback Function to call with the update status event
   * @returns Unsubscribe function to remove the listener
   * @requirements 12.2
   */
  onUpdateStatus: (callback: (event: UpdateStatusEvent) => void) => () => void;
}

declare global {
  interface Window {
    /**
     * Electron API exposed via contextBridge.
     * Will be undefined when running in a browser (non-Electron environment).
     */
    electronAPI?: ElectronAPI;
  }
}

export {};
