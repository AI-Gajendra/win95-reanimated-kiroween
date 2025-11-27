/**
 * Abstract base class for AI providers
 */

import { Intent, FolderData, FolderExplanation, RewriteStyle } from '../types';

export abstract class AIProvider {
  abstract summarize(text: string): Promise<string>;
  abstract rewrite(text: string, style?: RewriteStyle): Promise<string>;
  abstract interpret(query: string): Promise<Intent>;
  abstract explainFolder(data: FolderData): Promise<FolderExplanation>;
}
