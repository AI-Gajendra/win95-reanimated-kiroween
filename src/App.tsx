/**
 * Main Application Component
 * 
 * Root component that renders the Win95 desktop.
 */

import React from 'react';
import { WindowManagerProvider } from '@core/window-manager/WindowContext';
import { Desktop } from '@/components';

function App() {
  return (
    <WindowManagerProvider>
      <Desktop bootDuration={3000} />
    </WindowManagerProvider>
  );
}

export default App;
