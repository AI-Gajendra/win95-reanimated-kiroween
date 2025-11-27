/**
 * Desktop Component
 * 
 * Root desktop component that orchestrates the boot sequence and desktop workspace.
 * Manages boot state and transition from boot screen to desktop.
 */

import React, { useState } from 'react';
import { BootScreen } from './BootScreen';
import { DesktopWorkspace } from './DesktopWorkspace';
import { WindowManagerProvider } from '../../core/window-manager/WindowContext';

interface DesktopProps {
  bootDuration?: number; // milliseconds, default 3000
}

export const Desktop: React.FC<DesktopProps> = ({ bootDuration = 3000 }) => {
  const [isBooting, setIsBooting] = useState(true);

  const handleBootComplete = () => {
    setIsBooting(false);
  };

  return (
    <WindowManagerProvider>
      {isBooting ? (
        <BootScreen onBootComplete={handleBootComplete} duration={bootDuration} />
      ) : (
        <DesktopWorkspace />
      )}
    </WindowManagerProvider>
  );
};
