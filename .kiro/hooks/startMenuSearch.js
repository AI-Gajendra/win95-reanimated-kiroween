/**
 * startMenuSearch Hook
 * 
 * Triggered when the user types a query in the Start Menu search box.
 * Uses the AI Engine to interpret natural language queries and map them to actions.
 * 
 * This hook demonstrates AI-powered intent recognition for user commands.
 */

import { aiClient } from '../core/ai-engine/aiClient';

/**
 * Process a Start Menu search query
 * @param {string} query - The user's natural language query
 * @param {Object} context - Context object with window manager and app registry
 * @returns {Promise<Object>} - Action result with type and data
 */
export async function startMenuSearch(query, context) {
  console.log('[Hook] startMenuSearch triggered with query:', query);
  
  try {
    // Use AI Engine to interpret the query
    const intent = await aiClient.interpret(query);
    console.log('[Hook] Interpreted intent:', intent);
    
    // Execute action based on intent type
    switch (intent.type) {
      case 'openApp':
        return await handleOpenApp(intent, context);
      
      case 'createDocument':
        return await handleCreateDocument(intent, context);
      
      case 'search':
        return await handleSearch(intent, context);
      
      case 'unknown':
      default:
        return {
          success: false,
          message: `I'm not sure what you mean by "${query}". Try "open notepad" or "create a todo list".`,
          suggestions: [
            'open notepad',
            'open explorer',
            'create a todo list',
            'search for documents'
          ]
        };
    }
    
  } catch (error) {
    console.error('[Hook] startMenuSearch error:', error);
    return {
      success: false,
      message: 'Failed to process your request. Please try again.',
      error: error.message
    };
  }
}

/**
 * Handle opening an application
 */
async function handleOpenApp(intent, context) {
  const { appId } = intent.parameters;
  const { windowManager, appRegistry } = context;
  
  if (!appRegistry[appId]) {
    return {
      success: false,
      message: `Application "${appId}" not found.`,
      suggestions: Object.keys(appRegistry)
    };
  }
  
  // Open the application window
  const windowId = windowManager.openWindow(appId);
  
  return {
    success: true,
    message: `Opening ${appRegistry[appId].name}...`,
    action: 'openApp',
    appId,
    windowId
  };
}

/**
 * Handle creating a document with prefilled content
 */
async function handleCreateDocument(intent, context) {
  const { appId, content } = intent.parameters;
  const { windowManager, appRegistry } = context;
  
  if (!appRegistry[appId]) {
    return {
      success: false,
      message: `Application "${appId}" not found.`
    };
  }
  
  // Open the application with initial content
  const windowId = windowManager.openWindow(appId, {
    initialContent: content || ''
  });
  
  return {
    success: true,
    message: `Created new document in ${appRegistry[appId].name}`,
    action: 'createDocument',
    appId,
    windowId
  };
}

/**
 * Handle search queries
 */
async function handleSearch(intent, context) {
  const { searchTerm } = intent.parameters;
  const { vfs } = context;
  
  // Search for files matching the term
  const results = searchFiles(vfs, searchTerm);
  
  if (results.length === 0) {
    return {
      success: false,
      message: `No files found matching "${searchTerm}".`
    };
  }
  
  return {
    success: true,
    message: `Found ${results.length} file(s) matching "${searchTerm}"`,
    action: 'search',
    results
  };
}

/**
 * Simple file search implementation
 */
function searchFiles(vfs, searchTerm) {
  const results = [];
  const lowerTerm = searchTerm.toLowerCase();
  
  function searchFolder(path) {
    try {
      const items = vfs.readFolder(path);
      
      for (const item of items) {
        if (item.name.toLowerCase().includes(lowerTerm)) {
          results.push(item);
        }
        
        if (item.type === 'folder') {
          searchFolder(item.path);
        }
      }
    } catch (error) {
      // Skip folders that can't be read
    }
  }
  
  searchFolder('/');
  return results;
}

// Hook metadata for Kiro
export const hookMetadata = {
  name: 'startMenuSearch',
  description: 'Interprets natural language queries in the Start Menu and executes corresponding actions',
  trigger: 'startMenu.search',
  enabled: true,
  parameters: {
    query: 'string',
    context: 'object'
  }
};
