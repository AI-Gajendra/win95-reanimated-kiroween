# Win95 Reanimated - Project Structure

## Overview

This document describes the project structure and configuration for Win95 Reanimated, an Electron + React + TypeScript application that recreates the Windows 95 desktop experience with AI augmentation.

## Directory Structure

```
win95-reanimated/
├── .git/                    # Git repository
├── .kiro/                   # Kiro IDE configuration
│   ├── hooks/              # Agent hooks
│   ├── specs/              # Feature specifications
│   └── steering/           # Steering rules
├── .vscode/                # VS Code settings
├── apps/                   # Application modules
│   ├── explorer/           # File Explorer app
│   ├── notepad/            # Notepad app
│   └── start-menu/         # Start Menu component
├── core/                   # Core system modules
│   ├── ai-engine/          # AI service abstraction
│   ├── file-system/        # Virtual file system
│   └── window-manager/     # Window management
├── dist/                   # Build output (generated)
│   ├── electron/           # Compiled Electron main process
│   └── renderer/           # Compiled React app
├── electron/               # Electron main process
│   ├── main.ts            # Main process entry point
│   ├── preload.ts         # Preload script for IPC
│   └── tsconfig.json      # TypeScript config for Electron
├── node_modules/           # Dependencies (generated)
├── public/                 # Static assets
├── src/                    # React application source
│   ├── components/         # Shared UI components
│   ├── App.tsx            # Root React component
│   ├── index.tsx          # React entry point
│   └── index.css          # Global styles + Win95 utilities
├── .gitignore             # Git ignore rules
├── index.html             # HTML template
├── package.json           # NPM dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript config for React
├── tsconfig.node.json     # TypeScript config for Node
└── vite.config.ts         # Vite bundler configuration
```

## Module Organization

### Core Modules (`/core`)

Core modules provide foundational services and must not depend on UI components:

- **ai-engine/**: AI service abstraction layer
  - Provides unified interface for AI operations
  - Handles caching and usage tracking
  - Supports multiple AI providers

- **file-system/**: Virtual file system (VFS)
  - In-memory file and folder structure
  - Event-driven architecture
  - Path utilities and validation

- **window-manager/**: Window state management
  - React Context-based API
  - Window lifecycle management
  - Z-index and focus handling

### Application Modules (`/apps`)

Self-contained application components:

- **notepad/**: Text editor application
- **explorer/**: File system browser
- **start-menu/**: Start Menu UI component

Each app is independent and communicates with core modules through defined APIs.

### UI Components (`/src`)

Shared presentational components and application shell:

- **components/**: Reusable Win95-styled UI components
- **App.tsx**: Root application component
- **index.tsx**: React entry point
- **index.css**: Global styles and Win95 utility classes

## Configuration Files

### TypeScript Configuration

- **tsconfig.json**: Main TypeScript config for React app
  - Target: ES2020
  - Module: ESNext
  - JSX: react-jsx
  - Path aliases: `@/*`, `@core/*`, `@apps/*`

- **electron/tsconfig.json**: TypeScript config for Electron
  - Target: ES2020
  - Module: CommonJS
  - Output: `dist/electron/`

### Build Configuration

- **vite.config.ts**: Vite bundler configuration
  - React plugin enabled
  - Path aliases configured
  - Output: `dist/renderer/`

- **tailwind.config.js**: Tailwind CSS configuration
  - Win95 color palette
  - Win95 font families
  - Content paths for all modules

- **postcss.config.js**: PostCSS configuration
  - Tailwind CSS plugin
  - Autoprefixer plugin

### Package Configuration

- **package.json**: NPM configuration
  - Type: module (ES modules)
  - Main: `dist/electron/main.js`
  - Scripts for development and building

## Path Aliases

The project uses TypeScript path aliases for clean imports:

- `@/*` → `src/*` (UI components and app shell)
- `@core/*` → `core/*` (Core system modules)
- `@apps/*` → `apps/*` (Application modules)

Example imports:
```typescript
import { Button } from '@/components/Button';
import { vfs } from '@core/file-system/vfs';
import { Notepad } from '@apps/notepad/Notepad';
```

## Build Scripts

### Development
```bash
npm run dev              # Start dev server + Electron
npm run dev:vite         # Start Vite dev server only
npm run dev:electron     # Start Electron only
```

### Production Build
```bash
npm run build            # Build both renderer and main process
npm run build:vite       # Build React app
npm run build:electron   # Build Electron main process
```

### Packaging
```bash
npm run package          # Package for current platform
npm run package:win      # Package for Windows
npm run package:mac      # Package for macOS
npm run package:linux    # Package for Linux
```

## Win95 Styling System

### Color Palette

Defined in `tailwind.config.js`:
- `win95-gray`: #c0c0c0 (window background)
- `win95-dark-gray`: #808080 (shadows)
- `win95-white`: #ffffff (highlights)
- `win95-black`: #000000 (text)
- `win95-navy`: #000080 (title bars, selection)
- `win95-teal`: #008080 (desktop background)

### Utility Classes

Defined in `src/index.css`:
- `.win95-outset`: Raised beveled border (buttons, window chrome)
- `.win95-inset`: Sunken beveled border (inputs, text areas)

### Font Families

- `font-win95`: MS Sans Serif approximation
- `font-win95-mono`: Courier New for monospace

## Electron Configuration

### Main Process (`electron/main.ts`)

- Creates frameless window (custom Win95 chrome)
- Handles IPC for window controls
- Loads dev server in development, built files in production
- Background color: Win95 teal (#008080)

### Preload Script (`electron/preload.ts`)

Exposes secure IPC API to renderer:
- `window.electronAPI.minimizeWindow()`
- `window.electronAPI.maximizeWindow()`
- `window.electronAPI.closeWindow()`
- `window.electronAPI.isMaximized()`
- `window.electronAPI.platform`

### Security

- Context isolation: enabled
- Node integration: disabled
- Sandbox: enabled
- Preload script for controlled IPC

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Start development**: `npm run dev`
3. **Make changes**: Edit files in `src/`, `core/`, or `apps/`
4. **Hot reload**: Vite automatically reloads changes
5. **Build for production**: `npm run build`
6. **Package application**: `npm run package`

## Architecture Principles

1. **Separation of Concerns**: UI, business logic, and services are separate
2. **Single Source of Truth**: Each module owns its state
3. **Unidirectional Data Flow**: Props down, events up
4. **Framework Agnostic Core**: Core modules don't depend on React
5. **Type Safety**: Full TypeScript coverage

## Next Steps

With the project structure in place, you can now:

1. Implement Win95 UI components (Task 2)
2. Create Boot Screen component (Task 3)
3. Build Desktop workspace (Task 4)
4. Implement Window Manager (Task 5)
5. Build Taskbar component (Task 6)
6. Create Start Menu (Task 7)
7. Add application registry (Task 8)
8. Implement keyboard shortcuts (Task 9)

See `.kiro/specs/desktop/tasks.md` for the complete implementation plan.
