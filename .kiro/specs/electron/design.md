# Electron Shell Design

## Overview

The Electron Shell consists of a main process (Node.js) that manages the application lifecycle and a renderer process (Chromium) that runs the React application. Communication between processes occurs through IPC (Inter-Process Communication) with a secure preload script.

## Architecture

### Process Structure

```
Main Process (main.ts)
├── Window Management
├── IPC Handlers
├── System Tray
├── Auto Updater
└── Application Lifecycle

Preload Script (preload.ts)
├── Context Bridge
└── Secure IPC API

Renderer Process (React App)
├── Desktop Component
├── Window Manager
├── Applications
└── Core Modules
```

## Components and Interfaces

### Main Process (main.ts)

```typescript
import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import path from 'path';
import Store from 'electron-store';

class Win95ReanimatedApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private store: Store;
  
  constructor() {
    this.store = new Store();
    this.setupApp();
  }
  
  private setupApp(): void {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', () => this.onWindowsClosed());
    app.on('activate', () => this.onActivate());
  }
  
  private onReady(): void {
    this.createWindow();
    this.createTray();
    this.setupIPC();
  }
  
  private createWindow(): void {
    const bounds = this.store.get('windowBounds', {
      width: 1024,
      height: 768
    });
    
    this.mainWindow = new BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      frame: false,
      show: false,
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
    });
    
    // Save window bounds
    this.mainWindow.on('resize', () => this.saveWindowBounds());
    this.mainWindow.on('move', () => this.saveWindowBounds());
  }
  
  private saveWindowBounds(): void {
    if (this.mainWindow) {
      const bounds = this.mainWindow.getBounds();
      this.store.set('windowBounds', bounds);
    }
  }
  
  private createTray(): void {
    this.tray = new Tray(path.join(__dirname, '../assets/icon.png'));
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => this.mainWindow?.show()
      },
      {
        label: 'Hide',
        click: () => this.mainWindow?.hide()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Win95 Reanimated');
    
    this.tray.on('click', () => {
      if (this.mainWindow?.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow?.show();
      }
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
      const closeToTray = this.store.get('closeToTray', true);
      if (closeToTray) {
        this.mainWindow?.hide();
      } else {
        app.quit();
      }
    });
    
    ipcMain.handle('window:isMaximized', () => {
      return this.mainWindow?.isMaximized();
    });
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

new Win95ReanimatedApp();
```

### Preload Script (preload.ts)

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  
  // Platform info
  platform: process.platform,
  
  // Event listeners
  onWindowMaximized: (callback: () => void) => {
    ipcRenderer.on('window-maximized', callback);
  },
  onWindowUnmaximized: (callback: () => void) => {
    ipcRenderer.on('window-unmaximized', callback);
  }
});

// Type definitions for TypeScript
export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  platform: string;
  onWindowMaximized: (callback: () => void) => void;
  onWindowUnmaximized: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### Renderer Integration

```typescript
// In TitleBar component
import React from 'react';

export function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };
  
  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };
  
  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };
  
  return (
    <div className="title-bar">
      <span className="title">Win95 Reanimated</span>
      <div className="controls">
        <button onClick={handleMinimize}>_</button>
        <button onClick={handleMaximize}>□</button>
        <button onClick={handleClose}>×</button>
      </div>
    </div>
  );
}
```

## Build Configuration

### package.json

```json
{
  "name": "win95-reanimated",
  "version": "1.0.0",
  "main": "dist/electron/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "npm run build:vite && npm run build:electron",
    "build:vite": "vite build",
    "build:electron": "tsc -p electron/tsconfig.json",
    "package": "electron-builder",
    "package:win": "electron-builder --win",
    "package:mac": "electron-builder --mac",
    "package:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.win95reanimated.app",
    "productName": "Win95 Reanimated",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "assets/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "assets/icon.icns",
      "category": "public.app-category.utilities"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png",
      "category": "Utility"
    }
  }
}
```

### electron-builder.yml

```yaml
appId: com.win95reanimated.app
productName: Win95 Reanimated
copyright: Copyright © 2025

directories:
  output: release
  buildResources: assets

files:
  - dist/**/*
  - assets/**/*

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: assets/icon.ico
  
mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
  icon: assets/icon.icns
  category: public.app-category.utilities
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: assets/entitlements.mac.plist
  entitlementsInherit: assets/entitlements.mac.plist

linux:
  target:
    - AppImage
    - deb
  icon: assets/icon.png
  category: Utility
```

## Error Handling

### Crash Recovery

```typescript
// In main.ts
import { crashReporter } from 'electron';

crashReporter.start({
  productName: 'Win95 Reanimated',
  companyName: 'Win95 Reanimated',
  submitURL: '', // Optional: crash reporting service
  uploadToServer: false
});

// Handle renderer crashes
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Renderer process crashed:', details);
  
  // Attempt to reload
  if (details.reason !== 'clean-exit') {
    webContents.reload();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Log to file
  fs.appendFileSync(
    path.join(app.getPath('userData'), 'error.log'),
    `${new Date().toISOString()}: ${error.stack}\n`
  );
});
```

## Development Tools

### Hot Reload

```typescript
// In main.ts (development only)
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}
```

### DevTools Extensions

```typescript
// In main.ts (development only)
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

app.whenReady().then(() => {
  if (process.env.NODE_ENV === 'development') {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension: ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
  }
});
```

## Security Considerations

### Content Security Policy

```typescript
// In main.ts
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
      ]
    }
  });
});
```

### Secure IPC

- Use `contextBridge` to expose limited API
- Validate all IPC messages
- Never pass user input directly to shell commands
- Use `invoke` instead of `send` for request-response patterns

## Testing Strategy

### Unit Tests
- Test IPC handlers
- Test window state management
- Test tray icon behavior

### Integration Tests
- Test main-renderer communication
- Test window lifecycle
- Test crash recovery

### E2E Tests
- Test application launch
- Test window controls
- Test system tray integration

## Performance Considerations

- Lazy load heavy modules
- Use `webPreferences.backgroundThrottling: false` if needed
- Optimize preload script size
- Use `BrowserWindow.setBackgroundColor` to prevent white flash
- Enable hardware acceleration where appropriate
