# Electron Shell Manual Testing Checklist

This document provides a comprehensive checklist for manual testing of the Electron shell on all supported platforms.

## Prerequisites

Before testing, ensure you have:
- [ ] Built the application (`npm run build`)
- [ ] Created platform-specific packages (`npm run package:win`, `npm run package:mac`, `npm run package:linux`)

---

## Windows Testing

### Application Launch (Requirements: 1.1-1.5)
- [ ] Application launches successfully
- [ ] Window appears centered on screen (first launch)
- [ ] Window has correct default dimensions (1024x768)
- [ ] Window title shows "Win95 Reanimated"
- [ ] Loading/boot screen displays during initialization

### Window Controls (Requirements: 2.1-2.5, 4.1-4.5)
- [ ] Window is frameless (no native title bar)
- [ ] Custom Win95-style title bar is visible
- [ ] Minimize button works (window minimizes to taskbar)
- [ ] Maximize button works (window fills screen)
- [ ] Maximize button toggles back to normal size
- [ ] Close button works (hides to tray or closes based on setting)
- [ ] Window can be dragged by the title bar
- [ ] Window can be resized from all edges and corners
- [ ] Minimum window size is enforced (800x600)

### Window State Persistence (Requirements: 3.1-3.5)
- [ ] Window position is saved when moved
- [ ] Window size is saved when resized
- [ ] Window position is restored on next launch
- [ ] Window size is restored on next launch
- [ ] Window appears on-screen even if saved position is off-screen

### System Tray (Requirements: 10.1-10.5)
- [ ] Tray icon appears in system tray
- [ ] Tray icon has correct tooltip ("Win95 Reanimated")
- [ ] Left-click on tray icon toggles window visibility
- [ ] Right-click shows context menu
- [ ] Context menu has Show, Hide, and Quit options
- [ ] Close-to-tray setting works (window hides instead of closing)
- [ ] Quit from tray menu closes the application

### Keyboard Shortcuts (Requirements: 8.1-8.5)
- [ ] Ctrl+Q quits the application
- [ ] F11 toggles fullscreen mode
- [ ] Ctrl+R reloads the application (dev mode only)
- [ ] Keyboard events are passed to the React application

### Error Handling (Requirements: 7.1-7.5)
- [ ] Application handles renderer crashes gracefully
- [ ] Error dialog appears after repeated crashes
- [ ] Error log file is created in user data directory

### Packaging (Requirements: 11.1-11.2)
- [ ] NSIS installer runs correctly
- [ ] Application installs to correct location
- [ ] Start menu shortcut is created
- [ ] Desktop shortcut is created (if selected)
- [ ] Application uninstalls cleanly

---

## macOS Testing

### Application Launch (Requirements: 1.1-1.5)
- [ ] Application launches successfully
- [ ] Window appears centered on screen (first launch)
- [ ] Window has correct default dimensions (1024x768)
- [ ] Window title shows "Win95 Reanimated"
- [ ] Loading/boot screen displays during initialization

### Window Controls (Requirements: 2.1-2.5, 4.1-4.5)
- [ ] Window is frameless (no native title bar)
- [ ] Custom Win95-style title bar is visible
- [ ] Minimize button works (window minimizes to dock)
- [ ] Maximize button works (window fills screen)
- [ ] Maximize button toggles back to normal size
- [ ] Close button works (hides to tray or closes based on setting)
- [ ] Window can be dragged by the title bar
- [ ] Window can be resized from all edges and corners
- [ ] Minimum window size is enforced (800x600)

### Window State Persistence (Requirements: 3.1-3.5)
- [ ] Window position is saved when moved
- [ ] Window size is saved when resized
- [ ] Window position is restored on next launch
- [ ] Window size is restored on next launch
- [ ] Window appears on-screen even if saved position is off-screen

### System Tray (Requirements: 10.1-10.5)
- [ ] Tray icon appears in menu bar
- [ ] Tray icon has correct tooltip
- [ ] Click on tray icon toggles window visibility
- [ ] Context menu appears on click
- [ ] Context menu has Show, Hide, and Quit options
- [ ] Close-to-tray setting works

