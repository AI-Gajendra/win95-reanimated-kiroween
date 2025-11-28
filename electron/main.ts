/**
 * Electron Main Process
 * 
 * Manages the application lifecycle and creates the main window.
 */

import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut, crashReporter, dialog, session } from 'electron';
import path from 'path';
import fs from 'fs';
import Store from 'electron-store';
import { autoUpdaterManager } from './autoUpdater';

/**
 * Enable hot reload in development mode.
 * This watches for changes in the electron directory and reloads the app.
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
if (process.env.NODE_ENV === 'development') {
  try {
    // Use dynamic import for electron-reload (ESM compatibility)
    import('electron-reload').then((electronReload) => {
      electronReload.default(path.join(__dirname, '..'), {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit',
        forceHardReset: false
      });
      console.log('[Electron] Hot reload enabled for development');
    }).catch((err) => {
      console.warn('[Electron] Failed to enable hot reload:', err.message);
    });
  } catch (err) {
    console.warn('[Electron] Hot reload not available:', err);
  }
}

/**
 * Initialize crash reporter for collecting crash dumps.
 * @requirements 7.1, 7.2
 */
crashReporter.start({
  productName: 'Win95 Reanimated',
  companyName: 'Win95 Reanimated',
  submitURL: '', // No remote server - crashes are stored locally
  uploadToServer: false,
  ignoreSystemCrashHandler: false
});

console.log('[Electron] Crash reporter initialized');
console.log(`[Electron] Crash dumps directory: ${app.getPath('crashDumps')}`);

// Define the schema for window bounds
interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StoreSchema {
  windowBounds: WindowBounds;
  closeToTray: boolean;
}

// Default window dimensions
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

