---
inclusion: always
---

# Architecture Guidelines for Win95 Reanimated

This steering document enforces separation of concerns and architectural patterns throughout the codebase.

## Core Principles

### 1. Separation of Concerns
- **UI components** must not contain business logic
- **Business logic** must not contain UI code
- **AI operations** must go through the AI Engine abstraction
- **File operations** must go through the VFS abstraction

### 2. Single Source of Truth
- **Window Manager** is the single source of truth for window state
- **VFS** is the single source of truth for file system state
- **AI Engine** is the single source of truth for AI operations
- **Desktop** component is the single source of truth for application state

### 3. Unidirectional Data Flow
- State flows down through props
- Events flow up through callbacks
- Use React Context for global state (Window Manager, Desktop)
- Avoid prop drilling beyond 2-3 levels

## Module Structure

### Core Modules (`/core`)

These modules provide foundational services:

```
core/
├── window-manager/     # Window state and operations
├── file-system/        # Virtual file system
├── ai-engine/          # AI service abstraction
└── hooks/              # Shared React hooks
```

**Rules**:
- Core modules must NOT import from `/apps` or `/src`
- Core modules may import from other core modules
- Core modules must export clean, documented APIs
- Core modules must be framework-agnostic (except React hooks)

### Application Modules (`/apps`)

These modules implement specific applications:

```
apps/
├── notepad/           # Notepad application
├── explorer/          # File Explorer application
└── start-menu/        # Start Menu component
```

**Rules**:
- Apps must import services from `/core`
- Apps must NOT directly call AI APIs or file system APIs
- Apps must use Window Manager for window operations
- Apps must be self-contained (no cross-app imports)

### UI Components (`/src`)

These are shared UI components and the main app shell:

```
src/
├── components/        # Shared UI components
├── App.tsx           # Root application component
└── index.tsx         # Entry point
```

**Rules**:
- Components must be presentational (dumb components)
- Components receive data via props
- Components emit events via callbacks
- No business logic in components

## AI Engine Integration

### ✅ Correct Pattern

```typescript
// In Notepad component
import { aiClient } from '@/core/ai-engine/aiClient';

async function handleSummarize() {
  try {
    const summary = await aiClient.summarize(content);
    setSummary(summary);
  } catch (error) {
    showError('Failed to summarize');
  }
}
```

### ❌ Incorrect Pattern

```typescript
// DON'T: Direct API calls in components
import OpenAI from 'openai';

async function handleSummarize() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
  const response = await openai.chat.completions.create({...});
  // ...
}
```

**Why**: Direct API calls create tight coupling, make testing difficult, and bypass caching/usage tracking.

## VFS Integration

### ✅ Correct Pattern

```typescript
// In Explorer component
import { vfs } from '@/core/file-system/vfs';

function loadFolder(path: string) {
  try {
    const items = vfs.readFolder(path);
    setFileList(items);
  } catch (error) {
    showError(`Failed to load folder: ${path}`);
  }
}
```

### ❌ Incorrect Pattern

```typescript
// DON'T: Direct localStorage access
function loadFolder(path: string) {
  const data = localStorage.getItem('files');
  const files = JSON.parse(data);
  // ...
}
```

**Why**: Direct storage access bypasses the VFS abstraction, breaks event emission, and makes testing impossible.

## Window Manager Integration

### ✅ Correct Pattern

```typescript
// In Start Menu component
import { useWindowManager } from '@/core/window-manager/WindowContext';

function StartMenu() {
  const { openWindow } = useWindowManager();
  
  function handleAppLaunch(appId: string) {
    openWindow(appId);
  }
  
  return <MenuItem onClick={() => handleAppLaunch('notepad')}>Notepad</MenuItem>;
}
```

### ❌ Incorrect Pattern

```typescript
// DON'T: Direct window manipulation
function StartMenu() {
  function handleAppLaunch(appId: string) {
    const window = document.createElement('div');
    window.className = 'window';
    document.body.appendChild(window);
    // ...
  }
}
```

**Why**: Direct DOM manipulation bypasses state management, breaks window tracking, and prevents proper cleanup.

## State Management

### Component State (useState)
Use for:
- Local UI state (open/closed, selected item)
- Form inputs
- Temporary data

### Context State (React Context)
Use for:
- Window Manager state
- Desktop state (Start Menu open/closed)
- Theme/settings

### Module State (Singleton)
Use for:
- VFS state
- AI Engine cache
- Usage statistics

**Rule**: Never mix state management approaches for the same data.

## Event Handling

### VFS Events

```typescript
// Subscribe to VFS events
vfs.on('fileCreated', (event) => {
  console.log('File created:', event.path);
  refreshFileList();
});

// Clean up on unmount
useEffect(() => {
  const handler = (event) => refreshFileList();
  vfs.on('fileCreated', handler);
  
  return () => vfs.off('fileCreated', handler);
}, []);
```

### Window Manager Events

```typescript
// Use context callbacks
const { onWindowClose } = useWindowManager();

useEffect(() => {
  return () => {
    // Cleanup on unmount
    onWindowClose(windowId);
  };
}, [windowId]);
```

## Error Handling

### Layers of Error Handling

1. **Core Module Layer**: Catch and log errors, return safe defaults
2. **Application Layer**: Catch errors from core modules, show user-friendly messages
3. **UI Layer**: Display error messages in Win95-style dialogs