### Keyboard Shortcuts (Requirements: 8.1-8.5)
- [ ] Cmd+Q quits the application
- [ ] F11 toggles fullscreen mode
- [ ] Cmd+R reloads the application (dev mode only)
- [ ] Keyboard events are passed to the React application

### macOS-Specific Behavior
- [ ] Application stays running when all windows are closed (dock icon remains)
- [ ] Clicking dock icon reopens window
- [ ] Application appears in Applications folder after install

### Packaging (Requirements: 11.3, 11.5)
- [ ] DMG file opens correctly
- [ ] Application can be dragged to Applications folder
- [ ] Application runs from Applications folder
- [ ] Code signing works (if configured)
- [ ] Notarization works (if configured)

---

## Linux Testing

### Application Launch (Requirements: 1.1-1.5)
- [ ] Application launches successfully
- [ ] Window appears centered on screen (first launch)
- [ ] Window has correct default dimensions (1024x768)
- [ ] Window title shows "Win95 Reanimated"
- [ ] Loading/boot screen displays during initialization

### Window Controls (Requirements: 2.1-2.5, 4.1-4.5)
- [ ] Window is frameless (no native title bar)
- [ ] Custom Win95-style title bar is visible
- [ ] Minimize button works
- [ ] Maximize button works
- [ ] Maximize button toggles back to normal size
- [ ] Close button works (hides to tray or closes based on setting)
- [ ] Window can be dragged by the title bar
- [ ] Window can be resized from all edges and corners
- [ ] Minimum window size is enforced (800x600)

### Window State Persistence (Requirements: 3.1-3.5)
- [ ] Window position is saved when moved
- [ ] Window size is saved when resized
- [ ] Window position is restored on next launch
- [ ] Window size is restored on next launch
- [ ] Window appears on-screen even if saved position is off-screen

### System Tray (Requirements: 10.1-10.5)
- [ ] Tray icon appears in system tray (if supported by DE)
- [ ] Tray icon has correct tooltip
- [ ] Click on tray icon toggles window visibility
- [ ] Context menu appears
- [ ] Context menu has Show, Hide, and Quit options
- [ ] Close-to-tray setting works

### Keyboard Shortcuts (Requirements: 8.1-8.5)
- [ ] Ctrl+Q quits the application
- [ ] F11 toggles fullscreen mode
- [ ] Ctrl+R reloads the application (dev mode only)
- [ ] Keyboard events are passed to the React application

### Packaging (Requirements: 11.4)
- [ ] AppImage runs correctly
- [ ] AppImage is executable
- [ ] DEB package installs correctly (Debian/Ubuntu)
- [ ] Application appears in application menu
- [ ] Application uninstalls cleanly

---

## Cross-Platform Tests

### Security (Requirements: 6.1-6.5)
- [ ] DevTools are only available in development mode
- [ ] External URL navigation is blocked
- [ ] Popup windows are blocked
- [ ] Node.js APIs are not accessible from renderer

### Auto-Updater (Requirements: 12.1-12.5)
- [ ] Update check runs on launch (production only)
- [ ] Update notification appears when available
- [ ] User can choose to download or skip
- [ ] Download progress is shown
- [ ] User can choose to install or defer
- [ ] Updates are never forced

### Performance (Requirements: 5.1-5.5)
- [ ] Application is interactive within 3 seconds
- [ ] No white flash on startup
- [ ] Window operations are responsive
- [ ] No memory leaks during extended use

---

## Notes

Record any issues found during testing:

| Platform | Issue | Steps to Reproduce | Severity |
|----------|-------|-------------------|----------|
|          |       |                   |          |

---

## Sign-off

| Platform | Tester | Date | Status |
|----------|--------|------|--------|
| Windows  |        |      | ☐ Pass / ☐ Fail |
| macOS    |        |      | ☐ Pass / ☐ Fail |
| Linux    |        |      | ☐ Pass / ☐ Fail |
