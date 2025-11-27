/**
 * Explorer Application
 * 
 * Win95-style file manager with AI augmentation capabilities.
 * Provides a dual-pane interface for navigating the Virtual File System (VFS).
 */

import React, { useState, useRef } from 'react';
import { vfs } from '@core/file-system/vfs';
import { useWindowManager } from '@core/window-manager/WindowContext';
import { aiClient } from '@core/ai-engine/aiClient';
import type { FileSystemItem } from '@core/file-system/types';

/**
 * Props for the Explorer component
 */
interface ExplorerProps {
  windowId: string;
  initialPath?: string;
}

/**
 * Internal state for the Explorer component
 */
interface ExplorerState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  selectedItem: FileSystemItem | null;
  contextMenuPosition: { x: number; y: number } | null;
  explanation: FolderExplanation | null;
  isLoading: boolean;
  viewMode: 'list' | 'icons';
  fileListItems: FileSystemItem[];
  expandedFolders: Set<string>;
}

/**
 * Folder explanation from AI Engine
 */
interface FolderExplanation {
  description: string;
  recommendations: string[];
  folderPath: string;
}

/**
 * Toolbar Component
 * Renders the navigation toolbar with Back, Forward, Up buttons and AddressBar
 */
interface ToolbarProps {
  currentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  viewMode: 'list' | 'icons';
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onNavigate: (path: string) => void;
  onViewModeToggle: () => void;
}

/**
 * TreeNode Component
 * Recursive component for rendering folder tree nodes
 */