### Example

```typescript
// Core module (AI Engine)
async summarize(text: string): Promise<string> {
  try {
    return await this.provider.summarize(text);
  } catch (error) {
    console.error('AI summarize failed:', error);
    return 'Summary unavailable';
  }
}

// Application (Notepad)
async function handleSummarize() {
  try {
    const summary = await aiClient.summarize(content);
    setSummary(summary);
  } catch (error) {
    showErrorDialog('Failed to generate summary. Please try again.');
  }
}

// UI (ErrorDialog component)
function ErrorDialog({ message, onClose }) {
  return (
    <Dialog title="Error">
      <p>{message}</p>
      <Button onClick={onClose}>OK</Button>
    </Dialog>
  );
}
```

## Testing Strategy

### Unit Tests
- Test core modules in isolation
- Mock dependencies
- Test error cases

### Integration Tests
- Test module interactions
- Use in-memory implementations (mock VFS, mock AI)
- Test complete user flows

### E2E Tests
- Test through the UI
- Use real implementations where possible
- Test critical paths only

## File Organization

### Import Order

```typescript
// 1. External dependencies
import React, { useState, useEffect } from 'react';

// 2. Core modules
import { aiClient } from '@/core/ai-engine/aiClient';
import { vfs } from '@/core/file-system/vfs';

// 3. Shared components
import { Button } from '@/components/Button';

// 4. Local components
import { MenuBar } from './MenuBar';

// 5. Types
import type { NotepadProps } from './types';

// 6. Styles
import './Notepad.css';
```

### File Naming

- Components: PascalCase (`Notepad.tsx`, `MenuBar.tsx`)
- Utilities: camelCase (`pathUtils.ts`, `dateFormatter.ts`)
- Types: PascalCase (`types.ts` with PascalCase exports)
- Tests: Same as source with `.test.ts` suffix

## Performance Guidelines

### Optimization Priorities

1. **Prevent unnecessary re-renders**
   - Use `React.memo` for expensive components
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers passed to children

2. **Lazy load applications**
   - Use `React.lazy` for app components
   - Load apps only when opened

3. **Debounce expensive operations**
   - Debounce AI calls (2-3 seconds)
   - Debounce VFS writes (autosave)
   - Debounce search queries

4. **Cache aggressively**
   - Cache AI responses
   - Cache VFS folder contents (with invalidation)
   - Cache computed values

### Example

```typescript
// Memoize expensive component
const FileListItem = React.memo(({ item, onClick }) => {
  return <div onClick={onClick}>{item.name}</div>;
});

// Memoize expensive calculation
const sortedFiles = useMemo(() => {
  return files.sort((a, b) => a.name.localeCompare(b.name));
}, [files]);

// Memoize callback
const handleClick = useCallback(() => {
  onFileSelect(file.id);
}, [file.id, onFileSelect]);
```

## TypeScript Guidelines

### Type Everything

```typescript
// ✅ Good: Explicit types
interface NotepadProps {
  documentId?: string;
  initialContent?: string;
}

function Notepad({ documentId, initialContent }: NotepadProps) {
  // ...
}

// ❌ Bad: Implicit any
function Notepad(props) {
  // ...
}
```

### Use Interfaces for Objects

```typescript
// ✅ Good: Interface for object shape
interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

// ❌ Bad: Type alias for simple object
type FileSystemItem = {
  id: string;
  name: string;
  type: string;
};
```

### Avoid `any`

```typescript
// ✅ Good: Specific type
function handleError(error: Error) {
  console.error(error.message);
}

// ❌ Bad: any type
function handleError(error: any) {
  console.error(error.message);
}
```

## Documentation

### Code Comments

- Document **why**, not **what**
- Explain complex algorithms
- Note any Win95-specific behavior
- Document public APIs

### JSDoc for Public APIs

```typescript
/**
 * Summarizes the provided text using AI.
 * 
 * @param text - The text to summarize (max 10,000 characters)
 * @returns A promise that resolves to the summary text
 * @throws {Error} If the text is too short or AI service fails
 * 
 * @example
 * const summary = await aiClient.summarize('Long text here...');
 * console.log(summary);
 */
async summarize(text: string): Promise<string> {
  // ...
}
```

## Security Considerations

### Input Validation

- Validate all user inputs
- Sanitize file paths (prevent directory traversal)
- Limit file sizes
- Limit AI input lengths

### API Keys

- Never commit API keys
- Use environment variables
- Provide mock mode as default

### XSS Prevention

- Sanitize user-generated content before rendering
- Use React's built-in XSS protection
- Be careful with `dangerouslySetInnerHTML`

## Checklist for New Features

Before implementing a new feature, verify:

- [ ] Does it follow the separation of concerns?
- [ ] Does it use the correct core modules (AI Engine, VFS)?
- [ ] Does it integrate with Window Manager properly?
- [ ] Does it handle errors at all layers?
- [ ] Does it follow Win95 UI guidelines?
- [ ] Is it properly typed with TypeScript?
- [ ] Does it include appropriate tests?
- [ ] Is the public API documented?
- [ ] Does it follow the file organization conventions?
- [ ] Does it avoid performance anti-patterns?

---

**Remember**: Good architecture makes the codebase maintainable, testable, and extensible. Follow these guidelines to keep Win95 Reanimated clean and professional.