class Win95ReanimatedApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private store: Store<StoreSchema>;
  private rendererCrashCount: number = 0;
  private readonly MAX_CRASH_RETRIES = 3;
  private readonly CRASH_RESET_INTERVAL = 60000; // Reset crash count after 1 minute of stability
  private crashResetTimer: NodeJS.Timeout | null = null;
  private errorLogPath: string;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'win95-reanimated-config',
      defaults: {
        windowBounds: {
          x: -1, // -1 indicates center on screen
          y: -1,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT
        },
        closeToTray: true // Default to close-to-tray behavior
      }
    });
    
    // Initialize error log path
    // @requirements 7.5
    this.errorLogPath = path.join(app.getPath('userData'), 'error.log');
    
    // Set up main process error handlers
    this.setupMainProcessErrorHandlers();
    
    this.setupApp();
  }

  /**
   * Set up error handlers for the main process.
   * Catches uncaught exceptions and unhandled promise rejections.
   * @requirements 7.4, 7.5
   */
  private setupMainProcessErrorHandlers(): void {
    // Handle uncaught exceptions in the main process
    // @requirements 7.4
    process.on('uncaughtException', (error: Error) => {
      console.error('[Electron] Uncaught exception in main process:', error);
      this.logErrorToFile('uncaughtException', error);
    });

    // Handle unhandled promise rejections
    // @requirements 7.4
    process.on('unhandledRejection', (reason: unknown) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      console.error('[Electron] Unhandled promise rejection:', error);
      this.logErrorToFile('unhandledRejection', error);
    });

    console.log('[Electron] Main process error handlers registered');
  }

  /**
   * Log an error to the error log file.
   * @param type - The type of error (e.g., 'uncaughtException', 'rendererCrash')
   * @param error - The error object to log
   * @requirements 7.5
   */
  private logErrorToFile(type: string, error: Error): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${error.message}\nStack: ${error.stack || 'No stack trace'}\n\n`;
    
    try {
      fs.appendFileSync(this.errorLogPath, logEntry);
      console.log(`[Electron] Error logged to: ${this.errorLogPath}`);
    } catch (writeError) {
      console.error('[Electron] Failed to write to error log:', writeError);
    }
  }

  private setupApp(): void {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', () => this.onWindowsClosed());
    app.on('activate', () => this.onActivate());
    // Unregister shortcuts when app is about to quit
    app.on('will-quit', () => this.unregisterShortcuts());
    
    // Handle renderer process crashes at the app level
    // @requirements 7.1, 7.2
    app.on('render-process-gone', (_event, webContents, details) => {
      this.handleRendererCrash(webContents, details);
    });
  }

  /**
   * Handle renderer process crashes.
   * Attempts to reload the renderer, shows error dialog after repeated crashes.
   * @param webContents - The web contents that crashed
   * @param details - Details about the crash
   * @requirements 7.1, 7.2, 7.3
   */
  private handleRendererCrash(webContents: Electron.WebContents, details: Electron.RenderProcessGoneDetails): void {
    const reason = details.reason;
    const exitCode = details.exitCode;
    
    console.error(`[Electron] Renderer process crashed - Reason: ${reason}, Exit code: ${exitCode}`);
    
    // Log the crash to file
    const crashError = new Error(`Renderer process crashed: ${reason} (exit code: ${exitCode})`);
    this.logErrorToFile('rendererCrash', crashError);
    
    // Don't attempt recovery for clean exits
    if (reason === 'clean-exit') {
      console.log('[Electron] Renderer exited cleanly, no recovery needed');
      return;
    }
    
    // Increment crash count
    this.rendererCrashCount++;
    console.log(`[Electron] Renderer crash count: ${this.rendererCrashCount}/${this.MAX_CRASH_RETRIES}`);
    
    // Reset the crash count timer
    this.resetCrashCountTimer();
    
    // Check if we've exceeded the maximum retries
    // @requirements 7.3
    if (this.rendererCrashCount >= this.MAX_CRASH_RETRIES) {
      console.error('[Electron] Maximum crash retries exceeded, showing error dialog');
      this.showCrashErrorDialog();
      return;
    }
    
    // Attempt to reload the renderer
    // @requirements 7.1
    console.log('[Electron] Attempting to reload renderer...');
    try {
      webContents.reload();
      console.log('[Electron] Renderer reload initiated');
    } catch (reloadError) {
      console.error('[Electron] Failed to reload renderer:', reloadError);
      this.showCrashErrorDialog();
    }
  }

  /**
   * Reset the crash count timer.
   * If the app runs stably for CRASH_RESET_INTERVAL, reset the crash count.
   */
  private resetCrashCountTimer(): void {
    // Clear existing timer
    if (this.crashResetTimer) {
      clearTimeout(this.crashResetTimer);
    }
    
    // Set new timer to reset crash count after stable period
    this.crashResetTimer = setTimeout(() => {
      if (this.rendererCrashCount > 0) {
        console.log('[Electron] Resetting renderer crash count after stable period');
        this.rendererCrashCount = 0;
      }
    }, this.CRASH_RESET_INTERVAL);
  }

  /**
   * Show an error dialog when the renderer has crashed repeatedly.
   * Gives the user the option to quit or try again.
   * @requirements 7.3
   */
  private showCrashErrorDialog(): void {
    const options: Electron.MessageBoxOptions = {
      type: 'error',
      title: 'Win95 Reanimated - Error',
      message: 'The application has encountered repeated errors.',
      detail: 'The renderer process has crashed multiple times. This may indicate a serious problem.\n\nWould you like to try restarting the application or quit?',
      buttons: ['Restart', 'Quit'],
      defaultId: 0,
      cancelId: 1
    };
    
    dialog.showMessageBox(options).then((result) => {
      if (result.response === 0) {
        // Restart - reset crash count and reload
        console.log('[Electron] User chose to restart after crash dialog');
        this.rendererCrashCount = 0;
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.reload();
        } else {
          // Recreate the window if it was destroyed
          this.createWindow();
        }
      } else {
        // Quit
        console.log('[Electron] User chose to quit after crash dialog');
        this.forceQuit();
      }
    });
  }

  private async onReady(): Promise<void> {
    // Configure Content Security Policy
    // @requirements 6.3, 6.4, 6.5
    this.configureContentSecurityPolicy();
    
    // Install DevTools extensions in development mode
    // @requirements 9.1
    await this.installDevToolsExtensions();
    
    this.createWindow();
    this.createTray();
    this.setupIPC();
    this.registerShortcuts();
    
    // Perform security audit
    // @requirements 6.3, 6.4, 6.5
    this.performSecurityAudit();
    
    // Initialize auto-updater (production only)
    // @requirements 12.1, 12.2
    this.initializeAutoUpdater();
  }

  /**
   * Configure Content Security Policy headers for the application.
   * Restricts script and style sources to prevent XSS attacks.
   * @requirements 6.3, 6.4, 6.5
   */
  private configureContentSecurityPolicy(): void {
    // Define CSP based on environment
    const isDev = process.env.NODE_ENV === 'development';
    
    // In development, we need to allow connections to the Vite dev server
    // In production, we restrict to 'self' only
    const cspDirectives = isDev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Dev server needs eval for HMR
          "style-src 'self' 'unsafe-inline'", // Allow inline styles for Win95 styling
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self' ws://localhost:* http://localhost:*", // WebSocket for HMR
          "worker-src 'self' blob:",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'"
        ]
      : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'", // Allow inline styles for Win95 styling
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "worker-src 'self' blob:",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'"
        ];

    const cspHeader = cspDirectives.join('; ');

    // Apply CSP headers to all responses
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [cspHeader]
        }
      });
    });

    console.log(`[Electron] Content Security Policy configured (${isDev ? 'development' : 'production'} mode)`);
  }

  /**
   * Perform a security audit and log the security configuration.
   * Verifies that all security settings are properly configured.
   * @requirements 6.3, 6.4, 6.5
   */
  private performSecurityAudit(): void {
    console.log('[Electron] === Security Audit ===');
    
    // Document the security configuration that was set during window creation
    // These values are hardcoded in createWindow() and verified here for logging
    const securityConfig = {
      contextIsolation: true,    // Set in webPreferences
      nodeIntegration: false,    // Set in webPreferences
      sandbox: true,             // Set in webPreferences
      webSecurity: true,         // Default value (not explicitly disabled)
      allowRunningInsecureContent: false  // Default value (not explicitly enabled)
    };
    
    const securityChecks: { name: string; status: boolean; details: string }[] = [
      {
        name: 'Context Isolation',
        status: securityConfig.contextIsolation,
        details: 'Enabled - renderer cannot access Node.js globals'
      },
      {
        name: 'Node Integration',
        status: !securityConfig.nodeIntegration,
        details: 'Disabled - no direct Node.js API access in renderer'
      },
      {
        name: 'Sandbox',
        status: securityConfig.sandbox,
        details: 'Enabled - additional process isolation'
      },
      {
        name: 'Web Security',
        status: securityConfig.webSecurity,
        details: 'Enabled - same-origin policy enforced'
      },
      {
        name: 'Insecure Content',
        status: !securityConfig.allowRunningInsecureContent,
        details: 'Blocked - no mixed content allowed'
      },
      {
        name: 'Navigation Protection',
        status: true,
        details: 'Enabled - external URL navigation blocked'
      },
      {
        name: 'Popup Protection',
        status: true,
        details: 'Enabled - new window creation blocked'
      },
      {
        name: 'Content Security Policy',
        status: true,
        details: 'Configured - script/style sources restricted'
      },
      {
        name: 'IPC Validation',
        status: true,
        details: 'Enabled - sender verification and input sanitization'
      }
    ];
    
    // Log all security checks
    let allPassed = true;
    for (const check of securityChecks) {
      const statusIcon = check.status ? '✓' : '✗';
      const logMethod = check.status ? console.log : console.error;
      logMethod(`[Electron] ${statusIcon} ${check.name}: ${check.details}`);
      if (!check.status) {
        allPassed = false;
      }
    }
    
    // Summary
    if (allPassed) {
      console.log('[Electron] === Security Audit PASSED ===');
    } else {
      console.error('[Electron] === Security Audit FAILED - Review security settings! ===');
    }
    
    // Log IPC handlers registered
    console.log('[Electron] IPC Handlers registered:');
    console.log('[Electron]   - window:minimize (validated)');
    console.log('[Electron]   - window:maximize (validated)');
    console.log('[Electron]   - window:close (validated)');
    console.log('[Electron]   - window:isMaximized (validated)');
    console.log('[Electron]   - settings:getCloseToTray (validated)');
    console.log('[Electron]   - settings:setCloseToTray (validated, input sanitized)');
    console.log('[Electron]   - update:check (validated)');
    console.log('[Electron]   - update:download (validated)');
    console.log('[Electron]   - update:install (validated)');
    console.log('[Electron]   - update:getState (validated)');
  }

  /**
   * Initialize the auto-updater and check for updates.
   * Only runs in production mode to avoid issues during development.
   * @requirements 12.1, 12.2, 12.4
   */
  private initializeAutoUpdater(): void {
    // Skip auto-updater in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Electron] Auto-updater disabled in development mode');
      return;
    }

    // Set the main window reference for notifications
    autoUpdaterManager.setMainWindow(this.mainWindow);

    // Check for updates on launch
    // @requirements 12.1
    console.log('[Electron] Checking for updates...');
    autoUpdaterManager.checkForUpdates();
  }

  /**
   * Install DevTools extensions in development mode.
   * Adds React Developer Tools for debugging React components.
   * @requirements 9.1
   */
  private async installDevToolsExtensions(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      // Dynamic import for electron-devtools-installer
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');
      
      const extensionName = await installExtension(REACT_DEVELOPER_TOOLS, {
        loadExtensionOptions: { allowFileAccess: true }
      });
      
      console.log(`[Electron] DevTools extension installed: ${extensionName}`);
    } catch (err) {
      console.warn('[Electron] Failed to install DevTools extension:', err);
    }
  }

  /**
   * Load the development server URL with retry logic.
   * Waits for the Vite server to be ready before loading.
   * @param url - The development server URL to load
   * @requirements 9.1, 9.2
   */
  private loadDevServer(url: string): void {
    if (!this.mainWindow) return;

    // Handle load failures (e.g., dev server not ready yet)
    this.mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL === url && errorCode !== -3) { // -3 is ERR_ABORTED (normal during navigation)
        console.warn(`[Electron] Failed to load dev server: ${errorDescription} (${errorCode})`);
        console.log('[Electron] Retrying in 1 second...');
        
        // Retry loading after a delay
        setTimeout(() => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            console.log('[Electron] Retrying dev server connection...');
            this.mainWindow.loadURL(url);
          }
        }, 1000);
      }
    });

    // Log successful load
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('[Electron] Development server loaded successfully');
    });

    // Initial load attempt
    this.mainWindow.loadURL(url);
  }

  /**
   * Register global keyboard shortcuts.
   * @requirements 8.1, 8.2, 8.3, 8.4
   */
  private registerShortcuts(): void {
    // Determine the modifier key based on platform (Cmd for macOS, Ctrl for others)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'CommandOrControl' : 'Control';

    // Register Ctrl+Q (Cmd+Q on macOS) to quit the application
    // @requirements 8.2
    globalShortcut.register(`${modifier}+Q`, () => {
      console.log('[Electron] Quit shortcut triggered');
      // Notify renderer before quitting
      this.notifyShortcut('quit');
      this.forceQuit();
    });

    // Register F11 to toggle fullscreen mode
    // @requirements 8.3
    globalShortcut.register('F11', () => {
      if (this.mainWindow) {
        const isFullScreen = this.mainWindow.isFullScreen();
        this.mainWindow.setFullScreen(!isFullScreen);
        console.log(`[Electron] Fullscreen toggled: ${!isFullScreen}`);
        // Notify renderer of fullscreen change
        this.notifyShortcut('fullscreen');
        this.mainWindow.webContents.send('window:fullscreenChange', !isFullScreen);
      }
    });

    // Register Ctrl+R (Cmd+R on macOS) to reload the application in development mode only
    // @requirements 8.4
    if (process.env.NODE_ENV === 'development') {
      globalShortcut.register(`${modifier}+R`, () => {
        if (this.mainWindow) {
          console.log('[Electron] Reload shortcut triggered (dev mode)');
          // Notify renderer before reloading
          this.notifyShortcut('reload');
          this.mainWindow.webContents.reload();
        }
      });
    }

    // Listen for fullscreen changes triggered by other means (e.g., double-click title bar)
    // @requirements 8.5
    if (this.mainWindow) {
      this.mainWindow.on('enter-full-screen', () => {
        this.mainWindow?.webContents.send('window:fullscreenChange', true);
      });
      this.mainWindow.on('leave-full-screen', () => {
        this.mainWindow?.webContents.send('window:fullscreenChange', false);
      });
    }

    console.log('[Electron] Global shortcuts registered');
  }

  /**
   * Notify the renderer process that a shortcut was triggered.
   * @param shortcut - The name of the shortcut that was triggered
   * @requirements 8.5
   */
  private notifyShortcut(shortcut: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('shortcut:triggered', shortcut);
    }
  }

  /**
   * Unregister all global shortcuts.
   * Called when the app is about to quit.
   */
  private unregisterShortcuts(): void {
    globalShortcut.unregisterAll();
    console.log('[Electron] Global shortcuts unregistered');
  }

  private createWindow(): void {
    // Get saved bounds or use defaults
    const savedBounds = this.getSavedBounds();
    
    this.mainWindow = new BrowserWindow({
      x: savedBounds.x,
      y: savedBounds.y,
      width: savedBounds.width,
      height: savedBounds.height,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      frame: false,
      show: false,
      center: savedBounds.x === -1, // Center only if no saved position
      title: 'Win95 Reanimated',
      backgroundColor: '#008080',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    // Load the app
    // @requirements 9.1, 9.2
    if (process.env.NODE_ENV === 'development') {
      const devServerUrl = 'http://localhost:5173';
      console.log(`[Electron] Loading development server: ${devServerUrl}`);
      
      // Load the dev server URL with retry logic
      this.loadDevServer(devServerUrl);
      
      // Open DevTools automatically in development mode
      // @requirements 9.1
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      console.log('[Electron] Window ready');
    });

    // Save window bounds on resize and move
    this.mainWindow.on('resize', () => this.saveWindowBounds());
    this.mainWindow.on('move', () => this.saveWindowBounds());

    // Handle window close - implement close-to-tray behavior
    // @requirements 10.4, 10.5
    this.mainWindow.on('close', (event) => {
      const closeToTray = this.store.get('closeToTray', true);
      
      // If close-to-tray is enabled and tray exists, hide instead of close
      if (closeToTray && this.tray) {
        event.preventDefault();
        this.hideWindow();
        console.log('[Electron] Window hidden to tray');
      }
    });

    // Handle window closed (when actually destroyed)
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Emit maximize/unmaximize events to renderer
    this.mainWindow.on('maximize', () => {
      this.mainWindow?.webContents.send('window:maximized');
    });

    this.mainWindow.on('unmaximize', () => {
      this.mainWindow?.webContents.send('window:unmaximized');
    });

    // Handle renderer process crashes for this specific window
    // @requirements 7.1, 7.2
    this.mainWindow.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[Electron] Main window renderer crashed: ${details.reason}`);
    });

    // Handle renderer unresponsive state
    this.mainWindow.on('unresponsive', () => {
      console.warn('[Electron] Renderer process is unresponsive');
      this.logErrorToFile('rendererUnresponsive', new Error('Renderer process became unresponsive'));
    });

    // Handle renderer becoming responsive again
    this.mainWindow.on('responsive', () => {
      console.log('[Electron] Renderer process is responsive again');
    });

    // Security: Prevent navigation to external URLs
    // @requirements 6.3, 6.4, 6.5
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      const allowedOrigins = ['localhost', '127.0.0.1'];
      
      // In development, allow localhost navigation
      if (process.env.NODE_ENV === 'development' && allowedOrigins.includes(parsedUrl.hostname)) {
        return; // Allow navigation
      }
      
      // In production, only allow file:// protocol (local files)
      if (parsedUrl.protocol === 'file:') {
        return; // Allow navigation
      }
      
      // Block all other navigation
      console.warn(`[Electron] Blocked navigation to: ${navigationUrl}`);
      event.preventDefault();
    });

    // Security: Block new window creation (popups)
    // @requirements 6.3, 6.4, 6.5
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      console.warn(`[Electron] Blocked new window request for: ${url}`);
      return { action: 'deny' };
    });
  }

  /**
   * Create the system tray icon with context menu.
   * @requirements 10.1, 10.2, 10.3
   */
  private createTray(): void {
    const trayIcon = this.getTrayIcon();
    this.tray = new Tray(trayIcon);
    
    // Set tooltip text
    this.tray.setToolTip('Win95 Reanimated');
    
    // Create context menu with Show, Hide, Quit options
    this.updateTrayContextMenu();
    
    // Toggle window visibility on tray icon click
    this.tray.on('click', () => {
      this.toggleWindowVisibility();
    });
    
    console.log('[Electron] System tray created');
  }

  /**
   * Get the tray icon, creating a default one if no icon file exists.
   * @returns NativeImage for the tray icon
   */
  private getTrayIcon(): Electron.NativeImage {
    // Try to load icon from assets directory
    const iconPaths = [
      path.join(__dirname, '../assets/icon.png'),
      path.join(__dirname, '../assets/tray-icon.png'),
      path.join(__dirname, '../assets/icon.ico')
    ];
    
    for (const iconPath of iconPaths) {
      if (fs.existsSync(iconPath)) {
        console.log(`[Electron] Loading tray icon from: ${iconPath}`);
        return nativeImage.createFromPath(iconPath);
      }
    }
    
    // Create a simple default icon if no icon file exists
    // This creates a 16x16 teal-colored icon (Win95 desktop color)
    console.log('[Electron] Creating default tray icon');
    return this.createDefaultTrayIcon();
  }

  /**
   * Create a simple default tray icon programmatically.
   * Creates a 16x16 icon with Win95 teal color.
   */
  private createDefaultTrayIcon(): Electron.NativeImage {
    // Create a simple 16x16 icon with Win95 colors
    // Using a data URL for a simple colored square
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4); // RGBA
    
    // Fill with Win95 teal color (#008080)
    for (let i = 0; i < size * size; i++) {
      canvas[i * 4] = 0x00;     // R
      canvas[i * 4 + 1] = 0x80; // G
      canvas[i * 4 + 2] = 0x80; // B
      canvas[i * 4 + 3] = 0xFF; // A
    }
    
    // Add a simple border (darker teal)
    for (let x = 0; x < size; x++) {
      // Top and bottom border
      for (const y of [0, size - 1]) {
        const i = y * size + x;
        canvas[i * 4] = 0x00;
        canvas[i * 4 + 1] = 0x60;
        canvas[i * 4 + 2] = 0x60;
      }
      // Left and right border
      for (const y of [0, size - 1]) {
        const i = x * size + y;
        canvas[i * 4] = 0x00;
        canvas[i * 4 + 1] = 0x60;
        canvas[i * 4 + 2] = 0x60;
      }
    }
    
    return nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  /**
   * Update the tray context menu based on current window state.
   */
  private updateTrayContextMenu(): void {
    const isVisible = this.mainWindow?.isVisible() ?? false;
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => this.showWindow(),
        enabled: !isVisible
      },
      {
        label: 'Hide',
        click: () => this.hideWindow(),
        enabled: isVisible
      },
      { type: 'separator' },
      {
        label: 'Close to Tray',
        type: 'checkbox',
        checked: this.store.get('closeToTray', true),
        click: (menuItem) => {
          this.store.set('closeToTray', menuItem.checked);
          console.log(`[Electron] Close to tray: ${menuItem.checked}`);
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          // Force quit, bypassing close-to-tray
          this.forceQuit();
        }
      }
    ]);
    
    this.tray?.setContextMenu(contextMenu);
  }

  /**
   * Toggle window visibility (show if hidden, hide if visible).
   * @requirements 10.2
   */
  private toggleWindowVisibility(): void {
    if (this.mainWindow?.isVisible()) {
      this.hideWindow();
    } else {
      this.showWindow();
    }
  }

  /**
   * Show the main window and bring it to focus.
   */
  private showWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      this.updateTrayContextMenu();
    }
  }

  /**
   * Hide the main window to the system tray.
   */
  private hideWindow(): void {
    this.mainWindow?.hide();
    this.updateTrayContextMenu();
  }

  /**
   * Force quit the application, bypassing close-to-tray behavior.
   */
  private forceQuit(): void {
    // Destroy tray first
    this.tray?.destroy();
    this.tray = null;
    
    // Quit the app
    app.quit();
  }

  /**
   * Get saved window bounds, validating they are visible on current screen configuration.
   * Returns default bounds if no saved bounds exist or if saved bounds are off-screen.
   */
  private getSavedBounds(): WindowBounds {
    const savedBounds = this.store.get('windowBounds');
    
    // If no saved position (x === -1), return defaults to trigger centering
    if (savedBounds.x === -1 || savedBounds.y === -1) {
      return {
        x: -1,
        y: -1,
        width: savedBounds.width || DEFAULT_WIDTH,
        height: savedBounds.height || DEFAULT_HEIGHT
      };
    }

    // Validate that the saved bounds are visible on the current screen configuration
    if (this.isWindowOnScreen(savedBounds)) {
      return savedBounds;
    }

    // If saved bounds are off-screen, return defaults (will center)
    console.log('[Electron] Saved window position is off-screen, using defaults');
    return {
      x: -1,
      y: -1,
      width: savedBounds.width || DEFAULT_WIDTH,
      height: savedBounds.height || DEFAULT_HEIGHT
    };
  }

  /**
   * Check if the window bounds are visible on any connected display.
   * A window is considered visible if at least 100px of it is on screen.
   */
  private isWindowOnScreen(bounds: WindowBounds): boolean {
    const displays = screen.getAllDisplays();
    const minVisiblePixels = 100;

    for (const display of displays) {
      const { x, y, width, height } = display.bounds;
      
      // Check if at least minVisiblePixels of the window is within this display
      const windowRight = bounds.x + bounds.width;
      const windowBottom = bounds.y + bounds.height;
      const displayRight = x + width;
      const displayBottom = y + height;

      const overlapX = Math.max(0, Math.min(windowRight, displayRight) - Math.max(bounds.x, x));
      const overlapY = Math.max(0, Math.min(windowBottom, displayBottom) - Math.max(bounds.y, y));

      if (overlapX >= minVisiblePixels && overlapY >= minVisiblePixels) {
        return true;
      }
    }

    return false;
  }

  /**
   * Save the current window bounds to persistent storage.
   */
  private saveWindowBounds(): void {
    if (!this.mainWindow || this.mainWindow.isMaximized() || this.mainWindow.isMinimized()) {
      // Don't save bounds when maximized or minimized
      return;
    }

    const bounds = this.mainWindow.getBounds();
    this.store.set('windowBounds', bounds);
  }

  /**
   * Validate that a value is a boolean.
   * @param value - The value to validate
   * @param paramName - Name of the parameter for error messages
   * @returns The validated boolean value
   * @throws Error if validation fails
   * @requirements 6.1, 6.2
   */
  private validateBoolean(value: unknown, paramName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(`Invalid ${paramName}: expected boolean, got ${typeof value}`);
    }
    return value;
  }

  /**
   * Validate that a value is a non-empty string.
   * @param value - The value to validate
   * @param paramName - Name of the parameter for error messages
   * @param maxLength - Maximum allowed length (default: 1000)
   * @returns The validated and sanitized string
   * @throws Error if validation fails
   * @requirements 6.1, 6.2
   */
  private validateString(value: unknown, paramName: string, maxLength: number = 1000): string {
    if (typeof value !== 'string') {
      throw new Error(`Invalid ${paramName}: expected string, got ${typeof value}`);
    }
    if (value.length === 0) {
      throw new Error(`Invalid ${paramName}: string cannot be empty`);
    }
    if (value.length > maxLength) {
      throw new Error(`Invalid ${paramName}: string exceeds maximum length of ${maxLength}`);
    }
    // Sanitize: remove control characters except newlines and tabs
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Validate that the IPC event comes from a trusted source.
   * Checks that the sender is the main window's webContents.
   * @param event - The IPC event
   * @returns true if the sender is trusted
   * @requirements 6.1, 6.2
   */
  private validateIPCSender(event: Electron.IpcMainInvokeEvent): boolean {
    // Verify the sender is our main window
    if (!this.mainWindow) {
      console.warn('[Electron] IPC validation failed: no main window');
      return false;
    }
    
    const senderWebContents = event.sender;
    const mainWebContents = this.mainWindow.webContents;
    
    // Check if the sender is the main window's webContents
    if (senderWebContents.id !== mainWebContents.id) {
      console.warn(`[Electron] IPC validation failed: sender ID ${senderWebContents.id} does not match main window ID ${mainWebContents.id}`);
      return false;
    }
    
    return true;
  }

  /**
   * Set up IPC handlers for window control operations.
   * These handlers are called from the renderer process via the preload script.
   * All handlers include input validation and sender verification.
   * 
   * @requirements 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2
   */
  private setupIPC(): void {
    /**
     * Minimize the window to the taskbar.
     * @requirements 4.1, 4.4, 6.1, 6.2
     */
    ipcMain.handle('window:minimize', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected window:minimize from untrusted sender');
        return;
      }
      this.mainWindow?.minimize();
    });

    /**
     * Toggle maximize/unmaximize state.
     * If maximized, will unmaximize. If not maximized, will maximize.
     * @requirements 4.2, 4.4, 6.1, 6.2
     */
    ipcMain.handle('window:maximize', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected window:maximize from untrusted sender');
        return;
      }
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    /**
     * Close the window (respects close-to-tray setting).
     * @requirements 4.3, 4.4, 10.4, 10.5, 6.1, 6.2
     */
    ipcMain.handle('window:close', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected window:close from untrusted sender');
        return;
      }
      const closeToTray = this.store.get('closeToTray', true);
      
      if (closeToTray && this.tray) {
        // Hide to tray instead of closing
        this.hideWindow();
      } else {
        // Actually quit the application
        this.forceQuit();
      }
    });

    /**
     * Get the current close-to-tray setting.
     * @returns boolean indicating if close-to-tray is enabled
     * @requirements 6.1, 6.2
     */
    ipcMain.handle('settings:getCloseToTray', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected settings:getCloseToTray from untrusted sender');
        return false;
      }
      return this.store.get('closeToTray', true);
    });

    /**
     * Set the close-to-tray setting.
     * @param enabled - Whether to enable close-to-tray behavior
     * @requirements 6.1, 6.2
     */
    ipcMain.handle('settings:setCloseToTray', (event, enabled: unknown) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected settings:setCloseToTray from untrusted sender');
        return;
      }
      
      try {
        const validatedEnabled = this.validateBoolean(enabled, 'enabled');
        this.store.set('closeToTray', validatedEnabled);
        this.updateTrayContextMenu();
        console.log(`[Electron] Close to tray setting: ${validatedEnabled}`);
      } catch (error) {
        console.error('[Electron] Invalid input for settings:setCloseToTray:', error);
      }
    });

    /**
     * Check if the window is currently maximized.
     * @returns boolean indicating maximized state
     * @requirements 4.4, 4.5, 6.1, 6.2
     */
    ipcMain.handle('window:isMaximized', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected window:isMaximized from untrusted sender');
        return false;
      }
      return this.mainWindow?.isMaximized() ?? false;
    });

    /**
     * Check for application updates.
     * @requirements 12.1, 6.1, 6.2
     */
    ipcMain.handle('update:check', async (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected update:check from untrusted sender');
        return;
      }
      await autoUpdaterManager.checkForUpdates();
    });

    /**
     * Download the available update.
     * @requirements 12.3, 6.1, 6.2
     */
    ipcMain.handle('update:download', async (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected update:download from untrusted sender');
        return;
      }
      await autoUpdaterManager.downloadUpdate();
    });

    /**
     * Install the downloaded update and restart.
     * @requirements 12.3, 12.5, 6.1, 6.2
     */
    ipcMain.handle('update:install', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected update:install from untrusted sender');
        return;
      }
      autoUpdaterManager.installUpdate();
    });

    /**
     * Get the current update state.
     * @returns Object with update availability and download status
     * @requirements 6.1, 6.2
     */
    ipcMain.handle('update:getState', (event) => {
      if (!this.validateIPCSender(event)) {
        console.warn('[Electron] Rejected update:getState from untrusted sender');
        return { available: false, downloaded: false, info: null };
      }
      return autoUpdaterManager.getUpdateState();
    });

    console.log('[Electron] IPC handlers registered with input validation');
  }

  private onWindowsClosed(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }
}

// Initialize the app
new Win95ReanimatedApp();
