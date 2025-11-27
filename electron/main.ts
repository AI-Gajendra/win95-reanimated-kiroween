/**
 * Electron Main Process
 * 
 * Manages the application lifecycle and creates the main window.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

class Win95ReanimatedApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', () => this.onWindowsClosed());
    app.on('activate', () => this.onActivate());
  }

  private onReady(): void {
    this.createWindow();
    this.setupIPC();
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      minWidth: 800,
      minHeight: 600,
      frame: false,
      show: false,
      backgroundColor: '#008080',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      console.log('[Electron] Window ready');
    });

    // Handle window close
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      app.quit();
    });

    ipcMain.handle('window:isMaximized', () => {
      return this.mainWindow?.isMaximized();
    });

    console.log('[Electron] IPC handlers registered');
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
