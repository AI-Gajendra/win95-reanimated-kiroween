# Electron Shell Implementation Plan

- [x] 1. Set up Electron project structure




  - [x] 1.1 Initialize Electron configuration


    - Install Electron and related dependencies
    - Create electron/ directory for main process code
    - Configure TypeScript for Electron
    - Set up electron/tsconfig.json
    - _Requirements: 1.1_
  

  - [x] 1.2 Configure build scripts

    - Add dev, build, and package scripts to package.json
    - Install concurrently for running dev servers
    - Install wait-on for synchronizing processes
    - Install electron-builder for packaging
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 2. Implement main process






  - [x] 2.1 Create main.ts entry point

    - Set up Electron app lifecycle handlers
    - Handle app.whenReady event
    - Handle window-all-closed event
    - Handle activate event (macOS)
    - _Requirements: 1.1_
  

  - [x] 2.2 Implement window creation

    - Create BrowserWindow with frameless option
    - Set minimum and default dimensions
    - Center window on screen
    - Configure webPreferences for security
    - Load React app (dev server or built files)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2_
  

  - [x] 2.3 Add loading screen

    - Show loading screen while React app initializes
    - Hide loading screen when ready-to-show event fires
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
-

- [x] 3. Implement window state persistence




  - [x] 3.1 Install and configure electron-store


    - Add electron-store dependency
    - Create Store instance in main process
    - _Requirements: 3.1, 3.2_
  

  - [ ] 3.2 Save window bounds on resize and move
    - Listen to resize event
    - Listen to move event
    - Save bounds to electron-store
    - _Requirements: 3.1, 3.2_

  
  - [ ] 3.3 Restore window bounds on launch
    - Load saved bounds from electron-store
    - Apply bounds to BrowserWindow
    - Use defaults if no saved bounds exist
    - Validate bounds are on-screen
    - _Requirements: 3.3, 3.4, 3.5_
-

- [x] 4. Implement secure IPC communication



  - [x] 4.1 Create preload script


    - Create electron/preload.ts file
    - Use contextBridge to expose API
    - Define ElectronAPI interface
    - Add TypeScript declarations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 4.2 Implement window control IPC handlers


    - Add window:minimize handler
    - Add window:maximize handler
    - Add window:close handler
    - Add window:isMaximized handler
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 4.3 Expose IPC methods in preload

    - Expose minimizeWindow method
    - Expose maximizeWindow method
    - Expose closeWindow method
    - Expose isMaximized method
    - Expose platform info
    - _Requirements: 4.5, 6.2_

- [x] 5. Integrate window controls with renderer






  - [x] 5.1 Create TitleBar component

    - Build custom Win95-style title bar
    - Add minimize, maximize, close buttons
    - Call electronAPI methods on button clicks
    - Handle maximize/unmaximize toggle
    - _Requirements: 2.3, 4.1, 4.2, 4.3_
  

  - [x] 5.2 Enable window dragging

    - Add -webkit-app-region: drag CSS to title bar
    - Exclude buttons from drag region
    - _Requirements: 2.4_
  

  - [x] 5.3 Enable window resizing

    - Ensure window edges are resizable
    - Test resize from all edges and corners
    - _Requirements: 2.5_

- [x] 6. Implement system tray





  - [x] 6.1 Create tray icon

    - Load icon from assets
    - Create Tray instance
    - Set tooltip text
    - _Requirements: 10.1_
  

  - [ ] 6.2 Add tray context menu
    - Create menu with Show, Hide, Quit options
    - Handle menu item clicks
    - _Requirements: 10.3_

  
  - [ ] 6.3 Implement tray click behavior
    - Toggle window visibility on tray icon click

    - _Requirements: 10.2_
  
  - [ ] 6.4 Implement close-to-tray behavior
    - Hide window instead of quitting on close
    - Store closeToTray preference
    - Provide setting to disable
    - _Requirements: 10.4, 10.5_
-

- [x] 7. Add keyboard shortcuts





  - [x] 7.1 Register global shortcuts

    - Register Ctrl+Q (Cmd+Q) for quit
    - Register F11 for fullscreen toggle
    - Register Ctrl+R (Cmd+R) for reload (dev only)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  

  - [x] 7.2 Pass keyboard events to renderer

    - Ensure renderer receives keyboard events
    - Test application-specific shortcuts
    - _Requirements: 8.5_
