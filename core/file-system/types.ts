/**
 * Type definitions for the Virtual File System
 */

export interface VFSNode {
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

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modifiedAt: Date;
  icon: string;
  extension?: string;
}

export interface FileMetadata {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export interface VFSEvent {
  type: 'fileCreated' | 'fileModified' | 'fileDeleted' | 'folderCreated' | 'folderDeleted' | 'folderModified';
  path: string;
  timestamp: Date;
}
