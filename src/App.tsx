/**
 * Main Application Component
 * 
 * Root component that renders the Win95 desktop.
 */

import React, { useState } from 'react';
import { WindowManagerProvider } from '@core/window-manager/WindowContext';
import { BootScreen } from '@/components';

function App() {
  const [isBooting, setIsBooting] = useState(true);

  const handleBootComplete = () => {
    setIsBooting(false);
  };

  return (
    <WindowManagerProvider>
      {isBooting ? (
        <BootScreen onBootComplete={handleBootComplete} duration={3000} />
      ) : (
        <div 
          className="w-screen h-screen bg-win95-teal flex items-center justify-center"
          style={{
            fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', sans-serif"
          }}
        >
          <div className="text-white text-2xl font-bold">
            Win95 Reanimated
          </div>
          <div className="absolute bottom-4 text-white text-sm">
            Core systems initialized. Desktop UI coming soon...
          </div>
        </div>
      )}
    </WindowManagerProvider>
  );
}

export default App;
