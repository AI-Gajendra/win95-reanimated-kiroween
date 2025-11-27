/**
 * onFileCreate Hook
 * 
 * Triggered when a new file is created in the VFS.
 * Optionally summarizes the file content and stores it in file metadata.
 * 
 * This hook demonstrates automatic AI-driven content analysis on file creation.
 */

import { aiClient } from '../core/ai-engine/aiClient';
import { vfs } from '../core/file-system/vfs';

/**
 * Handle file creation event
 * @param {Object} event - File creation event with path and content
 */
export async function onFileCreate(event) {
  console.log('[Hook] onFileCreate triggered for:', event.path);
  
  try {
    const { path } = event;
    
    // Read the file content
    const content = vfs.readFile(path);
    
    // Only summarize text files with sufficient content
    if (!isTextFile(path) || content.length < 100) {
      console.log('[Hook] Skipping summarization (not a text file or too short)');
      return;
    }
    
    console.log('[Hook] Generating summary for new file...');
    
    // Generate summary using AI Engine
    const summary = await aiClient.summarize(content);
    
    // Store summary in file metadata (simulated with a companion file)
    const metadataPath = `${path}.meta`;
    const metadata = {
      path,
      summary,
      createdAt: new Date().toISOString(),
      wordCount: content.split(/\s+/).length,
      characterCount: content.length
    };
    
    vfs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('[Hook] Summary generated and stored:', summary);
    
  } catch (error) {
    console.error('[Hook] onFileCreate error:', error);
  }
}

/**
 * Check if a file is a text file based on extension
 */
function isTextFile(path) {
  const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.html', '.css'];
  return textExtensions.some(ext => path.toLowerCase().endsWith(ext));
}

// Hook metadata for Kiro
export const hookMetadata = {
  name: 'onFileCreate',
  description: 'Automatically summarizes new text files and stores metadata',
  trigger: 'vfs.fileCreated',
  enabled: true,
  parameters: {
    event: 'object'
  }
};
