/**
 * Notepad Application
 * 
 * Simple text editor with Win95 styling
 */

import React, { useState } from 'react';

interface NotepadProps {
  windowId: string;
  initialContent?: string;
}

export const Notepad: React.FC<NotepadProps> = ({ windowId, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="flex flex-col h-full bg-win95-gray">
      {/* Menu bar placeholder */}
      <div className="flex gap-2 px-2 py-1 border-b-2 border-win95-dark-gray">
        <span className="font-win95 text-[11px] text-win95-black">File</span>
        <span className="font-win95 text-[11px] text-win95-black">Edit</span>
        <span className="font-win95 text-[11px] text-win95-black">Search</span>
        <span className="font-win95 text-[11px] text-win95-black">Help</span>
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="
          flex-1
          p-1
          bg-win95-white
          text-win95-black
          font-['Courier_New',_'Courier',_monospace]
          text-[12px]
          resize-none
          focus:outline-none
          border-none
        "
        style={{
          fontFamily: "'Courier New', 'Courier', monospace"
        }}
        placeholder="Type your text here..."
      />
    </div>
  );
};
