/**
 * onAppLaunch Hook
 * 
 * Triggered when the Win95 Reanimated application launches.
 * Performs initial diagnostics and logs system status using the AI Engine.
 * 
 * This hook demonstrates Kiro's ability to run automated tasks on application startup.
 */

import { aiClient } from '../core/ai-engine/aiClient';
import { vfs } from '../core/file-system/vfs';

export async function onAppLaunch() {
  console.log('[Hook] onAppLaunch triggered');
  
  try {
    // Log application startup
    const startTime = new Date();
    console.log(`Win95 Reanimated launched at ${startTime.toLocaleTimeString()}`);
    
    // Check VFS status
    const rootContents = vfs.readFolder('/');
    console.log(`VFS initialized with ${rootContents.length} root items`);
    
    // Optional: Use AI to generate a welcome message
    const welcomeQuery = 'Generate a brief welcome message for Win95 Reanimated';
    const welcomeMessage = await aiClient.interpret(welcomeQuery);
    
    console.log('[Hook] System diagnostic complete');
    console.log('[Hook] Welcome:', welcomeMessage);
    
    // Create a system log file
    const logContent = `
Win95 Reanimated - System Log
==============================
Launch Time: ${startTime.toISOString()}
VFS Status: Initialized (${rootContents.length} root items)
AI Engine: ${aiClient.getUsageStats().totalOperations === 0 ? 'Ready' : 'Active'}

System is ready for use.
    `.trim();
    
    vfs.writeFile('/system.log', logContent);
    console.log('[Hook] System log created at /system.log');
    
  } catch (error) {
    console.error('[Hook] onAppLaunch error:', error);
  }
}

// Hook metadata for Kiro
export const hookMetadata = {
  name: 'onAppLaunch',
  description: 'Runs diagnostics and initialization tasks when the application launches',
  trigger: 'application.launch',
  enabled: true
};
