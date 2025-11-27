/**
 * Virtual File System (VFS)
 * 
 * Provides an in-memory file system with localStorage persistence.
 * Implements CRUD operations for files and folders.
 */

import { VFSNode, FileSystemItem, FileMetadata, VFSEvent } from './types';
import { PathUtils } from './pathUtils';
import { EventEmitter } from './eventEmitter';

class VirtualFileSystem {
  private root: VFSNode;
  private nodeCache: Map<string, VFSNode>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.nodeCache = new Map();
    this.eventEmitter = new EventEmitter();
    
    // Try to load from storage, otherwise initialize with defaults
    if (!this.loadFromStorage()) {
      this.initializeDefault();
    }
  }

  /**
   * Initialize default file system structure
   */
  private initializeDefault(): void {
    // Create root folder
    this.root = {
      id: this.generateId(),
      name: '/',
      path: '/',
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parent: null,
      children: new Map()
    };

    this.nodeCache.set('/', this.root);

    // Create default folders and files
    this.createFolder('/documents');
    this.createFolder('/pictures');
    this.createFolder('/programs');
    this.createFolder('/documents/work');

    // Create sample files
    this.writeFile(
      '/documents/readme.txt',
      'Welcome to Win95 Reanimated!\n\nThis is a demo file system running entirely in your browser.\n\nFeel free to create, edit, and organize files just like in the classic Windows 95.'
    );

    this.writeFile(
      '/documents/notes.txt',
      'My notes:\n\n- Build awesome retro apps\n- Add AI features for text analysis\n- Recreate the nostalgic Win95 experience\n- Have fun coding!'
    );

    this.writeFile(
      '/pictures/sample.txt',
      'Image files would go here in a real file system.\n\nFor this demo, we\'re using text files to keep things simple.'
    );

    // Save to localStorage
    this.saveToStorage();
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

    // Check for conflicts
    if (node.parent.children!.has(newName)) {
      throw new Error(`Name already exists: ${newName}`);
    }

    // Remove from parent with old name
    node.parent.children!.delete(node.name);

    // Update node
    const oldName = node.name;
    node.name = newName;
    const newPath = PathUtils.join(PathUtils.dirname(normalizedOldPath), newName);
    
    // Update paths recursively
    this.updatePaths(node, newPath);

    // Add back to parent with new name
    node.parent.children!.set(newName, node);
    node.modifiedAt = new Date();

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
      createdAt: node.createdAt,
      modifiedAt: node.modifiedAt
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

  private getIcon(node: VFSNode): string {
    if (node.type === 'folder') {
      return 'folder';
    }

    const ext = this.getExtension(node.name);
    const iconMap: Record<string, string> = {
      'txt': 'text-file',
      'md': 'text-file',
      'js': 'code-file',
      'ts': 'code-file',
      'json': 'code-file',
      'html': 'code-file',
      'css': 'code-file',
    };

    return iconMap[ext] || 'file';
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return '';
    return filename.substring(lastDot + 1).toLowerCase();
  }

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

// Export singleton instance
export const vfs = new VirtualFileSystem();

// Also export class for testing
export { VirtualFileSystem };
