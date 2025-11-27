/**
 * Notepad Application
 * 
 * Win95-style text editor with AI augmentation capabilities.
 * Provides text editing with autosave, AI summarization, and rewriting features.
 */

import React, { useState, useRef, useEffect } from 'react';
import { vfs } from '@core/file-system/vfs';
import { useWindowManager } from '@core/window-manager/WindowContext';
import { aiClient } from '@core/ai-engine/aiClient';
import type { CancellablePromise } from '@core/ai-engine/types';
import { MessageBox, type MessageType } from './MessageBox';

/**
 * Props for the Notepad component
 */
interface NotepadProps {
  windowId: string;
  documentId?: string;
  initialContent?: string;
}

/**
 * Internal state for the Notepad component
 * Note: This interface documents the state shape but is not directly used
 * as we use individual useState hooks for better granularity
 */
interface NotepadState {
  content: string;
  documentId: string;
  filename: string;
  hasUnsavedChanges: boolean;
  summary: string | null;
  isLoading: boolean;
  selectedText: string;
}

/**
 * MenuBar Component
 * Renders the Win95-style menu bar with File, Edit, and AI menus
 */
interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onUndo: () => void;
  onSelectAll: () => void;
  onSummarize: () => void;
  onRewrite: (style?: string) => void;
  isLoading?: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onNew,
  onOpen,
  onSave,
  onUndo,
  onSelectAll,
  onSummarize,
  onRewrite,
  isLoading = false,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  return (
    <div className="relative flex bg-win95-gray border-b-2 border-win95-dark-gray" role="menubar">
      {/* File Menu */}
      <div className="relative">
        <button
          className="px-2 py-1 font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white"
          onClick={() => handleMenuClick('file')}
          aria-haspopup="true"
          aria-expanded={openMenu === 'file'}
          aria-label="File menu"
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="absolute top-full left-0 bg-win95-gray win95-outset z-50 min-w-[180px]" role="menu">
            <button
              className="w-full px-4 py-1 text-left font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white flex justify-between"
              onClick={() => handleMenuItemClick(onNew)}
              role="menuitem"
            >
              <span>New</span>
              <span className="text-win95-dark-gray">Ctrl+N</span>
            </button>
            <button
              className="w-full px-4 py-1 text-left font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white flex justify-between"
              onClick={() => handleMenuItemClick(onOpen)}
              role="menuitem"
            >
              <span>Open...</span>
              <span className="text-win95-dark-gray">Ctrl+O</span>
            </button>
            <button
              className="w-full px-4 py-1 text-left font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white flex justify-between"
              onClick={() => handleMenuItemClick(onSave)}
              role="menuitem"
            >
              <span>Save</span>
              <span className="text-win95-dark-gray">Ctrl+S</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="relative">
        <button
          className="px-2 py-1 font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white"
          onClick={() => handleMenuClick('edit')}
          aria-haspopup="true"
          aria-expanded={openMenu === 'edit'}
          aria-label="Edit menu"
        >
          Edit
        </button>
        {openMenu === 'edit' && (
          <div className="absolute top-full left-0 bg-win95-gray win95-outset z-50 min-w-[180px]" role="menu">
            <button
              className="w-full px-4 py-1 text-left font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white flex justify-between"
              onClick={() => handleMenuItemClick(onUndo)}
              role="menuitem"
            >
              <span>Undo</span>
              <span className="text-win95-dark-gray">Ctrl+Z</span>
            </button>
            <div className="h-[1px] bg-win95-dark-gray my-1 mx-2" role="separator" />
            <button
              className="w-full px-4 py-1 text-left font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white flex justify-between"
              onClick={() => handleMenuItemClick(onSelectAll)}
              role="menuitem"
            >
              <span>Select All</span>
              <span className="text-win95-dark-gray">Ctrl+A</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Menu */}
      <div className="relative">
        <button
          className="px-2 py-1 font-win95 text-[11px] text-win95-black hover:bg-win95-navy hover:text-win95-white"
          onClick={() => handleMenuClick('ai')}
          aria-haspopup="true"
          aria-expanded={openMenu === 'ai'}
          aria-label="AI menu"
        >
          AI
        </button>
        {openMenu === 'ai' && (
          <div className="absolute top-full left-0 bg-win95-gray win95-outset z-50 min-w-[180px]" role="menu">
            <button
              className={`w-full px-4 py-1 text-left font-win95 text-[11px] flex justify-between ${
                isLoading 
                  ? 'text-win95-dark-gray cursor-not-allowed' 
                  : 'text-win95-black hover:bg-win95-navy hover:text-win95-white'
              }`}
              onClick={() => !isLoading && handleMenuItemClick(onSummarize)}
              disabled={isLoading}
              role="menuitem"
              aria-disabled={isLoading}
            >
              <span>Summarize</span>
              <span className="text-win95-dark-gray">Ctrl+Shift+S</span>
            </button>
            <div className="h-[1px] bg-win95-dark-gray my-1 mx-2" role="separator" />
            <button
              className={`w-full px-4 py-1 text-left font-win95 text-[11px] ${
                isLoading 
                  ? 'text-win95-dark-gray cursor-not-allowed' 
                  : 'text-win95-black hover:bg-win95-navy hover:text-win95-white'
              }`}
              onClick={() => !isLoading && handleMenuItemClick(() => onRewrite())}
              disabled={isLoading}
              role="menuitem"
              aria-disabled={isLoading}
            >
              Rewrite
            </button>
            <button
              className={`w-full px-4 py-1 text-left font-win95 text-[11px] pl-8 ${
                isLoading 
                  ? 'text-win95-dark-gray cursor-not-allowed' 
                  : 'text-win95-black hover:bg-win95-navy hover:text-win95-white'
              }`}
              onClick={() => !isLoading && handleMenuItemClick(() => onRewrite('formal'))}
              disabled={isLoading}
              role="menuitem"
              aria-disabled={isLoading}
            >
              Formal
            </button>
            <button
              className={`w-full px-4 py-1 text-left font-win95 text-[11px] pl-8 ${
                isLoading 
                  ? 'text-win95-dark-gray cursor-not-allowed' 
                  : 'text-win95-black hover:bg-win95-navy hover:text-win95-white'
              }`}
              onClick={() => !isLoading && handleMenuItemClick(() => onRewrite('casual'))}
              disabled={isLoading}
              role="menuitem"
              aria-disabled={isLoading}
            >
              Casual
            </button>
            <button
              className={`w-full px-4 py-1 text-left font-win95 text-[11px] pl-8 ${
                isLoading 
                  ? 'text-win95-dark-gray cursor-not-allowed' 
                  : 'text-win95-black hover:bg-win95-navy hover:text-win95-white'
              }`}
              onClick={() => !isLoading && handleMenuItemClick(() => onRewrite('concise'))}
              disabled={isLoading}
              role="menuitem"
              aria-disabled={isLoading}
            >
              Concise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SummaryPanel Component
 * Displays AI-generated summary with Win95 styling
 */
interface SummaryPanelProps {
  summary: string;
  onClose: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, onClose }) => {
  return (
    <div className="bg-win95-gray border-t-2 border-win95-dark-gray p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-win95 text-[11px] text-win95-black font-bold">
          Summary:
        </span>
        <button
          className="
            w-4 h-4
            bg-win95-gray
            win95-outset
            flex items-center justify-center
            text-[10px]
            font-bold
            active:win95-inset
          "
          onClick={onClose}
          aria-label="Close summary"
        >
          ×
        </button>
      </div>
      <div
        className="
          bg-win95-white
          win95-inset
          p-2
          font-win95
          text-[11px]
          text-win95-black
          max-h-[120px]
          overflow-y-auto
        "
      >
        {summary}
      </div>
    </div>
  );
};

/**
 * StatusBar Component
 * Displays character count and loading status at the bottom of the window
 */
interface StatusBarProps {
  characterCount: number;
  isLoading: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ characterCount, isLoading }) => {
  return (
    <div className="bg-win95-gray border-t-2 border-win95-dark-gray px-2 py-1 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-win95 text-[11px] text-win95-black" aria-label={`Character count: ${characterCount}`}>
          Characters: {characterCount}
        </span>
        {isLoading && (
          <span 
            className="font-win95 text-[11px] text-win95-black"
            role="status"
            aria-live="polite"
            aria-label="AI operation in progress"
          >
            ⏳ AI Processing...
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * TextEditor Component
 * Renders the main textarea for text editing with Win95 styling
 */
interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange: (selectedText: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const TextEditor: React.FC<TextEditorProps> = ({
  content,
  onChange,
  onSelectionChange,
  textareaRef: externalRef,
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = content.substring(start, end);
      onSelectionChange(selected);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleChange}
      onSelect={handleSelect}
      onMouseUp={handleSelect}
      onKeyUp={handleSelect}
      className="
        flex-1
        p-2
        bg-win95-white
        text-win95-black
        font-win95-mono
        text-[12px]
        resize-none
        focus:outline-none
        border-none
      "
      aria-label="Document content"
      spellCheck={false}
    />
  );
};

/**
 * FilePickerDialog Component
 * Win95-style file picker for opening documents
 */
interface FilePickerDialogProps {
  onSelect: (filename: string) => void;
  onCancel: () => void;
}

const FilePickerDialog: React.FC<FilePickerDialogProps> = ({ onSelect, onCancel }) => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    // Load .txt files from /documents folder
    try {
      const items = vfs.readFolder('/documents');
      const txtFiles = items
        .filter(item => item.type === 'file' && item.name.endsWith('.txt'))
        .map(item => item.name);
      setFiles(txtFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    }
  }, []);

  const handleFileClick = (filename: string) => {
    setSelectedFile(filename);
  };

  const handleFileDoubleClick = (filename: string) => {
    onSelect(filename);
  };

  const handleOpen = () => {
    if (selectedFile) {
      onSelect(selectedFile);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes dialog
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Enter key opens selected file
      if (e.key === 'Enter' && selectedFile) {
        e.preventDefault();
        onSelect(selectedFile);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, onSelect, onCancel]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-picker-title"
    >
      <div className="bg-win95-gray win95-outset p-1 w-[400px]">
        {/* Title Bar */}
        <div className="bg-win95-navy text-win95-white px-2 py-1 flex items-center justify-between mb-1">
          <span id="file-picker-title" className="font-win95 text-[11px] font-bold">Open</span>
          <button
            className="w-4 h-4 bg-win95-gray win95-outset flex items-center justify-center text-[10px] font-bold active:win95-inset"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        
        {/* Dialog Content */}
        <div className="bg-win95-gray p-2">
          {/* File list */}
          <div className="mb-2">
            <label className="font-win95 text-[11px] text-win95-black block mb-1" id="file-list-label">
              File name:
            </label>
            <div 
              className="
                bg-win95-white
                win95-inset
                h-[200px]
                overflow-y-auto
                p-1
              "
              role="listbox"
              aria-labelledby="file-list-label"
            >
              {files.length === 0 ? (
                <div className="font-win95 text-[11px] text-win95-dark-gray p-2">
                  No .txt files found
                </div>
              ) : (
                files.map((filename) => (
                  <div
                    key={filename}
                    className={`
                      font-win95
                      text-[11px]
                      px-2
                      py-1
                      cursor-pointer
                      ${selectedFile === filename ? 'bg-win95-navy text-win95-white' : 'text-win95-black'}
                    `}
                    onClick={() => handleFileClick(filename)}
                    onDoubleClick={() => handleFileDoubleClick(filename)}
                    role="option"
                    aria-selected={selectedFile === filename}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFileClick(filename);
                      }
                    }}
                  >
                    📄 {filename}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Selected file display */}
          <div className="mb-4">
            <input
              type="text"
              value={selectedFile || ''}
              readOnly
              className="
                w-full
                px-2
                py-1
                bg-win95-white
                text-win95-black
                font-win95
                text-[11px]
                win95-inset
              "
              placeholder="Select a file"
              aria-label="Selected file name"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              className="
                px-4 py-1
                bg-win95-gray
                win95-outset
                font-win95
                text-[11px]
                text-win95-black
                min-w-[75px]
                active:win95-inset
                disabled:text-win95-dark-gray
              "
              onClick={handleOpen}
              disabled={!selectedFile}
            >
              Open
            </button>
            <button
              className="
                px-4 py-1
                bg-win95-gray
                win95-outset
                font-win95
                text-[11px]
                text-win95-black
                min-w-[75px]
                active:win95-inset
              "
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Notepad Component
 * Main component that orchestrates the text editor with Win95 styling
 */
export const Notepad: React.FC<NotepadProps> = ({
  windowId,
  documentId: initialDocumentId,
  initialContent = '',
}) => {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiOperationRef = useRef<CancellablePromise<string> | null>(null);

  // Window Manager
  const { updateWindowTitle } = useWindowManager();

  // State management
  const [content, setContent] = useState<string>(initialContent);
  const [documentId, setDocumentId] = useState<string>(
    initialDocumentId || `doc-${Date.now()}`
  );
  const [filename, setFilename] = useState<string>('Untitled');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>('');

  // Load document from VFS
  const loadDocument = (docId: string) => {
    try {
      // Try to load from VFS using documentId as path
      let filePath = docId;
      
      // If docId doesn't start with /, assume it's in /documents
      if (!docId.startsWith('/')) {
        filePath = `/documents/${docId}`;
      }
      
      // Ensure .txt extension
      if (!filePath.endsWith('.txt')) {
        filePath = `${filePath}.txt`;
      }

      const fileContent = vfs.readFile(filePath);
      setContent(fileContent);
      
      // Extract filename from path
      const pathParts = filePath.split('/');
      const fileNameWithExt = pathParts[pathParts.length - 1];
      const fileNameWithoutExt = fileNameWithExt.replace('.txt', '');
      setFilename(fileNameWithoutExt);
      
      setHasUnsavedChanges(false);
      console.log('Document loaded:', filePath);
    } catch (error) {
      // Handle file not found errors (Requirement 7.5)
      console.error('Failed to load document:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        // If file doesn't exist, create a new document with the given ID
        setFilename(docId);
        setContent('');
        setHasUnsavedChanges(false);
        console.log('File not found, creating new document:', docId);
      } else {
        // Show error dialog for other errors
        setMessageBox({
          show: true,
          title: 'Error',
          message: `Failed to load document: ${docId}\n\nWould you like to retry?`,
          type: 'confirm',
          onConfirm: () => {
            // Retry load operation
            setMessageBox(null);
            loadDocument(docId);
          },
          onNo: () => {
            // Don't retry, create new document
            setMessageBox(null);
            setFilename(docId);
            setContent('');
            setHasUnsavedChanges(false);
          },
        });
      }
    }
  };

  // Dialog state
  const [showFilePickerDialog, setShowFilePickerDialog] = useState<boolean>(false);
  const [messageBox, setMessageBox] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: MessageType;
    onConfirm: () => void;
    onNo?: () => void;
    onCancel?: () => void;
  } | null>(null);

  // Handlers for menu actions
  const handleNew = () => {
    const createNewDocument = () => {
      // Clear content and summary
      setContent('');
      setSummary(null);
      
      // Generate new document ID
      const newDocId = `doc-${Date.now()}`;
      setDocumentId(newDocId);
      
      // Set filename to Untitled
      setFilename('Untitled');
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
      console.log('New document created:', newDocId);
    };

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      // Show confirmation dialog
      setMessageBox({
        show: true,
        title: 'Notepad',
        message: 'Do you want to save changes?',
        type: 'confirm',
        onConfirm: () => {
          // Save and then create new document
          handleSave();
          createNewDocument();
          setMessageBox(null);
        },
        onNo: () => {
          // Don't save, just create new document
          createNewDocument();
          setMessageBox(null);
        },
        onCancel: () => {
          // Cancel action
          setMessageBox(null);
        },
      });
    } else {
      // No unsaved changes, proceed directly
      createNewDocument();
    }
  };

  const handleOpen = () => {
    // Show file picker dialog
    setShowFilePickerDialog(true);
  };

  const handleFileSelect = (filename: string) => {
    try {
      // Load file content from VFS
      const filePath = `/documents/${filename}`;
      const fileContent = vfs.readFile(filePath);
      
      // Update state
      setContent(fileContent);
      setFilename(filename.replace('.txt', ''));
      setHasUnsavedChanges(false);
      setSummary(null); // Clear any existing summary
      
      // Close file picker
      setShowFilePickerDialog(false);
      
      console.log('Document loaded:', filePath);
    } catch (error) {
      // Handle load errors (Requirement 7.5)
      console.error('Failed to load document:', error);
      setShowFilePickerDialog(false);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      let message = `Failed to open file: ${filename}`;
      
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        message = `File not found: ${filename}`;
      } else if (errorMsg.includes('permission')) {
        message = `Permission denied: ${filename}`;
      }
      
      // Provide retry option (Requirement 7.5)
      setMessageBox({
        show: true,
        title: 'Error',
        message: `${message}\n\nWould you like to retry?`,
        type: 'confirm',
        onConfirm: () => {
          // Retry by reopening file picker
          setMessageBox(null);
          setShowFilePickerDialog(true);
        },
        onNo: () => {
          // Don't retry
          setMessageBox(null);
        },
      });
    }
  };

  const handleSave = () => {
    try {
      const filePath = `/documents/${filename}.txt`;
      vfs.writeFile(filePath, content);
      setHasUnsavedChanges(false);
      console.log('Document saved:', filePath);
    } catch (error) {
      // Handle VFS write errors (Requirement 7.5)
      console.error('Failed to save document:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      let message = 'Failed to save document.';
      
      if (errorMsg.includes('permission')) {
        message = 'Permission denied. Unable to save document.';
      } else if (errorMsg.includes('space') || errorMsg.includes('quota')) {
        message = 'Not enough storage space to save document.';
      }
      
      // Provide retry option (Requirement 7.5)
      setMessageBox({
        show: true,
        title: 'Error',
        message: `${message}\n\nWould you like to retry?`,
        type: 'confirm',
        onConfirm: () => {
          // Retry save operation
          setMessageBox(null);
          handleSave();
        },
        onNo: () => {
          // Don't retry
          setMessageBox(null);
        },
      });
    }
  };

  const handleUndo = () => {
    console.log('Undo');
    // Undo is handled by browser's native undo for textarea
    if (textareaRef.current) {
      document.execCommand('undo');
    }
  };

  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  const handleSummarize = async () => {
    // Validate document content is not empty (Requirement 4.4)
    if (!content.trim()) {
      setMessageBox({
        show: true,
        title: 'Notepad',
        message: 'No text to summarize',
        type: 'info',
        onConfirm: () => {
          setMessageBox(null);
        },
      });
      return;
    }

    // Show loading indicator (Requirement 8.4)
    setIsLoading(true);

    try {
      // Call AI Engine summarize() function with 30-second timeout (Requirement 4.1, 8.5)
      const summarizePromise = aiClient.summarize(content);
      aiOperationRef.current = summarizePromise;

      const result = await summarizePromise;

      // Display result in SummaryPanel (Requirement 4.2)
      setSummary(result);
      
      console.log('Summary generated successfully');
    } catch (error) {
      // Handle errors with user-friendly messages (Requirement 8.3, 8.5)
      console.error('Failed to generate summary:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      let message = 'Failed to generate summary. Please try again.';
      if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        message = 'Summary operation timed out. Please try again with shorter text.';
      } else if (errorMsg.includes('cancelled')) {
        message = 'Summary operation was cancelled.';
      }
      
      setMessageBox({
        show: true,
        title: 'Error',
        message,
        type: 'error',
        onConfirm: () => {
          setMessageBox(null);
        },
      });
    } finally {
      setIsLoading(false);
      aiOperationRef.current = null;
    }
  };

  const handleRewrite = async (style?: string) => {
    // Validate text selection exists (Requirement 5.1, 5.3)
    if (!selectedText || selectedText.trim().length === 0) {
      setMessageBox({
        show: true,
        title: 'Notepad',
        message: 'Please select text to rewrite',
        type: 'info',
        onConfirm: () => {
          setMessageBox(null);
        },
      });
      return;
    }

    // Show loading indicator during AI operation (Requirement 8.4)
    setIsLoading(true);

    try {
      // Call AI Engine rewrite() function with selected text (Requirement 5.1, 5.4)
      const rewriteStyle = style as 'formal' | 'casual' | 'concise' | undefined;
      const rewritePromise = aiClient.rewrite(selectedText, rewriteStyle);
      aiOperationRef.current = rewritePromise;

      const rewrittenText = await rewritePromise;

      // Replace selected text with AI result (Requirement 5.2)
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        const newContent = 
          content.substring(0, start) + 
          rewrittenText + 
          content.substring(end);
        
        setContent(newContent);
        setHasUnsavedChanges(true);
        
        // Set cursor position after the rewritten text
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = start + rewrittenText.length;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
            textareaRef.current.focus();
          }
        }, 0);
      }
      
      console.log('Text rewritten successfully with style:', style || 'default');
    } catch (error) {
      // Handle errors with user-friendly messages (Requirement 8.3)
      console.error('Failed to rewrite text:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      let message = 'Failed to rewrite text. Please try again.';
      if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        message = 'Rewrite operation timed out. Please try again with shorter text.';
      } else if (errorMsg.includes('cancelled')) {
        message = 'Rewrite operation was cancelled.';
      }
      
      setMessageBox({
        show: true,
        title: 'Error',
        message,
        type: 'error',
        onConfirm: () => {
          setMessageBox(null);
        },
      });
    } finally {
      setIsLoading(false);
      aiOperationRef.current = null;
    }
  };

  // Load document on mount if documentId is provided
  useEffect(() => {
    if (initialDocumentId && !initialContent) {
      loadDocument(initialDocumentId);
    }
  }, []); // Only run on mount

  // Update window title when filename or unsaved state changes
  useEffect(() => {
    const unsavedIndicator = hasUnsavedChanges ? '*' : '';
    const title = `Notepad - ${unsavedIndicator}${filename}`;
    updateWindowTitle(windowId, title);
  }, [filename, hasUnsavedChanges, windowId, updateWindowTitle]);

  // Save on component unmount (window close)
  useEffect(() => {
    return () => {
      // Save document when component unmounts
      try {
        const filePath = `/documents/${filename}.txt`;
        vfs.writeFile(filePath, content);
        console.log('Document saved on close:', filePath);
      } catch (error) {
        console.error('Failed to save on close:', error);
      }
    };
  }, [content, filename]); // Dependencies ensure we save the latest state

  // Save on browser window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save document before page unload
      try {
        const filePath = `/documents/${filename}.txt`;
        vfs.writeFile(filePath, content);
        console.log('Document saved on browser close:', filePath);
      } catch (error) {
        console.error('Failed to save on browser close:', error);
      }

      // Show confirmation if there are unsaved changes
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, filename, hasUnsavedChanges]);

  // Autosave effect - debounced 2 seconds after last edit
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const filePath = `/documents/${filename}.txt`;
        vfs.writeFile(filePath, content);
        setHasUnsavedChanges(false);
        console.log('Document autosaved:', filePath);
      } catch (error) {
        // Handle autosave errors (Requirement 7.5)
        console.error('Autosave failed:', error);
        
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        let message = 'Autosave failed.';
        
        if (errorMsg.includes('permission')) {
          message = 'Autosave failed: Permission denied.';
        } else if (errorMsg.includes('space') || errorMsg.includes('quota')) {
          message = 'Autosave failed: Not enough storage space.';
        }
        
        // Show error with retry option
        setMessageBox({
          show: true,
          title: 'Autosave Error',
          message: `${message}\n\nWould you like to save manually?`,
          type: 'confirm',
          onConfirm: () => {
            // Try manual save
            setMessageBox(null);
            handleSave();
          },
          onNo: () => {
            // Continue without saving
            setMessageBox(null);
          },
        });
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, hasUnsavedChanges, filename]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - New document
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNew();
      }
      // Ctrl+O - Open document
      else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
      // Ctrl+S - Save document
      else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Shift+S - Summarize
      else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (!isLoading) {
          handleSummarize();
        }
      }
      // Ctrl+A - Select all
      else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Ctrl+Z - Undo
      else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, isLoading]); // Re-bind when content or loading state changes

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Clear summary when user edits document (Requirement 4.5)
    if (summary) {
      setSummary(null);
    }
  };

  const handleSelectionChange = (selected: string) => {
    setSelectedText(selected);
  };

  return (
    <div className="flex flex-col h-full bg-win95-gray">
      <MenuBar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onUndo={handleUndo}
        onSelectAll={handleSelectAll}
        onSummarize={handleSummarize}
        onRewrite={handleRewrite}
        isLoading={isLoading}
      />
      <TextEditor
        content={content}
        onChange={handleContentChange}
        onSelectionChange={handleSelectionChange}
        textareaRef={textareaRef}
      />
      
      {/* Summary Panel */}
      {summary && !isLoading && (
        <SummaryPanel
          summary={summary}
          onClose={() => setSummary(null)}
        />
      )}
      
      {/* Status Bar */}
      <StatusBar
        characterCount={content.length}
        isLoading={isLoading}
      />
      
      {/* File Picker Dialog */}
      {showFilePickerDialog && (
        <FilePickerDialog
          onSelect={handleFileSelect}
          onCancel={() => setShowFilePickerDialog(false)}
        />
      )}
      
      {/* Message Box Dialog */}
      {messageBox && messageBox.show && (
        <MessageBox
          title={messageBox.title}
          message={messageBox.message}
          type={messageBox.type}
          onConfirm={messageBox.onConfirm}
          onNo={messageBox.onNo}
          onCancel={messageBox.onCancel}
        />
      )}
    </div>
  );
};