-

- [x] 8. Implement error handling and crash recovery




  - [x] 8.1 Set up crash reporter


    - Initialize crashReporter
    - Configure crash reporting options
    - _Requirements: 7.1, 7.2_
  

  - [x] 8.2 Handle renderer crashes
    - Listen to render-process-gone event
    - Log crash details
    - Attempt to reload renderer
    - Show error dialog after repeated crashes
    - _Requirements: 7.1, 7.2, 7.3_

  
  - [x] 8.3 Handle main process errors
    - Catch uncaughtException events
    - Log errors to file
    - _Requirements: 7.4, 7.5_
-

- [x] 9. Set up development environment




  - [x] 9.1 Configure hot reload


    - Install electron-reload
    - Enable hot reload in development mode
    - Preserve state during reload when possible
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  

  - [x] 9.2 Install DevTools extensions

    - Install electron-devtools-installer
    - Add React Developer Tools
    - Enable DevTools in development mode
    - _Requirements: 9.1_
  

  - [x] 9.3 Configure development server integration

    - Load from localhost:5173 in dev mode
    - Wait for Vite server to be ready
    - Open DevTools automatically
    - _Requirements: 9.1, 9.2_
-

- [x] 10. Configure application packaging




  - [x] 10.1 Set up electron-builder configuration


    - Create electron-builder.yml
    - Configure appId and productName
    - Set output directory
    - Define file patterns to include
    - _Requirements: 11.1_
  
  - [x] 10.2 Configure Windows packaging


    - Set up NSIS installer target
    - Add Windows icon
    - Configure installer options
    - _Requirements: 11.2_
  
  - [x] 10.3 Configure macOS packaging


    - Set up DMG target
    - Add macOS icon
    - Configure app category
    - Set up code signing (optional)
    - _Requirements: 11.3, 11.5_
  
  - [x] 10.4 Configure Linux packaging


    - Set up AppImage and DEB targets
    - Add Linux icon
    - Configure app category
    - _Requirements: 11.4_
  
  - [x] 10.5 Add build scripts


    - Add package:win script
    - Add package:mac script
    - Add package:linux script
    - Test packaging on each platform
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
-

- [x] 11. Implement auto-updater (optional)




  - [x] 11.1 Install electron-updater


    - Add electron-updater dependency
    - Configure update server URL
    - _Requirements: 12.1, 12.4_
  

  - [x] 11.2 Check for updates on launch

    - Call autoUpdater.checkForUpdates on app ready
    - Handle update-available event
    - _Requirements: 12.1, 12.2_
  

  - [x] 11.3 Show update notification

    - Display notification when update available
    - Provide download and install option
    - Never force updates
    - _Requirements: 12.2, 12.3, 12.5_
-

- [x] 12. Add security hardening




  - [x] 12.1 Configure Content Security Policy


    - Set CSP headers in session
    - Restrict script and style sources
    - _Requirements: 6.3, 6.4, 6.5_
  

  - [x] 12.2 Validate IPC messages

    - Add input validation to IPC handlers
    - Sanitize user input
    - _Requirements: 6.1, 6.2_
  

  - [x] 12.3 Review security checklist

    - Verify contextIsolation is enabled
    - Verify nodeIntegration is disabled
    - Verify sandbox is enabled
    - Review all IPC handlers
    - _Requirements: 6.3, 6.4, 6.5_
- [x] 13. Create application icons




- [ ] 13. Create application icons

  - Create icon.png (512x512) for Linux
  - Create icon.ico for Windows
  - Create icon.icns for macOS
  - Place icons in assets/ directory
  - _Requirements: 1.5, 10.1, 11.2, 11.3, 11.4_

- [x] 14. Testing




- [ ] 14. Testing

  - [x] 14.1 Write unit tests for main process



    - Test window creation
    - Test IPC handlers
    - Test state persistence
    - _Requirements: All_
  

  - [x] 14.2 Write integration tests


    - Test main-renderer communication
    - Test window lifecycle
    - Test tray integration
    - _Requirements: All_
  

  - [x] 14.3 Manual testing on all platforms


    - Test on Windows
    - Test on macOS
    - Test on Linux
    - Verify packaging works on each platform
    - _Requirements: All_
