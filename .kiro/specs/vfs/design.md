# Virtual File System (VFS) Design

## Overview

The VFS is implemented as a TypeScript module that maintains an in-memory tree structure representing the file system. It provides a synchronous API for file operations and uses localStorage for persistence across sessions.

## Architecture

### Data Structure

The VFS uses a tree structure where each node represents either a file or folder:

```typescript
interface VFSNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  createdAt: Date;
  modifiedAt: Date;
  parent: VFSNode | null;
  
  // File-specific
  content?: string;
  size?: number;
  
  // Folder-specific
  children?: Map<string, VFSNode>;
}
```

### Core Class

```typescript
class VirtualFileSystem {
  private root: VFSNode;
  private nodeCache: Map<string, VFSNode>;
  private eventEmitter: EventEmitter;
  
  constructor() {
    this.loadFromStorage() || this.initializeDefault();
  }
  
  // Public API methods
  readFolder(path: string): FileSystemItem[];
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  createFolder(path: string): void;
  deleteItem(path: string): void;
  renameItem(oldPath: string, newName: string): void;
  moveItem(sourcePath: string, destPath: string): void;
  exists(path: string): boolean;
  getMetadata(path: string): FileMetadata;
  
  // Event subscription
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}
```

## Components and Interfaces

### Public API Types

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

