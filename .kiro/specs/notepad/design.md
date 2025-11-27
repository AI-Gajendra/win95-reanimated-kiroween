# Notepad Application Design

## Overview

The Notepad Application is a React component that renders within the Window Manager's window chrome. It provides a text editing interface with AI-augmented features, integrating with the AI Engine for summarization and rewriting capabilities, and the VFS for document persistence.

## Architecture

### Component Structure

```
Notepad
├── MenuBar
│   ├── FileMenu
│   ├── EditMenu
│   └── AIMenu
├── TextEditor (textarea)
├── SummaryPanel (conditional)
└── StatusBar
```

### Dependencies

- **AI Engine**: For summarize() and rewrite() operations
- **VFS**: For document storage and retrieval
- **Window Manager**: Receives window chrome and lifecycle events

## Components and Interfaces

### Notepad Component

```typescript
interface NotepadProps {
  documentId?: string; // Optional: open existing document
  initialContent?: string; // Optional: prefill content
}

interface NotepadState {
  content: string;
  documentId: string;
  filename: string;
  hasUnsavedChanges: boolean;
  summary: string | null;
  isLoading: boolean;
  selectedText: string;
}
```

### MenuBar Component

```typescript
interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onUndo: () => void;
  onSelectAll: () => void;
  onSummarize: () => void;
  onRewrite: (style?: string) => void;
}
```

### SummaryPanel Component

```typescript
interface SummaryPanelProps {
  summary: string;
  onClose: () => void;
}
```

### TextEditor Component

```typescript
interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange: (selectedText: string) => void;
}
```

## Data Models

### Document Model

```typescript
interface Document {
  id: string;
  filename: string;
  content: string;
  createdAt: Date;
  modifiedAt: Date;
  summary?: string;
}
```

### AI Operation Result

```typescript
interface AIOperationResult {
  success: boolean;
  data?: string;
  error?: string;
}
```

## State Management

### Local State
- Document content (controlled textarea)
- Document metadata (id, filename, unsaved flag)
- Summary text and visibility
- Loading states for AI operations
- Selected text range

### Autosave Logic
- Use useEffect with debounced content changes
- Trigger save 2 seconds after last edit
- Clear timeout on new edits
- Save immediately on window close

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (hasUnsavedChanges) {
      saveDocument();
    }
  }, 2000);
  
  return () => clearTimeout(timeoutId);
}, [content, hasUnsavedChanges]);
```

## Integration Points

### AI Engine Integration

```typescript
import { summarize, rewrite } from '@/core/ai-engine/aiClient';

async function handleSummarize() {
  if (!content.trim()) {
    showMessage('No text to summarize');
    return;
  }
  
  setIsLoading(true);
  try {
    const result = await summarize(content);
    setSummary(result);
  } catch (error) {
    showError('Failed to generate summary');
  } finally {
    setIsLoading(false);
  }
}
```

### VFS Integration

```typescript
import { readFile, writeFile } from '@/core/file-system/vfs';

async function saveDocument() {
  const doc: Document = {
    id: documentId,
    filename,
    content,
    modifiedAt: new Date(),
  };
  
  await writeFile(`/documents/${filename}`, doc);
  setHasUnsavedChanges(false);
}
```

### Window Manager Integration

The Notepad component receives props from the Window Manager:

```typescript
interface WindowContentProps {
  windowId: string;
  onRequestClose: () => void;
  onTitleChange: (title: string) => void;
}
```

## User Flows

### Summarize Text Flow

1. User clicks AI → Summarize
2. Validate content is not empty
3. Show loading indicator
4. Call AI Engine summarize()
5. Display result in Summary Panel
6. Clear summary on next edit

### Rewrite Text Flow

1. User selects text
2. User clicks AI → Rewrite → [Style]
3. Validate selection exists
4. Show loading indicator
5. Call AI Engine rewrite(selectedText, style)
6. Replace selected text with result
7. Trigger autosave

### New Document Flow

1. User clicks File → New (or Ctrl+N)
2. Check for unsaved changes
3. If unsaved, show confirmation dialog
4. Clear content and summary
5. Generate new document ID
6. Update title to "Untitled"

### Open Document Flow

1. User clicks File → Open
2. Show file picker with VFS documents
3. User selects file
4. Load content from VFS
5. Update state and title
6. Clear any existing summary

## Error Handling

### AI Operation Failures
- Catch promise rejections from AI Engine
- Display Win95-style error dialog
- Log error details to console
- Maintain document state (don't lose content)

### VFS Operation Failures
- Handle file not found errors
- Handle write permission errors
- Show user-friendly error messages
- Provide retry option

### Timeout Handling
- Implement 30-second timeout for AI operations
- Show "Operation timed out" message
- Allow user to retry or cancel

## Testing Strategy

### Unit Tests
- Text editing and state updates
- Autosave debounce logic
- Menu action handlers
- Summary panel visibility logic

### Integration Tests
- AI Engine integration (with mocked AI)
- VFS integration (with in-memory VFS)
- Window Manager integration
- Keyboard shortcut handling

### E2E Tests
- Complete document creation and editing flow
- Summarize operation with mock AI response
- Rewrite operation with text selection
- Save and load document cycle

## Performance Considerations

- Debounce autosave to avoid excessive VFS writes
- Use controlled component pattern for textarea
- Memoize menu components to prevent re-renders
- Lazy load file picker dialog

## Accessibility

- Label textarea with "Document content"
- Provide keyboard shortcuts for all menu actions
- Announce AI operation status to screen readers
- Ensure menu navigation with arrow keys
- Focus management for dialogs