interface TreeNodeProps {
  folder: FileSystemItem;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  expandedFolders: Set<string>;
  selectedPath: string;
  onFolderToggle: (path: string) => void;
  onFolderSelect: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(({
  folder,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  expandedFolders,
  selectedPath,
  onFolderToggle,
  onFolderSelect,
}) => {
  const [children, setChildren] = React.useState<FileSystemItem[]>([]);
  const [hasLoadedChildren, setHasLoadedChildren] = React.useState<boolean>(false);

  // Load children when expanded
  React.useEffect(() => {
    if (isExpanded && !hasLoadedChildren) {
      try {
        const items = vfs.readFolder(folder.path);
        // Filter to only show folders
        const folders = items.filter(item => item.type === 'folder');
        setChildren(folders);
        setHasLoadedChildren(true);
      } catch (error) {
        console.error('Failed to load folder children:', error);
        setChildren([]);
      }
    }
  }, [isExpanded, hasLoadedChildren, folder.path]);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Arrow Right: Expand folder
    if (e.key === 'ArrowRight' && !isExpanded) {
      e.preventDefault();
      onToggle();
    }
    // Arrow Left: Collapse folder
    else if (e.key === 'ArrowLeft' && isExpanded) {
      e.preventDefault();
      onToggle();
    }
    // Enter or Space: Select folder
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  // Calculate indentation
  const indentPx = level * 16;

  return (
    <div role="treeitem" aria-expanded={isExpanded} aria-level={level + 1} aria-selected={isSelected}>
      {/* Current folder node */}
      <div
        className={`
          flex items-center
          font-win95 text-[11px]
          cursor-pointer
          hover:bg-win95-gray
          ${isSelected ? 'bg-win95-navy text-win95-white' : 'text-win95-black'}
        `}
        style={{ paddingLeft: `${indentPx}px` }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`${folder.name} folder, ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        {/* Expand/Collapse Icon */}
        <span
          className="inline-block w-4 text-center select-none"
          onClick={handleToggleClick}
          aria-hidden="true"
        >
          {isExpanded ? '−' : '+'}
        </span>

        {/* Folder Icon and Name */}
        <div
          className="flex items-center gap-1 flex-1 py-0.5"
          onClick={handleFolderClick}
        >
          <span aria-hidden="true">📁</span>
          <span>{folder.name}</span>
        </div>
      </div>

      {/* Children (recursive) */}
      {isExpanded && children.length > 0 && (
        <div role="group">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              isExpanded={expandedFolders.has(child.path)}
              isSelected={selectedPath === child.path}
              onToggle={() => onFolderToggle(child.path)}
              onSelect={() => onFolderSelect(child.path)}
              expandedFolders={expandedFolders}
              selectedPath={selectedPath}
              onFolderToggle={onFolderToggle}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

/**
 * FolderTree Component
 * Displays the hierarchical folder structure
 */
interface FolderTreeProps {
  rootPath: string;
  currentPath: string;
  expandedFolders: Set<string>;
  onFolderToggle: (path: string) => void;
  onFolderSelect: (path: string) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  rootPath,
  currentPath,
  expandedFolders,
  onFolderToggle,
  onFolderSelect,
}) => {
  const [rootFolder, setRootFolder] = React.useState<FileSystemItem | null>(null);

  // Load root folder on mount
  React.useEffect(() => {
    try {
      const metadata = vfs.getMetadata(rootPath);
      const rootItem: FileSystemItem = {
        id: metadata.name,
        name: metadata.name === '/' ? 'Root' : metadata.name,
        path: metadata.path,
        type: metadata.type,
        size: metadata.size,
        modifiedAt: metadata.modifiedAt,
        icon: 'folder',
      };
      setRootFolder(rootItem);
    } catch (error) {
      console.error('Failed to load root folder:', error);
    }
  }, [rootPath]);

  if (!rootFolder) {
    return (
      <div className="p-2 font-win95 text-[11px] text-win95-black" role="status" aria-live="polite">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-1" role="tree" aria-label="Folder tree navigation">
      <TreeNode
        folder={rootFolder}
        level={0}
        isExpanded={expandedFolders.has(rootFolder.path)}
        isSelected={currentPath === rootFolder.path}
        onToggle={() => onFolderToggle(rootFolder.path)}
        onSelect={() => onFolderSelect(rootFolder.path)}
        expandedFolders={expandedFolders}
        selectedPath={currentPath}
        onFolderToggle={onFolderToggle}
        onFolderSelect={onFolderSelect}
      />
    </div>
  );
};

/**
 * SplitPane Component
 * Renders a two-pane layout with a draggable vertical splitter
 */
interface SplitPaneProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

const SplitPane: React.FC<SplitPaneProps> = ({ leftPane, rightPane }) => {
  const [leftWidth, setLeftWidth] = useState<number>(250); // Default 250px for left pane
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle splitter mouse down
  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle mouse move during drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;

      // Constrain width between 150px and container width - 150px
      const minWidth = 150;
      const maxWidth = containerRect.width - 150;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));

      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden">
      {/* Left Pane */}
      <div
        style={{ width: leftWidth }}
        className="bg-win95-white win95-inset m-1 overflow-auto"
      >
        {leftPane}
      </div>

      {/* Splitter */}
      <div
        className="w-1 bg-win95-gray cursor-col-resize hover:bg-win95-dark-gray"
        onMouseDown={handleSplitterMouseDown}
        style={{ cursor: isDragging ? 'col-resize' : 'col-resize' }}
      />

      {/* Right Pane */}
      <div className="flex-1 bg-win95-white win95-inset m-1 overflow-auto">
        {rightPane}
      </div>
    </div>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({
  currentPath,
  canGoBack,
  canGoForward,
  viewMode,
  onBack,
  onForward,
  onUp,
  onNavigate,
  onViewModeToggle,
}) => {
  const [addressBarValue, setAddressBarValue] = useState<string>(currentPath);

  // Update address bar when current path changes
  React.useEffect(() => {
    setAddressBarValue(currentPath);
  }, [currentPath]);

  const handleAddressBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNavigate(addressBarValue);
    }
  };

  return (
    <div className="bg-win95-gray border-b-2 border-win95-dark-gray p-1 flex items-center gap-1">
      {/* Back Button */}
      <button
        className={`
          px-3 py-1
          bg-win95-gray
          win95-outset
          font-win95
          text-[11px]
          text-win95-black
          active:win95-inset
          ${!canGoBack ? 'text-win95-dark-gray cursor-not-allowed' : ''}
        `}
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Back"
        title="Back"
      >
        ◄
      </button>

      {/* Forward Button */}
      <button
        className={`
          px-3 py-1
          bg-win95-gray
          win95-outset
          font-win95
          text-[11px]
          text-win95-black
          active:win95-inset
          ${!canGoForward ? 'text-win95-dark-gray cursor-not-allowed' : ''}
        `}
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Forward"
        title="Forward"
      >
        ►
      </button>

      {/* Up Button */}
      <button
        className="
          px-3 py-1
          bg-win95-gray
          win95-outset
          font-win95
          text-[11px]
          text-win95-black
          active:win95-inset
        "
        onClick={onUp}
        aria-label="Up"
        title="Up"
      >
        ▲
      </button>

      {/* View Mode Toggle Button */}
      <button
        className="
          px-3 py-1
          bg-win95-gray
          win95-outset
          font-win95
          text-[11px]
          text-win95-black
          active:win95-inset
        "
        onClick={onViewModeToggle}
        aria-label={`Switch to ${viewMode === 'list' ? 'icon' : 'list'} view`}
        title={`Switch to ${viewMode === 'list' ? 'icon' : 'list'} view`}
      >
        {viewMode === 'list' ? '⊞' : '☰'}
      </button>

      {/* Address Bar */}
      <div className="flex-1 flex items-center gap-1">
        <span className="font-win95 text-[11px] text-win95-black">Address:</span>
        <input
          type="text"
          value={addressBarValue}
          onChange={(e) => setAddressBarValue(e.target.value)}
          onKeyDown={handleAddressBarKeyDown}
          className="
            flex-1
            px-2
            py-1
            bg-win95-white
            text-win95-black
            font-win95
            text-[11px]
            win95-inset
            focus:outline-none
          "
          aria-label="Address bar"
        />
      </div>
    </div>
  );
};

/**
 * FileListItem Component
 * Renders a single file or folder item in the file list
 */
interface FileListItemProps {
  item: FileSystemItem;
  isSelected: boolean;
  viewMode: 'list' | 'icons';
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameComplete: () => void;
  onRenameCancel: () => void;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const FileListItem: React.FC<FileListItemProps> = React.memo(({
  item,
  isSelected,
  viewMode,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameComplete,
  onRenameCancel,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering rename mode
  React.useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (item.type === 'folder') return '';
    if (bytes === 0) return '0 KB';
    if (bytes < 1024) return '1 KB';
    const kb = Math.ceil(bytes / 1024);
    return `${kb} KB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  // Get icon for item
  const getIcon = (): string => {
    if (item.type === 'folder') return '📁';
    
    // File type icons based on extension
    const ext = item.extension?.toLowerCase();
    if (ext === '.txt') return '📄';
    if (ext === '.md') return '📝';
    if (ext === '.js' || ext === '.ts' || ext === '.tsx' || ext === '.jsx') return '📜';
    if (ext === '.json') return '📋';
    if (ext === '.html' || ext === '.css') return '🌐';
    if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.svg') return '🖼️';
    
    return '📄'; // Default file icon
  };

  // Get accessible label for item
  const getAccessibleLabel = (): string => {
    const typeLabel = item.type === 'folder' ? 'folder' : 'file';
    const sizeLabel = item.type === 'file' ? `, ${formatSize(item.size)}` : '';
    const dateLabel = `, modified ${formatDate(item.modifiedAt)}`;
    return `${item.name} ${typeLabel}${sizeLabel}${dateLabel}`;
  };

  // Handle rename input key down
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to parent
      onRenameComplete();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to parent
      onRenameCancel();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.detail === 2 || e.key === 'Enter') {
        onDoubleClick();
      } else {
        onClick();
      }
    }
  };

  if (viewMode === 'list') {
    // List view: single row with columns
    return (
      <div
        className={`
          flex items-center
          px-2 py-0.5
          font-win95 text-[11px]
          cursor-pointer
          ${isSelected ? 'bg-win95-navy text-win95-white' : 'text-win95-black hover:bg-win95-gray'}
        `}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="option"
        aria-selected={isSelected}
        aria-label={getAccessibleLabel()}
      >
        {/* Icon */}
        <span className="w-6 text-center" aria-hidden="true">{getIcon()}</span>
        
        {/* Name */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={onRenameComplete}
            className="
              flex-1 min-w-0
              px-1
              bg-win95-white
              text-win95-black
              font-win95
              text-[11px]
              win95-inset
              focus:outline-none
            "
            onClick={(e) => e.stopPropagation()}
            aria-label="Rename item"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate">{item.name}</span>
        )}
        
        {/* Size */}
        <span className="w-20 text-right" aria-label={`Size: ${formatSize(item.size)}`}>{formatSize(item.size)}</span>
        
        {/* Modified Date */}
        <span className="w-32 text-right ml-4" aria-label={`Modified: ${formatDate(item.modifiedAt)}`}>{formatDate(item.modifiedAt)}</span>
      </div>
    );
  } else {
    // Icon view: grid layout with icon on top
    return (
      <div
        className={`
          flex flex-col items-center
          p-2
          w-20
          font-win95 text-[11px]
          cursor-pointer
          ${isSelected ? 'bg-win95-navy text-win95-white' : 'text-win95-black'}
        `}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="option"
        aria-selected={isSelected}
        aria-label={getAccessibleLabel()}
      >
        {/* Icon */}
        <span className="text-2xl mb-1" aria-hidden="true">{getIcon()}</span>
        
        {/* Name */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={onRenameComplete}
            className="
              w-full
              px-1
              bg-win95-white
              text-win95-black
              font-win95
              text-[11px]
              text-center
              win95-inset
              focus:outline-none
            "
            onClick={(e) => e.stopPropagation()}
            aria-label="Rename item"
          />
        ) : (
          <span className="text-center break-words w-full">{item.name}</span>
        )}
      </div>
    );
  }
});

