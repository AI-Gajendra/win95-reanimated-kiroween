/**
 * MessageBox Component
 * 
 * Win95-style message box dialog that supports different message types
 * (info, error, confirm) with appropriate styling and buttons.
 */

import React from 'react';

/**
 * Message type determines the icon and button configuration
 */
export type MessageType = 'info' | 'error' | 'confirm';

/**
 * Props for the MessageBox component
 */
export interface MessageBoxProps {
  /** The title displayed in the dialog title bar */
  title: string;
  /** The message content to display */
  message: string;
  /** The type of message box (info, error, confirm) */
  type: MessageType;
  /** Callback when OK button is clicked (for info/error) or Yes is clicked (for confirm) */
  onConfirm: () => void;
  /** Callback when No button is clicked (for confirm type only) */
  onNo?: () => void;
  /** Callback when Cancel button is clicked (for confirm type only) */
  onCancel?: () => void;
}

/**
 * Get the appropriate icon for the message type
 */
const getIcon = (type: MessageType): string => {
  switch (type) {
    case 'info':
      return 'ℹ️';
    case 'error':
      return '❌';
    case 'confirm':
      return '⚠️';
    default:
      return 'ℹ️';
  }
};

/**
 * MessageBox Component
 * 
 * Displays a Win95-style modal dialog with message and appropriate buttons
 * based on the message type.
 */
export const MessageBox: React.FC<MessageBoxProps> = ({
  title,
  message,
  type,
  onConfirm,
  onNo,
  onCancel,
}) => {
  const icon = getIcon(type);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes dialog (calls appropriate handler)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (type === 'confirm' && onCancel) {
          onCancel();
        } else if (type === 'confirm' && onNo) {
          onNo();
        } else {
          onConfirm();
        }
      }
      // Enter key confirms
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, onConfirm, onNo, onCancel]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-box-title"
      aria-describedby="message-box-content"
    >
      <div className="bg-win95-gray win95-outset p-1 min-w-[300px] max-w-[500px]">
        {/* Title Bar */}
        <div className="bg-win95-navy text-win95-white px-2 py-1 flex items-center justify-between mb-1">
          <span id="message-box-title" className="font-win95 text-[11px] font-bold">{title}</span>
        </div>
        
        {/* Dialog Content */}
        <div className="bg-win95-gray p-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</div>
            <p id="message-box-content" className="font-win95 text-[11px] text-win95-black break-words">
              {message}
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-2">
            {type === 'confirm' ? (
              <>
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
                  onClick={onConfirm}
                  autoFocus
                  aria-label="Confirm action"
                >
                  Yes
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
                  onClick={onNo}
                  aria-label="Decline action"
                >
                  No
                </button>
                {onCancel && (
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
                    aria-label="Cancel action"
                  >
                    Cancel
                  </button>
                )}
              </>
            ) : (
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
                onClick={onConfirm}
                autoFocus
                aria-label="Acknowledge message"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
