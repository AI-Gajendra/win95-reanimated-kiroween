/**
 * Application Registry
 * 
 * Central registry of all available applications in Win95 Reanimated.
 * Applications are registered here with their metadata and default window properties.
 */

import { AppDefinition } from './types';
import { Notepad } from '../../apps/notepad/Notepad';
import { Explorer } from '../../apps/explorer/Explorer';
import { TestApp } from '../../apps/test-app/TestApp';

/**
 * Application Registry
 * 
 * Maps application IDs to their definitions including:
 * - Display name and icon
 * - Component to render
 * - Default window size and position
 */
export const APP_REGISTRY: Record<string, AppDefinition> = {
  notepad: {
    id: 'notepad',
    name: 'Notepad',
    icon: '📝',
    component: Notepad,
    defaultSize: { width: 600, height: 400 },
    defaultPosition: { x: 100, y: 100 }
  },
  
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    icon: '📁',
    component: Explorer,
    defaultSize: { width: 800, height: 600 },
    defaultPosition: { x: 120, y: 120 }
  },
  
  testapp: {
    id: 'testapp',
    name: 'Test Application',
    icon: '🧪',
    component: TestApp,
    defaultSize: { width: 400, height: 300 },
    defaultPosition: { x: 150, y: 150 }
  }
};

/**
 * Get all registered applications
 * @returns Array of all app definitions
 */
export function getRegisteredApps(): AppDefinition[] {
  return Object.values(APP_REGISTRY);
}

/**
 * Get a specific app definition by ID
 * @param appId - The application identifier
 * @returns The app definition or undefined if not found
 */
export function getAppDefinition(appId: string): AppDefinition | undefined {
  return APP_REGISTRY[appId];
}

/**
 * Check if an application is registered
 * @param appId - The application identifier
 * @returns True if the app exists in the registry
 */
export function isAppRegistered(appId: string): boolean {
  return appId in APP_REGISTRY;
}
