# Quick Start Guide

## Phase 1: Project Initialization ✅ COMPLETE

The project has been scaffolded with the following structure:

```
win95-reanimated/
├── .kiro/                    # Kiro specs, hooks, and steering
│   ├── specs/               # Complete specifications
│   ├── hooks/               # Automation hooks
│   └── steering/            # Development guidelines
├── apps/                    # Application modules (placeholders)
│   ├── notepad/
│   ├── explorer/
│   └── start-menu/
├── core/                    # Core services ✅ IMPLEMENTED
│   ├── window-manager/      # Window state management
│   ├── file-system/         # Virtual file system (VFS)
│   └── ai-engine/           # AI service abstraction
├── electron/                # Electron main process ✅ IMPLEMENTED
├── src/                     # React application ✅ BASIC SETUP
└── Configuration files      # TypeScript, Tailwind, Vite, etc.
```

## What's Been Implemented

### ✅ Core Systems (Invisible Logic)

1. **Virtual File System (VFS)**
   - Location: `core/file-system/vfs.ts`
   - Features:
     - In-memory file system with localStorage persistence
     - CRUD operations (create, read, update, delete)
     - Event emission for file system changes
     - Default folder structure with sample files
   - Test it: Open browser console and try:
     ```javascript
     import { vfs } from './core/file-system/vfs';
     vfs.readFolder('/documents');
     ```

2. **AI Engine**
   - Location: `core/ai-engine/aiClient.ts`
   - Features:
     - Mock provider (works without API keys)
     - Text summarization
     - Text rewriting (formal, casual, concise)
     - Natural language intent interpretation
     - Folder explanation
     - Response caching
     - Usage tracking
   - Test it: Open browser console and try:
     ```javascript
     import { aiClient } from './core/ai-engine/aiClient';
     await aiClient.summarize('Your text here...');
     ```

3. **Window Manager**
   - Location: `core/window-manager/WindowContext.tsx`
   - Features:
     - React Context-based state management
     - Window operations (open, close, focus, minimize, maximize)
     - Z-index management
     - Cascading window positioning
   - Ready to use in React components

4. **Electron Shell**
   - Location: `electron/main.ts` and `electron/preload.ts`
   - Features:
     - Frameless window
     - Secure IPC communication
     - Window controls (minimize, maximize, close)
     - Development mode with hot reload

## Installation & Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron window
- Enable hot reload

You should see a teal screen with "Win95 Reanimated" text.

### 3. Verify Core Systems

Open the browser DevTools (in Electron window) and check the console:
- You should see: `[Win95 Reanimated] VFS and AI Engine initialized`
- You should see: `[AI Engine] Initialized with provider: mock`
- You should see: `[Window Manager] ...` messages

### 4. Test VFS in Console

```javascript
// Import VFS
const { vfs } = await import('./core/file-system/vfs.ts');

// List root folders
vfs.readFolder('/');

// Read a file
vfs.readFile('/documents/readme.txt');

// Create a new file
vfs.writeFile('/documents/test.txt', 'Hello Win95!');

// List documents folder
vfs.readFolder('/documents');
```

### 5. Test AI Engine in Console

```javascript
// Import AI Client
const { aiClient } = await import('./core/ai-engine/aiClient.ts');

// Summarize text
await aiClient.summarize('This is a long text that needs to be summarized. It contains multiple sentences and ideas that should be condensed into a shorter form.');

// Interpret a command
await aiClient.interpret('open notepad');

// Get usage stats
aiClient.getUsageStats();
```

## Next Steps (Phase 2)

Now that the core systems are working, the next phase is to build the UI:

1. **Desktop Component** - Main desktop with taskbar
2. **Window Component** - Win95-style window chrome
3. **Start Menu** - Classic Start Menu with AI search
4. **Notepad App** - Text editor with AI features
5. **Explorer App** - File manager with AI folder analysis

## Project Structure

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS with Win95 colors
- `electron/tsconfig.json` - Electron TypeScript config

### Core Modules
- `core/file-system/` - VFS implementation
- `core/ai-engine/` - AI service abstraction
- `core/window-manager/` - Window state management

### Electron
- `electron/main.ts` - Main process
- `electron/preload.ts` - Secure IPC bridge

### React App
- `src/index.tsx` - Entry point
- `src/App.tsx` - Root component
- `src/index.css` - Global styles with Win95 utilities

## Troubleshooting

### Port 5173 already in use
```bash
# Kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5173 | xargs kill -9
```

### Electron window doesn't open
- Check that Vite dev server started successfully
- Wait for "ready" message before Electron launches
- Check console for errors

### TypeScript errors
```bash
# Rebuild TypeScript
npm run build:electron
```

## Development Guidelines

- Follow the **architecture.md** steering document for code organization
- Follow the **ui-style.md** steering document for Win95 styling
- Refer to specs in `.kiro/specs/` for requirements and design
- Use the hooks in `.kiro/hooks/` as examples for automation

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Status**: Phase 1 Complete ✅  
**Next**: Implement Desktop UI (Phase 2)
