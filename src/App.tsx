/**
 * Main Application Component
 * 
 * Root component that renders the Win95 desktop.
 * When running in Electron, includes the custom title bar for window controls.
 */

import { WindowManagerProvider } from '@core/window-manager/WindowContext';
import { Desktop } from '@/components';
import { ElectronTitleBar } from '@/components/ElectronTitleBar';
import type { ElectronAPI } from '../electron/electron.d';

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

function App() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Electron title bar - only rendered in Electron environment */}
      {isElectron && <ElectronTitleBar />}
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <WindowManagerProvider>
          <Desktop bootDuration={3000} />
        </WindowManagerProvider>
      </div>
    </div>
  );
}

export default App;
