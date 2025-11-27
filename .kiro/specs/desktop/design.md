# Desktop System Design

## Overview

The Desktop System serves as the root application component that orchestrates the entire Win95 Reanimated experience. It manages the boot sequence, renders the desktop workspace, coordinates the Window Manager, Taskbar, and Start Menu, and maintains global application state.

## Architecture

### Component Hierarchy

```
Desktop
├── BootScreen (conditional)
├── DesktopWorkspace
│   ├── WindowManager
│   │   └── Window[] (dynamic)
│   ├── Taskbar
│   │   ├── StartButton
│   │   ├── WindowList
│   │   └── SystemTray
│   └── StartMenu (conditional)
```

### State Management

The Desktop System uses React Context to provide global state access:

- `WindowContext`: Manages window state and operations
- `DesktopContext`: Manages desktop-level state (Start Menu visibility, boot status)

### Module Responsibilities

**Desktop Component**
- Orchestrates boot sequence and transition to desktop
- Provides context providers for child components
- Handles global keyboard shortcuts (Alt+Tab, Windows key)
- Manages desktop background rendering

**DesktopWorkspace Component**
- Renders the main desktop area
- Positions and contains the Window Manager
- Handles desktop-level click events (closing Start Menu)

## Components and Interfaces

### Desktop Component

```typescript
interface DesktopProps {
  bootDuration?: number; // milliseconds, default 3000
}

interface DesktopState {
  isBooting: boolean;
  startMenuOpen: boolean;
}
```

### WindowManager Integration

The Desktop System integrates with the Window Manager through a context-based API:

```typescript
interface WindowManagerContext {
  windows: WindowState[];
  openWindow: (appId: string, props?: WindowProps) => string;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
}

interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  component: React.ComponentType<any>;
}
```

### Taskbar Integration

The Taskbar receives window state from WindowContext and provides callbacks:

```typescript
interface TaskbarProps {
  onStartClick: () => void;
  onWindowButtonClick: (windowId: string) => void;
}
```

### Start Menu Integration

```typescript
interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAppLaunch: (appId: string) => void;
  onSearch: (query: string) => void;
}
```

## Data Models

### Application Registry

The Desktop System maintains a registry of available applications:

```typescript
interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<WindowContentProps>;
  defaultSize: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
}

const APP_REGISTRY: Record<string, AppDefinition> = {
  notepad: { /* ... */ },
  explorer: { /* ... */ },
  // ...
};
```

## Error Handling

### Boot Failure
- If boot screen fails to render, skip directly to desktop
- Log error to console for debugging

### Window Manager Errors
- If window creation fails, show error dialog (Win95-style message box)
- Prevent duplicate windows for singleton apps (e.g., only one Explorer)

### Context Provider Errors
- Use React Error Boundaries to catch rendering errors
- Display Win95-style error dialog with "OK" button

## Testing Strategy

### Unit Tests
- Desktop state transitions (boot → desktop)
- Start Menu open/close logic
- Window Manager context operations
- Application registry lookups

### Integration Tests
- Boot sequence completes and shows desktop
- Start Menu opens and launches applications
- Window Manager creates windows with correct initial state
- Taskbar buttons sync with window state

### Visual Regression Tests
- Desktop background and layout
- Taskbar positioning and styling
- Start Menu appearance and positioning
- Window chrome rendering

## Performance Considerations

- Use React.memo for Window components to prevent unnecessary re-renders
- Debounce window drag operations to 16ms (60fps)
- Lazy load application components using React.lazy
- Limit maximum number of open windows to 10

## Accessibility

- Keyboard navigation: Tab through Taskbar buttons and Start Menu items
- Alt+Tab: Cycle through open windows
- Windows key: Toggle Start Menu
- Escape: Close Start Menu
- Screen reader support for window titles and controls
