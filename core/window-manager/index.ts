/**
 * Window Manager Module Exports
 */

export { WindowManagerProvider, useWindowManager } from './WindowContext';
export { WindowManager } from './WindowManager';
export { Window } from './Window';
export { APP_REGISTRY, getRegisteredApps, getAppDefinition, isAppRegistered } from './appRegistry';
export type { WindowState, WindowProps, AppDefinition } from './types';
