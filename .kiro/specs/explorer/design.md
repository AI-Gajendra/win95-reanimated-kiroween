# Explorer Application Design

## Overview

The Explorer Application is a React component that provides a dual-pane file management interface within the Window Manager. It integrates with the VFS for file operations and the AI Engine for intelligent folder analysis and recommendations.

## Architecture

### Component Structure

```
Explorer
├── Toolbar
│   ├── BackButton
│   ├── ForwardButton
│   ├── UpButton
│   └── AddressBar
├── SplitPane
│   ├── FolderTree
│   │   └── TreeNode[] (recursive)
│   └── FileList
│       ├── FileListItem[]
│       └── ContextMenu (conditional)
├── ExplanationPanel (conditional)
└── StatusBar
```

### Dependencies

- **VFS**: For file system operations (read, write, delete, rename, create)
- **AI Engine**: For explainFolder() operation
- **Window Manager**: Receives window chrome and lifecycle events

## Components and Interfaces

### Explorer Component

```typescript
interface ExplorerProps {
  initialPath?: string; // Optional: start at specific path
}

interface ExplorerState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  selectedItem: FileSystemItem | null;
  contextMenuPosition: { x: number; y: number } | null;
  explanation: FolderExplanation | null;
  isLoading: boolean;
  viewMode: 'list' | 'icons';
}
```

### FolderTree Component

```typescript
interface FolderTreeProps {
  rootPath: string;
  currentPath: string;
  onFolderSelect: (path: string) => void;
}

interface TreeNodeProps {
  folder: FolderItem;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}
```

### FileList Component

```typescript
interface FileListProps {
  items: FileSystemItem[];
  viewMode: 'list' | 'icons';
  selectedItem: FileSystemItem | null;
  onItemClick: (item: FileSystemItem) => void;
  onItemDoubleClick: (item: FileSystemItem) => void;
  onContextMenu: (item: FileSystemItem, position: { x: number; y: number }) => void;
}

interface FileListItemProps {
  item: FileSystemItem;
  isSelected: boolean;
  viewMode: 'list' | 'icons';
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}
```

### ContextMenu Component

```typescript
interface ContextMenuProps {
  position: { x: number; y: number };
  item: FileSystemItem | null;
  onClose: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onExplain: () => void;
  onNewFolder: () => void;
}
```

### ExplanationPanel Component

```typescript
interface ExplanationPanelProps {
  explanation: FolderExplanation;
  onClose: () => void;
}

interface FolderExplanation {
  description: string;
  recommendations: string[];
  folderPath: string;
}
```

## Data Models

### FileSystemItem

```typescript
interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modifiedAt: Date;
  icon: string;
  extension?: string;
}

interface FolderItem extends FileSystemItem {
  type: 'folder';
  children?: FileSystemItem[];
  isExpanded?: boolean;
}

interface FileItem extends FileSystemItem {
  type: 'file';
  content?: string;
}
```

### Navigation History

```typescript
interface NavigationHistory {
  paths: string[];
  currentIndex: number;
}
```

## State Management

### Navigation State
- Current path
- History stack (array of paths)
- History index (for back/forward)
- Selected item

### UI State
- Context menu visibility and position
- Explanation panel visibility
- Loading state for AI operations
- View mode (list/icons)

### Navigation Logic

```typescript
function navigateTo(newPath: string) {
  // Truncate forward history
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newPath);
  
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
  setCurrentPath(newPath);
  loadFolderContents(newPath);
}

function navigateBack() {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCurrentPath(history[newIndex]);
    loadFolderContents(history[newIndex]);
  }
}

function navigateForward() {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCurrentPath(history[newIndex]);
    loadFolderContents(history[newIndex]);
  }
}
```

## Integration Points

### VFS Integration

```typescript
import { 
  readFolder, 
  createFolder, 
  deleteItem, 
  renameItem,
  readFile 
} from '@/core/file-system/vfs';

async function loadFolderContents(path: string) {
  try {
    const items = await readFolder(path);
    setFileListItems(items);
  } catch (error) {
    showError(`Failed to load folder: ${path}`);
  }
}

async function handleCreateFolder(parentPath: string, name: string) {
  try {
    await createFolder(`${parentPath}/${name}`);
    await loadFolderContents(parentPath);
  } catch (error) {
    showError('Failed to create folder');
  }
}
```

### AI Engine Integration

```typescript
import { explainFolder } from '@/core/ai-engine/aiClient';

async function handleExplainFolder(folderPath: string) {
  setIsLoading(true);
  
  try {
    // Gather folder data
    const items = await readFolder(folderPath);
    const filenames = items.map(item => item.name);
    
    // Sample file contents (first few files)
    const sampleContents = await Promise.all(
      items
        .filter(item => item.type === 'file')
        .slice(0, 5)
        .map(item => readFile(item.path))
    );
    
    // Call AI Engine
    const explanation = await explainFolder({
      path: folderPath,
      filenames,
      sampleContents
    });
    
    setExplanation(explanation);
  } catch (error) {
    showError('Failed to generate folder explanation');
  } finally {
    setIsLoading(false);
  }
}
```

## User Flows

### Navigate to Folder Flow

1. User clicks folder in tree or double-clicks in file list
2. Update current path
3. Add to navigation history
4. Load folder contents from VFS
5. Update file list display
6. Update address bar

### Explain Folder Flow

1. User right-clicks folder
2. Context menu appears
3. User clicks "Explain this folder"
4. Show loading indicator
5. Gather filenames and sample contents
6. Call AI Engine explainFolder()
7. Display explanation in panel
8. Show recommendations as bullet points

### Create Folder Flow

1. User right-clicks in empty space
2. Context menu appears with "New Folder"
3. User clicks "New Folder"
4. Create folder in VFS with default name
5. Enter rename mode immediately
6. User types new name and presses Enter
7. Rename folder in VFS
8. Refresh file list

### Delete Item Flow

1. User right-clicks item
2. Context menu appears
3. User clicks "Delete"
4. Show confirmation dialog
5. User confirms
6. Delete item from VFS
7. Refresh file list
8. Clear selection

## Error Handling

### VFS Operation Failures
- Handle folder not found errors
- Handle permission errors
- Handle invalid path errors
- Show Win95-style error dialogs
- Maintain current state on errors

### AI Operation Failures
- Catch promise rejections
- Display user-friendly error messages
- Log errors to console
- Maintain folder state

### Navigation Errors
- Handle invalid paths in address bar
- Validate folder exists before navigation
- Fall back to parent folder on error

## Testing Strategy

### Unit Tests
- Navigation history management
- Folder tree expand/collapse logic
- File list rendering
- Context menu positioning

### Integration Tests
- VFS integration with in-memory VFS
- AI Engine integration with mocks
- Navigation flow
- CRUD operations on files and folders

### E2E Tests
- Complete folder navigation flow
- Explain folder with mock AI response
- Create, rename, delete folder cycle
- Keyboard shortcut handling

## Performance Considerations

- Lazy load folder tree nodes (load children on expand)
- Virtualize file list for large directories
- Debounce address bar input
- Memoize file list items
- Cache folder contents for back/forward navigation

## Accessibility

- Keyboard navigation in folder tree (arrow keys, Enter)
- Keyboard navigation in file list (arrow keys, Enter, Space)
- ARIA labels for toolbar buttons
- ARIA tree role for folder tree
- ARIA listbox role for file list
- Focus management for context menu and dialogs
- Screen reader announcements for navigation
