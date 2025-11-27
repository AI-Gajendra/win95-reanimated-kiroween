/**
 * Test Application
 * 
 * Simple test app for demonstrating window functionality
 */

import React from 'react';

interface TestAppProps {
  windowId: string;
}

export const TestApp: React.FC<TestAppProps> = ({ windowId }) => {
  return (
    <div className="p-4">
      <h2 className="font-win95 text-win95-black mb-2">Test Application</h2>
      <p className="font-win95 text-win95-black text-[11px]">
        Window ID: {windowId}
      </p>
      <p className="font-win95 text-win95-black text-[11px] mt-2">
        This is a test window. You can:
      </p>
      <ul className="list-disc ml-6 mt-1 font-win95 text-win95-black text-[11px]">
        <li>Drag the window by the title bar</li>
        <li>Click to focus</li>
        <li>Minimize, maximize, or close</li>
      </ul>
    </div>
  );
};
