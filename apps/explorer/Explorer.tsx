/**
 * File Explorer Application
 * 
 * Browse and manage files in the virtual file system
 */

import React, { useState } from 'react';

interface ExplorerProps {
  windowId: string;
  initialPath?: string;
}

export const Explorer: React.FC<ExplorerProps> = ({ windowId, initialPath = '/' }) => {
  const [currentPath, setCurrentPath] = useState(initialPath);

  // Placeholder file list
  const files = [
    { name: 'My Documents', type: 'folder', icon: '📁' },
    { name: 'My Computer', type: 'folder', icon: '💻' },
    { name: 'Network Neighborhood', type: 'folder', icon: '🌐' },
    { name: 'Recycle Bin', type: 'folder', icon: '🗑️' },
  ];

  return (
    <div className="flex flex-col h-full bg-win95-gray">
      {/* Menu bar */}
      <div className="flex gap-2 px-2 py-1 border-b-2 border-win95-dark-gray">
        <span className="font-win95 text-[11px] text-win95-black">File</span>
        <span className="font-win95 text-[11px] text-win95-black">Edit</span>
        <span className="font-win95 text-[11px] text-win95-black">View</span>
        <span className="font-win95 text-[11px] text-win95-black">Help</span>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b-2 border-win95-dark-gray">
        <span className="font-win95 text-[11px] text-win95-black">Address:</span>
        <input
          type="text"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          className="
            flex-1
            px-2 py-0.5
            bg-win95-white
            text-win95-black
            text-[11px]
            win95-inset
            focus:outline-none
          "
          style={{
            fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', sans-serif"
          }}
        />
      </div>

      {/* File list */}
      <div className="flex-1 p-2 bg-win95-white overflow-auto">
        <div className="grid grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="
                flex flex-col items-center
                p-2
                cursor-pointer
                hover:bg-win95-navy hover:text-win95-white
                text-win95-black
              "
            >
              <span className="text-3xl mb-1">{file.icon}</span>
              <span className="font-win95 text-[11px] text-center">{file.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-2 py-1 border-t-2 border-win95-dark-gray">
        <span className="font-win95 text-[11px] text-win95-black">
          {files.length} object(s)
        </span>
      </div>
    </div>
  );
};