FileListItem.displayName = 'FileListItem';

/**
 * ConfirmationDialog Component
 * Displays a Win95-style confirmation dialog
 */
interface ConfirmationDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  // Handle Escape key to cancel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div className="bg-win95-gray win95-outset min-w-[300px] max-w-[400px]">
        {/* Title Bar */}
        <div className="bg-win95-navy text-win95-white px-2 py-1 flex items-center justify-between">
          <span id="dialog-title" className="font-win95 text-[11px] font-bold">{title}</span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            {/* Warning Icon */}
            <span className="text-3xl" aria-hidden="true">⚠️</span>
            
            {/* Message */}
            <p id="dialog-message" className="font-win95 text-[11px] text-win95-black flex-1">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              className="
                px-4 py-1
                min-w-[75px]
                bg-win95-gray
                win95-outset
                font-win95
                text-[11px]
                text-win95-black
                active:win95-inset
              "
              onClick={onConfirm}
              aria-label="Confirm deletion"
            >
              Yes
            </button>
            <button
              className="
                px-4 py-1
                min-w-[75px]
                bg-win95-gray
                win95-outset
                font-win95
                text-[11px]
                text-win95-black
                active:win95-inset
              "
              onClick={onCancel}
              autoFocus
              aria-label="Cancel deletion"
            >
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ErrorDialog Component
 * Displays a Win95-style error dialog with OK button
 */
interface ErrorDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  title,
  message,
  onClose,
}) => {
  // Handle Escape key and Enter key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-message"
    >
      <div className="bg-win95-gray win95-outset min-w-[300px] max-w-[400px]">
        {/* Title Bar */}
        <div className="bg-win95-navy text-win95-white px-2 py-1 flex items-center justify-between">
          <span id="error-dialog-title" className="font-win95 text-[11px] font-bold">{title}</span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            {/* Error Icon */}
            <span className="text-3xl" aria-hidden="true">❌</span>
            
            {/* Message */}
            <p id="error-dialog-message" className="font-win95 text-[11px] text-win95-black flex-1">
              {message}
            </p>
          </div>

          {/* Button */}
          <div className="flex justify-end">
            <button
              className="
                px-4 py-1
                min-w-[75px]
                bg-win95-gray
                win95-outset
                font-win95
                text-[11px]
                text-win95-black
                active:win95-inset
              "
              onClick={onClose}
              autoFocus
              aria-label="Close error dialog"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ContextMenu Component
 * Displays a Win95-style context menu at the cursor position
 */
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

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  item,
  onClose,
  onOpen,
  onRename,
  onDelete,
  onExplain,
  onNewFolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add listener after a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const menuItems = item ? itemMenuItems : emptySpaceMenuItems;
      const validItems = menuItems.filter(m => !m.separator && (!m.folderOnly || item?.type === 'folder'));

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % validItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + validItems.length) % validItems.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const focusedItem = validItems[focusedIndex];
        if (focusedItem) {
          handleMenuItemClick(focusedItem.action);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, item, onClose]);

  // Handle menu item click
  const handleMenuItemClick = (action: () => void) => {
    action();
    onClose();
  };

  // Menu items for file/folder
  const itemMenuItems = [
    { label: 'Open', action: onOpen },
    { label: 'Rename', action: onRename },
    { label: 'Delete', action: onDelete },
    { separator: true },
    { label: 'Explain this folder', action: onExplain, folderOnly: true },
  ];

  // Menu items for empty space
  const emptySpaceMenuItems = [
    { label: 'New Folder', action: onNewFolder },
  ];

  const menuItems = item ? itemMenuItems : emptySpaceMenuItems;
  let validItemIndex = 0;

  return (
    <div
      ref={menuRef}
      className="
        fixed
        bg-win95-gray
        win95-outset
        min-w-[150px]
        shadow-lg
        z-50
      "
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      role="menu"
      aria-label="Context menu"
    >
      {menuItems.map((menuItem, index) => {
        // Skip folder-only items for files
        if (menuItem.folderOnly && item?.type !== 'folder') {
          return null;
        }

        // Render separator
        if (menuItem.separator) {
          return (
            <div
              key={`separator-${index}`}
              className="h-[2px] my-1 mx-1"
              role="separator"
            >
              <div className="h-[1px] bg-win95-dark-gray" />
              <div className="h-[1px] bg-win95-white" />
            </div>
          );
        }

        // Render menu item
        const isFocused = validItemIndex === focusedIndex;
        const currentIndex = validItemIndex;
        validItemIndex++;

        return (
          <div
            key={index}
            className={`
              px-4 py-1
              font-win95 text-[11px]
              cursor-pointer
              ${isFocused ? 'bg-win95-navy text-win95-white' : 'text-win95-black hover:bg-win95-navy hover:text-win95-white'}
            `}
            onClick={() => handleMenuItemClick(menuItem.action)}
            onMouseEnter={() => setFocusedIndex(currentIndex)}
            role="menuitem"
            tabIndex={isFocused ? 0 : -1}
            aria-label={menuItem.label}
          >
            {menuItem.label}
          </div>
        );
      })}
    </div>
  );
};

