/**
 * Virtual File System (VFS)
 * 
 * Provides an in-memory file system with localStorage persistence.
 * Implements CRUD operations for files and folders.
 */

import { VFSNode, FileSystemItem, FileMetadata, VFSEvent } from './types';
import { PathUtils } from './pathUtils';
import { EventEmitter } from './eventEmitter';

/**
 * Default file system structure
 * 
 * Structure format:
 * - Objects with no string values represent folders
 * - String values represent file contents
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
const DEFAULT_STRUCTURE: Record<string, any> = {
  'documents': {
    'readme.txt': 'Welcome to Win95 Reanimated!\n\nThis is a demo file system running entirely in your browser.\n\nFeel free to create, edit, and organize files just like in the classic Windows 95.',
    'notes.txt': 'My notes:\n\n- Build awesome retro apps\n- Add AI features for text analysis\n- Recreate the nostalgic Win95 experience\n- Have fun coding!',
    'work': {}
  },
  'pictures': {
    'sample.txt': 'Image files would go here in a real file system.\n\nFor this demo, we\'re using text files to keep things simple.'
  },
  'programs': {}
};

class VirtualFileSystem {
  private root: VFSNode;
  private nodeCache: Map<string, VFSNode>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.nodeCache = new Map();
    this.eventEmitter = new EventEmitter();
    
    // Initialize root as a placeholder (will be set by loadFromStorage or initializeDefault)
    this.root = this.createRootNode();
    
    // Try to load from storage, otherwise initialize with defaults
    if (!this.loadFromStorage()) {
      this.initializeDefault();
    }
  }

  /**
   * Create the root folder node
   * Requirements: 1.1
   */
  private createRootNode(): VFSNode {
    return {
      id: this.generateId(),
      name: '/',
      path: '/',
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parent: null,
      children: new Map()
    };
  }

  /**
   * Initialize default file system structure
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private initializeDefault(): void {
    // Create root folder
    this.root = this.createRootNode();
    this.nodeCache.set('/', this.root);

    // Build tree from default structure
    this.buildTreeFromStructure(DEFAULT_STRUCTURE, this.root, '/');

    // Save to localStorage
    this.saveToStorage();
  }

  /**
   * Recursively build tree from structure object
   * Requirements: 1.5
   * 
   * @param structure - Object representing folder/file structure
   * @param parent - Parent node to attach children to
   * @param parentPath - Path of the parent node
   */
  private buildTreeFromStructure(
    structure: Record<string, any>,
    parent: VFSNode,
    parentPath: string
  ): void {
    for (const [name, value] of Object.entries(structure)) {
      const nodePath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
      
      if (typeof value === 'string') {
        // It's a file - create file node
        const fileNode: VFSNode = {
          id: this.generateId(),
          name,
          path: nodePath,
          type: 'file',
          content: value,
          size: value.length,
          createdAt: new Date(),
          modifiedAt: new Date(),
          parent
        };
        
        parent.children!.set(name, fileNode);
        this.nodeCache.set(nodePath, fileNode);
      } else {
        // It's a folder - create folder node and recurse
        const folderNode: VFSNode = {
          id: this.generateId(),
          name,
          path: nodePath,
          type: 'folder',
          createdAt: new Date(),
          modifiedAt: new Date(),
          parent,
          children: new Map()
        };
        
        parent.children!.set(name, folderNode);
        this.nodeCache.set(nodePath, folderNode);
        
        // Recursively build children
        this.buildTreeFromStructure(value, folderNode, nodePath);
      }
    }
  }

  /**
   * Read folder contents
   */
  readFolder(path: string): FileSystemItem[] {
    const normalizedPath = PathUtils.normalize(path);
    const node = this.resolveNode(normalizedPath);

    if (!node) {
      throw new Error(`Folder not found: ${path}`);
    }

    if (node.type !== 'folder') {
      throw new Error(`Not a folder: ${path}`);
    }

    const items: FileSystemItem[] = [];

    if (node.children) {
      for (const [, child] of node.children) {
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
    }

    // Sort: folders first, then alphabetically
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Read file contents
   */
  readFile(path: string): string {
    const normalizedPath = PathUtils.normalize(path);
    const node = this.resolveNode(normalizedPath);

    if (!node) {
      throw new Error(`File not found: ${path}`);
    }

    if (node.type !== 'file') {
      throw new Error(`Not a file: ${path}`);
    }

    return node.content || '';
  }

  /**
   * Write file contents (create or update)
   */
  writeFile(path: string, content: string): void {
    const normalizedPath = PathUtils.normalize(path);
    let node = this.resolveNode(normalizedPath);
    const isNew = !node;

    if (isNew) {
      // Create new file
      const parentPath = PathUtils.dirname(normalizedPath);
      const name = PathUtils.basename(normalizedPath);

      // Ensure parent exists
      this.ensureFolder(parentPath);
      const parent = this.resolveNode(parentPath)!;

      node = {
        id: this.generateId(),
        name,
        path: normalizedPath,
        type: 'file',
        content,
        size: content.length,
        createdAt: new Date(),
        modifiedAt: new Date(),
        parent
      };

      parent.children!.set(name, node);
      this.nodeCache.set(normalizedPath, node);

      this.emit('fileCreated', { path: normalizedPath, timestamp: new Date() });
    } else {
      // Update existing file
      if (node.type !== 'file') {
        throw new Error(`Not a file: ${path}`);
      }

      node.content = content;
      node.size = content.length;
      node.modifiedAt = new Date();

      this.emit('fileModified', { path: normalizedPath, timestamp: new Date() });
    }

    this.saveToStorage();
  }

  /**
   * Create a folder
   */
  createFolder(path: string): void {
    const normalizedPath = PathUtils.normalize(path);

    if (this.exists(normalizedPath)) {
      throw new Error(`Folder already exists: ${path}`);
    }

    const parentPath = PathUtils.dirname(normalizedPath);
    const name = PathUtils.basename(normalizedPath);

    // Ensure parent exists
    this.ensureFolder(parentPath);
    const parent = this.resolveNode(parentPath)!;

    const node: VFSNode = {
      id: this.generateId(),
      name,
      path: normalizedPath,
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parent,
      children: new Map()
    };

    parent.children!.set(name, node);
    this.nodeCache.set(normalizedPath, node);

    this.emit('folderCreated', { path: normalizedPath, timestamp: new Date() });
    this.saveToStorage();
  }

  /**
   * Delete a file or folder
   */
  deleteItem(path: string): void {
    const normalizedPath = PathUtils.normalize(path);
    const node = this.resolveNode(normalizedPath);

    if (!node) {
      throw new Error(`Item not found: ${path}`);
    }

    if (!node.parent) {
      throw new Error('Cannot delete root folder');
    }

    // Remove from parent
    node.parent.children!.delete(node.name);
    node.parent.modifiedAt = new Date();

    // Clear from cache
    this.clearCache(node);

    const eventType = node.type === 'file' ? 'fileDeleted' : 'folderDeleted';
    this.emit(eventType, { path: normalizedPath, timestamp: new Date() });

    this.saveToStorage();
  }

  /**
   * Rename a file or folder
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  renameItem(oldPath: string, newName: string): void {
    const normalizedOldPath = PathUtils.normalize(oldPath);
    const node = this.resolveNode(normalizedOldPath);

    if (!node) {
      throw new Error(`Item not found: ${oldPath}`);
    }

    if (!node.parent) {
      throw new Error('Cannot rename root folder');
    }

    // Check for conflicts in parent folder
    if (node.parent.children!.has(newName)) {
      throw new Error(`Name already exists: ${newName}`);
    }

    // Remove from parent with old name
    node.parent.children!.delete(node.name);

    // Update node name
    node.name = newName;
    const newPath = PathUtils.join(PathUtils.dirname(normalizedOldPath), newName);
    
    // Update paths recursively (handles both files and folders with children)
    this.updatePaths(node, newPath);

    // Add back to parent with new name
    node.parent.children!.set(newName, node);
    
    // Update modifiedAt timestamp
    node.modifiedAt = new Date();

    // Emit appropriate event based on item type
    const eventType = node.type === 'file' ? 'fileModified' : 'folderModified';
    this.emit(eventType, { path: newPath, timestamp: new Date() });

    this.saveToStorage();
  }

  /**
   * Move a file or folder to a new location
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   * 
   * @param sourcePath - Path of the item to move
   * @param destPath - Destination path (parent folder where item will be moved)
   */
  moveItem(sourcePath: string, destPath: string): void {
    const normalizedSourcePath = PathUtils.normalize(sourcePath);
    const normalizedDestPath = PathUtils.normalize(destPath);

    // Resolve source node
    const sourceNode = this.resolveNode(normalizedSourcePath);
    if (!sourceNode) {
      throw new Error(`Item not found: ${sourcePath}`);
    }

    if (!sourceNode.parent) {
      throw new Error('Cannot move root folder');
    }

    // Resolve destination parent node
    const destParent = this.resolveNode(normalizedDestPath);
    if (!destParent) {
      throw new Error(`Destination not found: ${destPath}`);
    }

    if (destParent.type !== 'folder') {
      throw new Error(`Destination is not a folder: ${destPath}`);
    }

    // Prevent moving a folder into itself or its descendants
    if (sourceNode.type === 'folder') {
      const destPathWithSlash = normalizedDestPath === '/' ? '/' : normalizedDestPath + '/';
      const sourcePathWithSlash = normalizedSourcePath + '/';
      if (normalizedDestPath === normalizedSourcePath || destPathWithSlash.startsWith(sourcePathWithSlash)) {
        throw new Error('Cannot move a folder into itself or its descendants');
      }
    }

    // Check for conflicts at destination
    if (destParent.children!.has(sourceNode.name)) {
      throw new Error(`Destination already exists: ${PathUtils.join(normalizedDestPath, sourceNode.name)}`);
    }

    // Store reference to source parent for modifiedAt update
    const sourceParent = sourceNode.parent;

    // Remove node from source parent
    sourceParent.children!.delete(sourceNode.name);

    // Update source parent's modifiedAt timestamp
    sourceParent.modifiedAt = new Date();

    // Add node to destination parent
    destParent.children!.set(sourceNode.name, sourceNode);
    sourceNode.parent = destParent;

    // Update destination parent's modifiedAt timestamp
    destParent.modifiedAt = new Date();

    // Calculate new path for the moved item
    const newPath = normalizedDestPath === '/' 
      ? `/${sourceNode.name}` 
      : `${normalizedDestPath}/${sourceNode.name}`;

    // Update node path and all child paths recursively (also updates nodeCache)
    this.updatePaths(sourceNode, newPath);

    // Update item's modifiedAt timestamp
    sourceNode.modifiedAt = new Date();

    // Emit appropriate event based on item type
    const eventType = sourceNode.type === 'file' ? 'fileModified' : 'folderModified';
    this.emit(eventType, { path: newPath, timestamp: new Date() });

    this.saveToStorage();
  }

  /**
   * Check if a path exists
   */
  exists(path: string): boolean {
    const normalizedPath = PathUtils.normalize(path);
    return this.resolveNode(normalizedPath) !== null;
  }

  /**
   * Get metadata for a file or folder
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   */
  getMetadata(path: string): FileMetadata {
    const normalizedPath = PathUtils.normalize(path);
    const node = this.resolveNode(normalizedPath);

    if (!node) {
      throw new Error(`Item not found: ${path}`);
    }

    return {
      name: node.name,
      path: node.path,
      type: node.type,
      size: node.size || 0,
      createdAt: node.createdAt.toISOString(),
      modifiedAt: node.modifiedAt.toISOString()
    };
  }

  /**
   * Subscribe to VFS events
   */
  on(event: string, callback: Function): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from VFS events
   */
  off(event: string, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  // Private helper methods

  private resolveNode(path: string): VFSNode | null {
    // Check cache first
    if (this.nodeCache.has(path)) {
      return this.nodeCache.get(path)!;
    }

    // Traverse tree
    const parts = PathUtils.split(path);
    let current = this.root;

    for (const part of parts) {
      if (!current.children || !current.children.has(part)) {
        return null;
      }
      current = current.children.get(part)!;
    }

    // Cache result
    this.nodeCache.set(path, current);
    return current;
  }

  private ensureFolder(path: string): void {
    if (path === '/' || this.exists(path)) {
      return;
    }

    const parentPath = PathUtils.dirname(path);
    this.ensureFolder(parentPath);

    this.createFolder(path);
  }

  private clearCache(node: VFSNode): void {
    this.nodeCache.delete(node.path);

    if (node.type === 'folder' && node.children) {
      for (const child of node.children.values()) {
        this.clearCache(child);
      }
    }
  }

  private updatePaths(node: VFSNode, newPath: string): void {
    // Remove old path from cache
    this.nodeCache.delete(node.path);

    // Update node path
    node.path = newPath;

    // Add new path to cache
    this.nodeCache.set(newPath, node);

    // Update children recursively
    if (node.type === 'folder' && node.children) {
      for (const child of node.children.values()) {
        const childNewPath = PathUtils.join(newPath, child.name);
        this.updatePaths(child, childNewPath);
      }
    }
  }

  private rebuildCache(node: VFSNode): void {
    this.nodeCache.set(node.path, node);

    if (node.type === 'folder' && node.children) {
      for (const child of node.children.values()) {
        this.rebuildCache(child);
      }
    }
  }

  private emit(event: string, data: VFSEvent): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * Get icon name based on file type
   * Requirements: 2.4
   * 
   * @param node - The VFS node to get icon for
   * @returns Icon name string for the file type
   */
  private getIcon(node: VFSNode): string {
    if (node.type === 'folder') {
      return 'folder';
    }

    const ext = this.getExtension(node.name);
    
    // Map file extensions to appropriate icons (Win95 style)
    const iconMap: Record<string, string> = {
      // Text files
      'txt': 'text-file',
      'md': 'text-file',
      'log': 'text-file',
      'rtf': 'text-file',
      
      // Code files
      'js': 'code-file',
      'ts': 'code-file',
      'jsx': 'code-file',
      'tsx': 'code-file',
      'json': 'code-file',
      'html': 'code-file',
      'htm': 'code-file',
      'css': 'code-file',
      'xml': 'code-file',
      
      // Image files
      'bmp': 'image-file',
      'gif': 'image-file',
      'jpg': 'image-file',
      'jpeg': 'image-file',
      'png': 'image-file',
      'ico': 'image-file',
      
      // Executable files
      'exe': 'executable-file',
      'com': 'executable-file',
      'bat': 'executable-file',
      'cmd': 'executable-file',
      
      // System files
      'dll': 'system-file',
      'sys': 'system-file',
      'ini': 'system-file',
      'cfg': 'system-file',
      
      // Document files
      'doc': 'document-file',
      'pdf': 'document-file',
      
      // Archive files
      'zip': 'archive-file',
      'rar': 'archive-file',
      
      // Audio files
      'wav': 'audio-file',
      'mid': 'audio-file',
      'mp3': 'audio-file',
      
      // Video files
      'avi': 'video-file',
      'mpg': 'video-file',
      'mpeg': 'video-file',
    };

    return iconMap[ext] || 'file';
  }

  /**
   * Extract file extension from filename
   * Requirements: 2.4
   * 
   * @param filename - The filename to extract extension from
   * @returns Extension without dot (lowercase), or empty string if no extension
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    // Return empty string if no dot found or dot is at the start (hidden files like .gitignore)
    if (lastDot === -1 || lastDot === 0) return '';
    return filename.substring(lastDot + 1).toLowerCase();
  }

  /**
   * Generate a unique ID for VFS nodes
   * Requirements: All create operations
   * 
   * Uses timestamp combined with random string to ensure uniqueness
   * even when multiple nodes are created in rapid succession.
   * 
   * @returns Unique identifier string
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Persistence methods

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
      if (node.children) {
        for (const [name, child] of node.children) {
          obj.children[name] = this.serialize(child);
        }
      }
    }

    return obj;
  }

  private deserialize(obj: any, parent: VFSNode | null = null): VFSNode {
    const node: VFSNode = {
      id: obj.id,
      name: obj.name,
      path: obj.path,
      type: obj.type,
      createdAt: new Date(obj.createdAt),
      modifiedAt: new Date(obj.modifiedAt),
      parent
    };

    if (obj.type === 'file') {
      node.content = obj.content;
      node.size = obj.size;
    } else {
      node.children = new Map();
      if (obj.children) {
        for (const [name, childObj] of Object.entries(obj.children)) {
          const child = this.deserialize(childObj, node);
          node.children.set(name, child);
        }
      }
    }

    return node;
  }
}

// Create singleton instance
const vfs = new VirtualFileSystem();

// Export singleton as named export
export { vfs };

// Export singleton as default export
export default vfs;

// Export class for testing
export { VirtualFileSystem };

// Re-export TypeScript interfaces for convenience
export type { VFSNode, FileSystemItem, FileMetadata, VFSEvent } from './types';

// Re-export utilities for advanced usage
export { PathUtils } from './pathUtils';
export { EventEmitter } from './eventEmitter';
