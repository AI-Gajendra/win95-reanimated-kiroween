/**
 * WindowManager Component
 * 
 * Renders all active windows from the WindowContext.
 * Manages the window layer and coordinates window rendering.
 */

import React from 'react';
import { useWindowManager } from './WindowContext';
import { Window } from './Window';

export const WindowManager: React.FC = () => {
  const { windows } = useWindowManager();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {windows.map(window => (
        <div key={window.id} className="pointer-events-auto">
          <Window window={window} />
        </div>
      ))}
    </div>
  );
};