/**
 * StatusBar Component
 * Displays item count and loading status at the bottom of the Explorer window
 */
interface StatusBarProps {
  itemCount: number;
  isLoading: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ itemCount, isLoading }) => {
  // Format item count text
  const itemCountText = itemCount === 1 ? '1 item' : `${itemCount} items`;

  return (
    <div className="bg-win95-gray border-t-2 border-win95-white px-2 py-1 flex items-center gap-4" role="status" aria-live="polite">
      {/* Item Count */}
      <div className="win95-inset px-2 py-0.5 bg-win95-white">
        <span className="font-win95 text-[11px] text-win95-black" aria-label={`${itemCountText} in current folder`}>
          {itemCountText}
        </span>
      </div>

      {/* Loading Status */}
      {isLoading && (
        <div className="win95-inset px-2 py-0.5 bg-win95-white flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-win95-dark-gray border-t-win95-black rounded-full animate-spin" aria-hidden="true"></div>
          <span className="font-win95 text-[11px] text-win95-black">
            Loading...
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * ExplanationPanel Component
 * Displays AI-generated folder explanation and recommendations
 */
interface ExplanationPanelProps {
  explanation: FolderExplanation;
  onClose: () => void;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  onClose,
}) => {
  // Handle Escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="absolute top-0 right-0 bottom-0 w-80 bg-win95-gray win95-outset m-2 flex flex-col"
      role="complementary"
      aria-label="Folder explanation panel"
    >
      {/* Title Bar */}
      <div className="bg-win95-navy text-win95-white px-2 py-1 flex items-center justify-between">
        <span className="font-win95 text-[11px] font-bold">Folder Explanation</span>
        <button
          className="
            w-4 h-4
            bg-win95-gray
            win95-outset
            font-win95
            text-[9px]
            text-win95-black
            active:win95-inset
            flex items-center justify-center
          "
          onClick={onClose}
          aria-label="Close explanation panel"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {/* Folder Path */}
        <div className="mb-3">
          <span className="font-win95 text-[11px] text-win95-black font-bold" id="explanation-folder-label">
            Folder:
          </span>
          <div 
            className="
              mt-1
              px-2 py-1
              bg-win95-white
              win95-inset
              font-win95 text-[11px] text-win95-black
              break-all
            "
            aria-labelledby="explanation-folder-label"
          >
            {explanation.folderPath}
          </div>
        </div>

        {/* Description */}
        <div className="mb-3">
          <span className="font-win95 text-[11px] text-win95-black font-bold" id="explanation-description-label">
            Description:
          </span>
          <div 
            className="
              mt-1
              px-2 py-1
              bg-win95-white
              win95-inset
              font-win95 text-[11px] text-win95-black
            "
            aria-labelledby="explanation-description-label"
          >
            {explanation.description}
          </div>
        </div>

        {/* Recommendations */}
        {explanation.recommendations.length > 0 && (
          <div>
            <span className="font-win95 text-[11px] text-win95-black font-bold" id="explanation-recommendations-label">
              Recommendations:
            </span>
            <div 
              className="
                mt-1
                px-2 py-1
                bg-win95-white
                win95-inset
                font-win95 text-[11px] text-win95-black
              "
              aria-labelledby="explanation-recommendations-label"
            >
              <ul className="list-none space-y-1" role="list">
                {explanation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start" role="listitem">
                    <span className="mr-2" aria-hidden="true">•</span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * FileList Component
 * Displays the list of files and folders in the current directory with virtualization
 */
interface FileListProps {
  items: FileSystemItem[];
  viewMode: 'list' | 'icons';
  selectedItem: FileSystemItem | null;
  renamingItem: FileSystemItem | null;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameComplete: () => void;
  onRenameCancel: () => void;
  onItemClick: (item: FileSystemItem) => void;
  onItemDoubleClick: (item: FileSystemItem) => void;
  onContextMenu: (item: FileSystemItem | null, position: { x: number; y: number }) => void;
}

const FileList: React.FC<FileListProps> = ({
  items,
  viewMode,
  selectedItem,
  renamingItem,
  renameValue,
  onRenameChange,
  onRenameComplete,
  onRenameCancel,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({ start: 0, end: 50 });
  
  // Item height constants
  const LIST_ITEM_HEIGHT = 20; // Approximate height in pixels for list view
  const ICON_ITEM_HEIGHT = 80; // Approximate height in pixels for icon view
  const ICON_ITEM_WIDTH = 88; // Approximate width in pixels for icon view
  const OVERSCAN = 10; // Number of items to render outside visible area
  
  // Handle context menu on empty space
  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(null, { x: e.clientX, y: e.clientY });
  };

  // Handle item context menu
  const handleItemContextMenu = (item: FileSystemItem) => (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(item, { x: e.clientX, y: e.clientY });
  };

  // Calculate visible range based on scroll position
  const updateVisibleRange = React.useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    if (viewMode === 'list') {
      // List view: simple vertical list
      const startIndex = Math.max(0, Math.floor(scrollTop / LIST_ITEM_HEIGHT) - OVERSCAN);
      const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / LIST_ITEM_HEIGHT) + OVERSCAN
      );
      
      setVisibleRange({ start: startIndex, end: endIndex });
    } else {
      // Icon view: grid layout
      const containerWidth = container.clientWidth - 16; // Account for padding
      const itemsPerRow = Math.max(1, Math.floor(containerWidth / ICON_ITEM_WIDTH));
      const startRow = Math.max(0, Math.floor(scrollTop / ICON_ITEM_HEIGHT) - OVERSCAN);
      const endRow = Math.ceil((scrollTop + containerHeight) / ICON_ITEM_HEIGHT) + OVERSCAN;
      
      const startIndex = startRow * itemsPerRow;
      const endIndex = Math.min(items.length, endRow * itemsPerRow);
      
      setVisibleRange({ start: startIndex, end: endIndex });
    }
  }, [items.length, viewMode]);

  // Update visible range on scroll
  const handleScroll = React.useCallback(() => {
    updateVisibleRange();
  }, [updateVisibleRange]);

  // Update visible range on mount and when items/viewMode change
  React.useEffect(() => {
    updateVisibleRange();
  }, [items.length, viewMode, updateVisibleRange]);

  // Empty folder state
  if (items.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center"
        onContextMenu={handleBackgroundContextMenu}
        role="status"
        aria-live="polite"
      >
        <span className="font-win95 text-[11px] text-win95-dark-gray">
          This folder is empty
        </span>
      </div>
    );
  }

  // Only use virtualization for large lists (>100 items)
  const useVirtualization = items.length > 100;
  const visibleItems = useVirtualization ? items.slice(visibleRange.start, visibleRange.end) : items;

  if (viewMode === 'list') {
    // List view: vertical list with virtualization
    const totalHeight = items.length * LIST_ITEM_HEIGHT;
    const offsetY = useVirtualization ? visibleRange.start * LIST_ITEM_HEIGHT : 0;
    
    return (
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        onContextMenu={handleBackgroundContextMenu}
        onScroll={useVirtualization ? handleScroll : undefined}
        role="listbox"
        aria-label="File list"
        aria-multiselectable="false"
      >
        {/* Column Headers */}
        <div className="flex items-center px-2 py-1 bg-win95-gray border-b border-win95-dark-gray sticky top-0 z-10" role="row">
          <span className="w-6" aria-hidden="true"></span>
          <span className="flex-1 font-win95 text-[11px] text-win95-black font-bold" role="columnheader">Name</span>
          <span className="w-20 text-right font-win95 text-[11px] text-win95-black font-bold" role="columnheader">Size</span>
          <span className="w-32 text-right ml-4 font-win95 text-[11px] text-win95-black font-bold" role="columnheader">Modified</span>
        </div>
        
        {/* Virtualized container */}
        {useVirtualization && (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map((item, index) => (
                <FileListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  viewMode={viewMode}
                  isRenaming={renamingItem?.id === item.id}
                  renameValue={renameValue}
                  onRenameChange={onRenameChange}
                  onRenameComplete={onRenameComplete}
                  onRenameCancel={onRenameCancel}
                  onClick={() => onItemClick(item)}
                  onDoubleClick={() => onItemDoubleClick(item)}
                  onContextMenu={handleItemContextMenu(item)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Non-virtualized items for small lists */}
        {!useVirtualization && visibleItems.map((item) => (
          <FileListItem
            key={item.id}
            item={item}
            isSelected={selectedItem?.id === item.id}
            viewMode={viewMode}
            isRenaming={renamingItem?.id === item.id}
            renameValue={renameValue}
            onRenameChange={onRenameChange}
            onRenameComplete={onRenameComplete}
            onRenameCancel={onRenameCancel}
            onClick={() => onItemClick(item)}
            onDoubleClick={() => onItemDoubleClick(item)}
            onContextMenu={handleItemContextMenu(item)}
          />
        ))}
      </div>
    );
  } else {
    // Icon view: grid layout with virtualization
    const containerWidth = containerRef.current?.clientWidth || 800;
    const itemsPerRow = Math.max(1, Math.floor((containerWidth - 16) / ICON_ITEM_WIDTH));
    const totalRows = Math.ceil(items.length / itemsPerRow);
    const totalHeight = totalRows * ICON_ITEM_HEIGHT;
    const offsetY = useVirtualization ? Math.floor(visibleRange.start / itemsPerRow) * ICON_ITEM_HEIGHT : 0;
    
    return (
      <div
        ref={containerRef}
        className="h-full overflow-auto p-2"
        onContextMenu={handleBackgroundContextMenu}
        onScroll={useVirtualization ? handleScroll : undefined}
        role="listbox"
        aria-label="File list"
        aria-multiselectable="false"
      >
        {/* Virtualized container */}
        {useVirtualization && (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }} className="flex flex-wrap gap-2">
              {visibleItems.map((item) => (
                <FileListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  viewMode={viewMode}
                  isRenaming={renamingItem?.id === item.id}
                  renameValue={renameValue}
                  onRenameChange={onRenameChange}
                  onRenameComplete={onRenameComplete}
                  onRenameCancel={onRenameCancel}
                  onClick={() => onItemClick(item)}
                  onDoubleClick={() => onItemDoubleClick(item)}
                  onContextMenu={handleItemContextMenu(item)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Non-virtualized items for small lists */}
        {!useVirtualization && (
          <div className="flex flex-wrap gap-2">
            {visibleItems.map((item) => (
              <FileListItem
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                viewMode={viewMode}
                isRenaming={renamingItem?.id === item.id}
                renameValue={renameValue}
                onRenameChange={onRenameChange}
                onRenameComplete={onRenameComplete}
                onRenameCancel={onRenameCancel}
                onClick={() => onItemClick(item)}
                onDoubleClick={() => onItemDoubleClick(item)}
                onContextMenu={handleItemContextMenu(item)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
};

/**
 * Folder contents cache
 * Caches folder contents to avoid repeated VFS reads
 */
interface FolderCache {
  items: FileSystemItem[];
  timestamp: number;
}

// Cache duration in milliseconds (5 seconds)
const CACHE_DURATION = 5000;

/**
 * Explorer Component
 * Main component that orchestrates the file explorer with Win95 styling
 */
export const Explorer: React.FC<ExplorerProps> = ({
  windowId,
  initialPath = '/',
}) => {
  // Window Manager
  const { updateWindowTitle } = useWindowManager();

  // State management
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [history, setHistory] = useState<string[]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [explanation, setExplanation] = useState<FolderExplanation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'icons'>('list');
  const [fileListItems, setFileListItems] = useState<FileSystemItem[]>([]);
  // Initialize with root folder expanded
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([initialPath]));
  // Rename state
  const [renamingItem, setRenamingItem] = useState<FileSystemItem | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    item: FileSystemItem;
    show: boolean;
  } | null>(null);
  // Error dialog state
  const [errorDialog, setErrorDialog] = useState<{
    title: string;
    message: string;
    show: boolean;
  } | null>(null);
  
  // Folder contents cache
  const folderCacheRef = useRef<Map<string, FolderCache>>(new Map());

  /**
   * Show error dialog with user-friendly message
   */
  const showError = React.useCallback((title: string, message: string) => {
    setErrorDialog({
      title,
      message,
      show: true,
    });
  }, []);

  /**
   * Load folder contents from VFS with caching
   * Handles errors and updates file list state
   */
  const loadFolderContents = React.useCallback((path: string, forceRefresh: boolean = false) => {
    try {
      // Check cache first
      const cached = folderCacheRef.current.get(path);
      const now = Date.now();
      
      if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Use cached data
        setFileListItems(cached.items);
        return;
      }
      
      // Load from VFS
      const items = vfs.readFolder(path);
      
      // Update cache
      folderCacheRef.current.set(path, {
        items,
        timestamp: now,
      });
      
      setFileListItems(items);
    } catch (error) {
      console.error('Failed to load folder contents:', error);
      setFileListItems([]);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          showError('Folder Not Found', `The folder "${path}" could not be found.`);
        } else if (error.message.includes('permission')) {
          showError('Permission Denied', `You do not have permission to access "${path}".`);
        } else {
          showError('Error Loading Folder', `Failed to load folder: ${error.message}`);
        }
      } else {
        showError('Error Loading Folder', 'An unknown error occurred while loading the folder.');
      }
    }
  }, [showError]);

  // Load initial folder contents on mount
  React.useEffect(() => {
    loadFolderContents(currentPath);
  }, []); // Only run on mount

  /**
   * Navigate to a new path and update history
   * Truncates forward history when navigating to a new path
   */
  const navigateTo = React.useCallback((newPath: string) => {
    // Truncate forward history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPath);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(newPath);
    loadFolderContents(newPath);
  }, [history, historyIndex, loadFolderContents]);

  // Folder tree handlers
  const handleFolderToggle = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFolderSelect = (path: string) => {
    navigateTo(path);
  };

  // File list handlers
  const handleItemClick = (item: FileSystemItem) => {
    setSelectedItem(item);
  };

  const handleItemDoubleClick = (item: FileSystemItem) => {
    // Navigate into folders on double-click
    if (item.type === 'folder') {
      navigateTo(item.path);
      
      // Expand the folder in the tree
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.add(item.path);
        return newSet;
      });
    }
    // TODO: Open files with appropriate application (will be implemented later)
  };

  const handleContextMenu = (item: FileSystemItem | null, position: { x: number; y: number }) => {
    // Close any existing context menu first
    if (contextMenuPosition) {
      setContextMenuPosition(null);
      // Use setTimeout to ensure the old menu is closed before opening the new one
      setTimeout(() => {
        setSelectedItem(item);
        setContextMenuPosition(position);
      }, 0);
    } else {
      setSelectedItem(item);
      setContextMenuPosition(position);
    }
  };

  // Context menu action handlers
  const handleContextMenuClose = () => {
    setContextMenuPosition(null);
  };

  const handleOpen = () => {
    if (selectedItem && selectedItem.type === 'folder') {
      navigateTo(selectedItem.path);
    }
    // TODO: Handle file opening (will be implemented later)
  };

  const handleRename = () => {
    if (selectedItem) {
      setRenamingItem(selectedItem);
      setRenameValue(selectedItem.name);
    }
  };

  const handleRenameComplete = () => {
    if (!renamingItem || !renameValue.trim()) {
      setRenamingItem(null);
      setRenameValue('');
      return;
    }

    // Check if name has changed
    if (renameValue.trim() === renamingItem.name) {
      setRenamingItem(null);
      setRenameValue('');
      return;
    }

    try {
      // Call VFS rename function
      vfs.renameItem(renamingItem.path, renameValue.trim());
      
      // Invalidate cache and refresh file list
      folderCacheRef.current.delete(currentPath);
      loadFolderContents(currentPath, true);
      
      // Clear rename state
      setRenamingItem(null);
      setRenameValue('');
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to rename item:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          showError('Rename Failed', `An item with the name "${renameValue.trim()}" already exists.`);
        } else if (error.message.includes('permission')) {
          showError('Permission Denied', `You do not have permission to rename "${renamingItem.name}".`);
        } else if (error.message.includes('not found')) {
          showError('Item Not Found', `The item "${renamingItem.name}" could not be found.`);
        } else {
          showError('Rename Failed', `Failed to rename item: ${error.message}`);
        }
      } else {
        showError('Rename Failed', 'An unknown error occurred while renaming the item.');
      }
      
      // Clear rename state on error
      setRenamingItem(null);
      setRenameValue('');
    }
  };

  const handleRenameCancel = () => {
    setRenamingItem(null);
    setRenameValue('');
  };

  const handleDelete = () => {
    if (selectedItem) {
      // Show confirmation dialog
      setDeleteConfirmation({
        item: selectedItem,
        show: true,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmation) return;

    try {
      // Call VFS delete function
      vfs.deleteItem(deleteConfirmation.item.path);
      
      // Invalidate cache and refresh file list
      folderCacheRef.current.delete(currentPath);
      loadFolderContents(currentPath, true);
      
      // Clear selection and confirmation
      setSelectedItem(null);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          showError('Delete Failed', `The item "${deleteConfirmation.item.name}" could not be found.`);
        } else if (error.message.includes('permission')) {
          showError('Permission Denied', `You do not have permission to delete "${deleteConfirmation.item.name}".`);
        } else if (error.message.includes('not empty')) {
          showError('Delete Failed', `The folder "${deleteConfirmation.item.name}" is not empty.`);
        } else {
          showError('Delete Failed', `Failed to delete item: ${error.message}`);
        }
      } else {
        showError('Delete Failed', 'An unknown error occurred while deleting the item.');
      }
      
      // Close confirmation dialog
      setDeleteConfirmation(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation(null);
  };

  const handleExplain = async () => {
    if (!selectedItem || selectedItem.type !== 'folder') {
      console.warn('Cannot explain non-folder item');
      return;
    }

    const folderPath = selectedItem.path;
    
    try {
      // Show loading indicator
      setIsLoading(true);
      
      // Gather folder filenames from VFS
      const items = vfs.readFolder(folderPath);
      const filenames = items.map(item => item.name);
      
      // Read sample file contents (first 5 files)
      const fileItems = items.filter(item => item.type === 'file').slice(0, 5);
      const sampleContents: string[] = [];
      
      for (const fileItem of fileItems) {
        try {
          const content = vfs.readFile(fileItem.path);
          sampleContents.push(content);
        } catch (error) {
          console.warn(`Failed to read file ${fileItem.path}:`, error);
          // Continue with other files
        }
      }
      
      // Call AI Engine explainFolder function with 30-second timeout
      const explainPromise = aiClient.explainFolder({
        path: folderPath,
        filenames,
        sampleContents,
      });
      
      // Implement 30-second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Folder explanation timed out after 30 seconds')), 30000);
      });
      
      const result = await Promise.race([explainPromise, timeoutPromise]);
      
      // Display result in ExplanationPanel
      setExplanation(result);
    } catch (error) {
      console.error('Failed to explain folder:', error);
      
      // Log error to console for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      
      // Show user-friendly error dialog
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          showError(
            'Request Timeout',
            'The folder explanation request took too long. Please try again with a smaller folder.'
          );
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          showError(
            'Network Error',
            'Unable to connect to the AI service. Please check your network connection and try again.'
          );
        } else if (error.message.includes('API key') || error.message.includes('authentication')) {
          showError(
            'Authentication Error',
            'AI service authentication failed. Please check your API key configuration.'
          );
        } else {
          showError(
            'AI Error',
            `Failed to generate folder explanation: ${error.message}`
          );
        }
      } else {
        showError(
          'AI Error',
          'An unknown error occurred while generating the folder explanation.'
        );
      }
      
      // Maintain folder state on errors (don't show partial explanation)
    } finally {
      // Hide loading indicator
      setIsLoading(false);
    }
  };

  const handleNewFolder = () => {
    try {
      // Generate a unique folder name
      let folderName = 'New Folder';
      let counter = 1;
      let folderPath = `${currentPath === '/' ? '' : currentPath}/${folderName}`;
      
      // Check if folder already exists and increment counter
      while (vfs.exists(folderPath)) {
        folderName = `New Folder (${counter})`;
        folderPath = `${currentPath === '/' ? '' : currentPath}/${folderName}`;
        counter++;
      }
      
      // Create the folder
      vfs.createFolder(folderPath);
      
      // Invalidate cache and refresh file list to show new folder
      folderCacheRef.current.delete(currentPath);
      const items = vfs.readFolder(currentPath);
      setFileListItems(items);
      
      // Update cache with new items
      folderCacheRef.current.set(currentPath, {
        items,
        timestamp: Date.now(),
      });
      
      // Find the newly created folder and enter rename mode
      const newFolder = items.find(item => item.path === folderPath);
      if (newFolder) {
        setSelectedItem(newFolder);
        setRenamingItem(newFolder);
        setRenameValue(newFolder.name);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          showError('Permission Denied', `You do not have permission to create a folder in "${currentPath}".`);
        } else if (error.message.includes('not found')) {
          showError('Folder Not Found', `The parent folder "${currentPath}" could not be found.`);
        } else {
          showError('Create Folder Failed', `Failed to create folder: ${error.message}`);
        }
      } else {
        showError('Create Folder Failed', 'An unknown error occurred while creating the folder.');
      }
    }
  };

  // View mode toggle handler
  const handleViewModeToggle = () => {
    setViewMode((prev) => (prev === 'list' ? 'icons' : 'list'));
  };

  /**
   * Navigate back in history
   * Moves to the previous path in the history stack
   */
  const handleBack = React.useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const newPath = history[newIndex];
      
      setHistoryIndex(newIndex);
      setCurrentPath(newPath);
      loadFolderContents(newPath);
    }
  }, [history, historyIndex, loadFolderContents]);

  /**
   * Navigate forward in history
   * Moves to the next path in the history stack
   */
  const handleForward = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const newPath = history[newIndex];
      
      setHistoryIndex(newIndex);
      setCurrentPath(newPath);
      loadFolderContents(newPath);
    }
  }, [history, historyIndex, loadFolderContents]);

  /**
   * Navigate to parent folder
   * Moves up one level in the directory hierarchy
   */
  const handleUp = React.useCallback(() => {
    // Get parent path
    const pathParts = currentPath.split('/').filter(part => part !== '');
    
    // If already at root, do nothing
    if (pathParts.length === 0) {
      return;
    }
    
    // Remove last part to get parent
    pathParts.pop();
    const parentPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
    
    navigateTo(parentPath);
  }, [currentPath, navigateTo]);

  /**
   * Navigate to a path entered in the address bar
   * Validates the path before navigation
   */
  const handleNavigate = React.useCallback((path: string) => {
    // Trim whitespace
    const trimmedPath = path.trim();
    
    // Validate path is not empty
    if (!trimmedPath) {
      showError('Invalid Path', 'Please enter a valid folder path.');
      return;
    }
    
    // Validate path exists
    try {
      const metadata = vfs.getMetadata(trimmedPath);
      
      // Validate it's a folder
      if (metadata.type !== 'folder') {
        showError('Invalid Path', `"${trimmedPath}" is not a folder.`);
        return;
      }
      
      // Navigate to the valid folder
      navigateTo(trimmedPath);
    } catch (error) {
      console.error('Invalid path:', trimmedPath, error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          showError('Folder Not Found', `The folder "${trimmedPath}" could not be found.`);
        } else {
          showError('Navigation Failed', `Failed to navigate to "${trimmedPath}": ${error.message}`);
        }
      } else {
        showError('Navigation Failed', `The path "${trimmedPath}" is invalid.`);
      }
    }
  }, [navigateTo, showError]);

  // Calculate navigation button states
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  /**
   * Handle keyboard shortcuts
   * F5: Refresh, Backspace: Up, Alt+Left: Back, Alt+Right: Forward, Delete: Delete item
   */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts when renaming
      if (renamingItem) {
        return;
      }

      // F5: Refresh current folder
      if (e.key === 'F5') {
        e.preventDefault();
        folderCacheRef.current.delete(currentPath);
        loadFolderContents(currentPath, true);
        return;
      }

      // Backspace: Navigate to parent folder
      if (e.key === 'Backspace') {
        // Only if not in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleUp();
        }
        return;
      }

      // Alt+Left: Navigate back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack) {
          handleBack();
        }
        return;
      }

      // Alt+Right: Navigate forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoForward) {
          handleForward();
        }
        return;
      }

      // Delete: Delete selected item
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedItem) {
          handleDelete();
        }
        return;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    renamingItem,
    currentPath,
    canGoBack,
    canGoForward,
    selectedItem,
    loadFolderContents,
    handleUp,
    handleBack,
    handleForward,
    handleDelete,
  ]);

  return (
    <div className="flex flex-col h-full bg-win95-gray" role="application" aria-label="File Explorer">
      {/* Toolbar */}
      <Toolbar
        currentPath={currentPath}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        viewMode={viewMode}
        onBack={handleBack}
        onForward={handleForward}
        onUp={handleUp}
        onNavigate={handleNavigate}
        onViewModeToggle={handleViewModeToggle}
      />

      {/* SplitPane with Folder Tree and File List */}
      <div className="flex-1 relative overflow-hidden">
        <SplitPane
          leftPane={
            <FolderTree
              rootPath="/"
              currentPath={currentPath}
              expandedFolders={expandedFolders}
              onFolderToggle={handleFolderToggle}
              onFolderSelect={handleFolderSelect}
            />
          }
          rightPane={
            <FileList
              items={fileListItems}
              viewMode={viewMode}
              selectedItem={selectedItem}
              renamingItem={renamingItem}
              renameValue={renameValue}
              onRenameChange={setRenameValue}
              onRenameComplete={handleRenameComplete}
              onRenameCancel={handleRenameCancel}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
              onContextMenu={handleContextMenu}
            />
          }
        />

        {/* Explanation Panel */}
        {explanation && (
          <ExplanationPanel
            explanation={explanation}
            onClose={() => setExplanation(null)}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40"
            role="status"
            aria-live="polite"
            aria-label="Loading folder explanation"
          >
            <div className="bg-win95-gray win95-outset p-4 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-win95-dark-gray border-t-win95-white rounded-full animate-spin" aria-hidden="true"></div>
                <span className="font-win95 text-[11px] text-win95-black">
                  Analyzing folder...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* StatusBar */}
      <StatusBar itemCount={fileListItems.length} isLoading={isLoading} />

      {/* Context Menu */}
      {contextMenuPosition && (
        <ContextMenu
          position={contextMenuPosition}
          item={selectedItem}
          onClose={handleContextMenuClose}
          onOpen={handleOpen}
          onRename={handleRename}
          onDelete={handleDelete}
          onExplain={handleExplain}
          onNewFolder={handleNewFolder}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation?.show && (
        <ConfirmationDialog
          title="Confirm Delete"
          message={`Are you sure you want to delete "${deleteConfirmation.item.name}"?`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* Error Dialog */}
      {errorDialog?.show && (
        <ErrorDialog
          title={errorDialog.title}
          message={errorDialog.message}
          onClose={() => setErrorDialog(null)}
        />
      )}
    </div>
  );
};
