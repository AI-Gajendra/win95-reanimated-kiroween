/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize VFS and AI Engine (imports trigger initialization)
import '@core/file-system/vfs';
import '@core/ai-engine/aiClient';

console.log('[Win95 Reanimated] Application starting...');
console.log('[Win95 Reanimated] VFS and AI Engine initialized');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
