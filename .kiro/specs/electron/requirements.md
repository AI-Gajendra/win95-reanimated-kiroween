# Electron Shell Requirements

## Introduction

The Electron Shell provides the native application wrapper for Win95 Reanimated, enabling it to run as a standalone desktop application on Windows, macOS, and Linux. It manages the main process, renderer process communication, and native OS integration.

## Glossary

- **Electron**: A framework for building cross-platform desktop applications using web technologies
- **Main Process**: The Node.js process that manages application lifecycle and creates windows
- **Renderer Process**: The Chromium process that renders the UI (React application)
- **IPC**: Inter-Process Communication between main and renderer processes
- **BrowserWindow**: Electron's window class for creating application windows
- **Preload Script**: A script that runs before the renderer process loads, providing secure IPC access

## Requirements

### Requirement 1

**User Story:** As a user, I want to launch Win95 Reanimated as a desktop application, so that I can use it like a native program

#### Acceptance Criteria

1. WHEN the user launches the application, THE Electron Shell SHALL create a BrowserWindow with the React application
2. THE BrowserWindow SHALL have a minimum width of 800 pixels and minimum height of 600 pixels
3. THE BrowserWindow SHALL have a default width of 1024 pixels and default height of 768 pixels
4. THE BrowserWindow SHALL be centered on the screen on first launch
5. THE BrowserWindow SHALL have a title of "Win95 Reanimated"

### Requirement 2

**User Story:** As a user, I want the application window to look native, so that it integrates with my operating system

#### Acceptance Criteria

1. THE Electron Shell SHALL hide the default window frame and title bar
2. THE Electron Shell SHALL enable the frameless window option
3. THE application SHALL render its own Win95-style title bar and window chrome
4. THE Electron Shell SHALL support window dragging via the custom title bar
5. THE Electron Shell SHALL support window resizing via the window edges

### Requirement 3

**User Story:** As a user, I want the application to remember my window size and position, so that it opens where I left it

#### Acceptance Criteria

1. WHEN the user resizes the window, THE Electron Shell SHALL save the new dimensions to persistent storage
2. WHEN the user moves the window, THE Electron Shell SHALL save the new position to persistent storage
3. WHEN the application launches, THE Electron Shell SHALL restore the saved window dimensions and position
4. IF no saved dimensions exist, THE Electron Shell SHALL use default dimensions
5. THE Electron Shell SHALL ensure the restored position is visible on the current screen configuration

### Requirement 4

**User Story:** As a user, I want standard window controls to work, so that I can minimize, maximize, and close the application

#### Acceptance Criteria

1. WHEN the user clicks the minimize button, THE Electron Shell SHALL minimize the window to the taskbar
2. WHEN the user clicks the maximize button, THE Electron Shell SHALL maximize the window to fill the screen
3. WHEN the user clicks the close button, THE Electron Shell SHALL close the application
4. THE Electron Shell SHALL expose IPC methods for minimize, maximize, and close operations
5. THE renderer process SHALL call these IPC methods when the user interacts with custom window controls

### Requirement 5

**User Story:** As a user, I want the application to load quickly, so that I don't wait unnecessarily

#### Acceptance Criteria

1. THE Electron Shell SHALL show a loading screen while the React application initializes
2. THE loading screen SHALL display the Win95 Reanimated logo or boot screen
3. WHEN the React application is ready, THE Electron Shell SHALL hide the loading screen
4. THE Electron Shell SHALL preload critical resources to minimize startup time
5. THE application SHALL be interactive within 3 seconds on modern hardware

### Requirement 6

**User Story:** As a developer, I want secure IPC communication, so that the renderer process cannot access dangerous Node.js APIs

#### Acceptance Criteria

1. THE Electron Shell SHALL use a preload script to expose IPC methods to the renderer
2. THE preload script SHALL use contextBridge to create a secure API surface
3. THE renderer process SHALL NOT have direct access to Node.js APIs
4. THE Electron Shell SHALL enable contextIsolation for security
5. THE Electron Shell SHALL disable nodeIntegration in the renderer process

### Requirement 7

**User Story:** As a user, I want the application to handle crashes gracefully, so that I don't lose my work

#### Acceptance Criteria

1. WHEN the renderer process crashes, THE Electron Shell SHALL log the error and attempt to reload
2. THE Electron Shell SHALL save application state before reloading
3. IF the renderer crashes repeatedly, THE Electron Shell SHALL show an error dialog and exit
4. THE Electron Shell SHALL catch unhandled exceptions in the main process
5. THE Electron Shell SHALL log all errors to a file for debugging

### Requirement 8

**User Story:** As a user, I want the application to support keyboard shortcuts, so that I can work efficiently

#### Acceptance Criteria

1. THE Electron Shell SHALL register global keyboard shortcuts for common actions
2. THE Electron Shell SHALL support Ctrl+Q (Cmd+Q on macOS) to quit the application
3. THE Electron Shell SHALL support F11 to toggle fullscreen mode
4. THE Electron Shell SHALL support Ctrl+R (Cmd+R on macOS) to reload the application in development mode
5. THE Electron Shell SHALL pass keyboard events to the renderer process for application-specific shortcuts

### Requirement 9

**User Story:** As a developer, I want hot reload in development mode, so that I can iterate quickly

#### Acceptance Criteria

1. WHEN running in development mode, THE Electron Shell SHALL enable hot module replacement
2. THE Electron Shell SHALL reload the renderer process when source files change
3. THE Electron Shell SHALL preserve application state during hot reload when possible
4. THE Electron Shell SHALL log reload events to the console
5. THE Electron Shell SHALL NOT enable hot reload in production builds

### Requirement 10

**User Story:** As a user, I want the application to have a system tray icon, so that I can access it quickly

#### Acceptance Criteria

1. THE Electron Shell SHALL create a system tray icon with the Win95 Reanimated logo
2. WHEN the user clicks the tray icon, THE Electron Shell SHALL show or hide the main window
3. THE tray icon SHALL have a context menu with "Show", "Hide", and "Quit" options
4. WHEN the user closes the main window, THE Electron Shell SHALL hide it to the tray instead of quitting
5. THE Electron Shell SHALL provide a setting to disable "close to tray" behavior

### Requirement 11

**User Story:** As a developer, I want to package the application for distribution, so that users can install it easily

#### Acceptance Criteria

1. THE Electron Shell SHALL support building installers for Windows, macOS, and Linux
2. THE Windows installer SHALL be an NSIS or MSI installer
3. THE macOS installer SHALL be a DMG or PKG file
4. THE Linux installer SHALL be an AppImage, DEB, or RPM package
5. THE build process SHALL include code signing for Windows and macOS

### Requirement 12

**User Story:** As a user, I want the application to check for updates, so that I always have the latest version

#### Acceptance Criteria

1. THE Electron Shell SHALL check for updates on application launch
2. IF an update is available, THE Electron Shell SHALL show a notification
3. THE user SHALL be able to download and install updates from within the application
4. THE Electron Shell SHALL use electron-updater for auto-update functionality
5. THE Electron Shell SHALL NOT force updates without user consent