interface FileMetadata {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

interface VFSEvent {
  type: 'fileCreated' | 'fileModified' | 'fileDeleted' | 'folderCreated' | 'folderDeleted';
  path: string;
  timestamp: Date;
}
```

### Path Utilities

```typescript
class PathUtils {
  static normalize(path: string): string;
  static join(...parts: string[]): string;
  static dirname(path: string): string;
  static basename(path: string): string;
  static split(path: string): string[];
  static isAbsolute(path: string): boolean;
}
```

## Data Models

### Default File System Structure

```typescript
const DEFAULT_STRUCTURE = {
  '/': {
    'documents': {
      'readme.txt': 'Welcome to Win95 Reanimated!\n\nThis is a demo file system.',
      'notes.txt': 'My notes:\n- Build awesome retro apps\n- Add AI features\n- Have fun!',
      'work': {}
    },
    'pictures': {
      'sample.txt': 'Image files would go here'
    },
    'programs': {}
  }
};
```

## Core Operations

### Path Resolution

```typescript
private resolveNode(path: string): VFSNode | null {
  // Check cache first
  if (this.nodeCache.has(path)) {
    return this.nodeCache.get(path);
  }
  
  // Traverse tree
  const parts = PathUtils.split(path);
  let current = this.root;
  
  for (const part of parts) {
    if (!current.children || !current.children.has(part)) {
      return null;
    }
    current = current.children.get(part);
  }
  
  // Cache result
  this.nodeCache.set(path, current);
  return current;
}
```

### Read Operations

```typescript
readFolder(path: string): FileSystemItem[] {
  const node = this.resolveNode(path);
  
  if (!node) {
    throw new Error(`Folder not found: ${path}`);
  }
  
  if (node.type !== 'folder') {
    throw new Error(`Not a folder: ${path}`);
  }
  
  const items: FileSystemItem[] = [];
  
  for (const [name, child] of node.children) {
    items.push({
      id: child.id,
      name: child.name,
      path: child.path,
      type: child.type,
      size: child.size || 0,
      modifiedAt: child.modifiedAt,
      icon: this.getIcon(child),
      extension: child.type === 'file' ? this.getExtension(child.name) : undefined
    });
  }
  
  return items.sort((a, b) => {
    // Folders first, then alphabetical
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

readFile(path: string): string {
  const node = this.resolveNode(path);
  
  if (!node) {
    throw new Error(`File not found: ${path}`);
  }
  
  if (node.type !== 'file') {
    throw new Error(`Not a file: ${path}`);
  }
  
  return node.content || '';
}
```

### Write Operations

```typescript
writeFile(path: string, content: string): void {
  let node = this.resolveNode(path);
  const isNew = !node;
  
  if (isNew) {
    // Create new file
    const parentPath = PathUtils.dirname(path);
    const name = PathUtils.basename(path);
    
    // Ensure parent exists
    this.ensureFolder(parentPath);
    const parent = this.resolveNode(parentPath);
    
    node = {
      id: this.generateId(),
      name,
      path,
      type: 'file',
      content,
      size: content.length,
      createdAt: new Date(),
      modifiedAt: new Date(),
      parent
    };
    
    parent.children.set(name, node);
    this.nodeCache.set(path, node);
    
    this.emit('fileCreated', { path, timestamp: new Date() });
  } else {
    // Update existing file
    if (node.type !== 'file') {
      throw new Error(`Not a file: ${path}`);
    }
    
    node.content = content;
    node.size = content.length;
    node.modifiedAt = new Date();
    
    this.emit('fileModified', { path, timestamp: new Date() });
  }
  
  this.saveToStorage();
}

createFolder(path: string): void {
  if (this.exists(path)) {
    throw new Error(`Folder already exists: ${path}`);
  }
  
  const parentPath = PathUtils.dirname(path);
  const name = PathUtils.basename(path);
  
  // Ensure parent exists
  this.ensureFolder(parentPath);
  const parent = this.resolveNode(parentPath);
  
  const node: VFSNode = {
    id: this.generateId(),
    name,
    path,
    type: 'folder',
    createdAt: new Date(),
    modifiedAt: new Date(),
    parent,
    children: new Map()
  };
  
  parent.children.set(name, node);
  this.nodeCache.set(path, node);
  
  this.emit('folderCreated', { path, timestamp: new Date() });
  this.saveToStorage();
}
```

### Delete Operations

```typescript
deleteItem(path: string): void {
  const node = this.resolveNode(path);
  
  if (!node) {
    throw new Error(`Item not found: ${path}`);
  }
  
  if (!node.parent) {
    throw new Error('Cannot delete root folder');
  }
  
  // Remove from parent
  node.parent.children.delete(node.name);
  node.parent.modifiedAt = new Date();
  
  // Clear from cache (recursively for folders)
  this.clearCache(node);
  
  const eventType = node.type === 'file' ? 'fileDeleted' : 'folderDeleted';
  this.emit(eventType, { path, timestamp: new Date() });
  
  this.saveToStorage();
}

private clearCache(node: VFSNode): void {
  this.nodeCache.delete(node.path);
  
  if (node.type === 'folder' && node.children) {
    for (const child of node.children.values()) {
      this.clearCache(child);
    }
  }
}
```

## Persistence

### LocalStorage Integration

```typescript
private saveToStorage(): void {
  try {
    const serialized = this.serialize(this.root);
    localStorage.setItem('vfs-data', JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save VFS to localStorage:', error);
  }
}

private loadFromStorage(): boolean {
  try {
    const data = localStorage.getItem('vfs-data');
    if (!data) return false;
    
    const serialized = JSON.parse(data);
    this.root = this.deserialize(serialized);
    this.rebuildCache(this.root);
    
    return true;
  } catch (error) {
    console.error('Failed to load VFS from localStorage:', error);
    return false;
  }
}

private serialize(node: VFSNode): any {
  const obj: any = {
    id: node.id,
    name: node.name,
    path: node.path,
    type: node.type,
    createdAt: node.createdAt.toISOString(),
    modifiedAt: node.modifiedAt.toISOString()
  };
  
  if (node.type === 'file') {
    obj.content = node.content;
    obj.size = node.size;
  } else {
    obj.children = {};
    for (const [name, child] of node.children) {
      obj.children[name] = this.serialize(child);
    }
  }
  
  return obj;
}
```

## Event System

### Event Emitter

```typescript
class EventEmitter {
  private listeners: Map<string, Set<Function>>;
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  
  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
  
  emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data);
      }
    }
  }
}
```

## Error Handling

### Custom Errors

```typescript
class VFSError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VFSError';
  }
}

// Error codes
const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_PATH: 'INVALID_PATH',
  NOT_A_FILE: 'NOT_A_FILE',
  NOT_A_FOLDER: 'NOT_A_FOLDER',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
};
```

## Testing Strategy

### Unit Tests
- Path utilities (normalize, join, split)
- Node resolution and caching
- CRUD operations on files and folders
- Event emission
- Serialization and deserialization

### Integration Tests
- Complete file lifecycle (create, read, update, delete)
- Folder operations with nested structures
- localStorage persistence
- Event listener integration

## Performance Considerations

- Use Map for O(1) child lookups
- Cache resolved nodes to avoid repeated traversals
- Debounce localStorage saves (optional)
- Limit tree depth to prevent stack overflow
- Use lazy loading for large folder structures (future enhancement)

## Singleton Pattern

Export a singleton instance for global access:

```typescript
export const vfs = new VirtualFileSystem();

// Also export class for testing
export { VirtualFileSystem };
```
