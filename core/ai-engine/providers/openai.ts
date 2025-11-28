/**
 * OpenAI Provider
 * 
 * Provides AI capabilities using OpenAI's chat completions API.
 * Implements summarize, rewrite, interpret, and explainFolder operations.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 8.2
 */

import { AIProvider } from './base';
import { Intent, FolderData, FolderExplanation, RewriteStyle } from '../types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message: {
    content: string;
  };
  finish_reason: string;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';
  private model = 'gpt-3.5-turbo';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }


  /**
   * Makes a request to the OpenAI API
   * Handles errors and rate limits gracefully
   */
  private async makeRequest(
    messages: OpenAIMessage[],
    maxTokens: number = 500
  ): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as OpenAIError;
      const errorMessage = errorData.error?.message || response.statusText;
      
      // Handle specific error types
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      if (response.status === 503) {
        throw new Error('AI service unavailable');
      }
      
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    const data = await response.json() as OpenAIResponse;
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    return data.choices[0].message.content.trim();
  }

  /**
   * Summarizes text using OpenAI chat completions
   * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async summarize(text: string): Promise<string> {
    if (text.length < 50) {
      return "Text too short to summarize";
    }

    // Truncate very long text to stay within token limits
    const truncatedText = text.length > 10000 ? text.substring(0, 10000) + '...' : text;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes text concisely. Create summaries that are approximately 20-30% of the original length while capturing the main points and key information.'
      },
      {
        role: 'user',
        content: `Please summarize the following text:\n\n${truncatedText}`
      }
    ];

    return this.makeRequest(messages, 300);
  }


  /**
   * Rewrites text according to the specified style
   * Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async rewrite(text: string, style?: RewriteStyle): Promise<string> {
    let styleInstruction: string;

    switch (style) {
      case 'formal':
        styleInstruction = 'Rewrite the text in a formal, professional tone. Use complete sentences, avoid contractions, and maintain a business-appropriate style.';
        break;
      case 'casual':
        styleInstruction = 'Rewrite the text in a casual, conversational tone. Use contractions where natural and make it feel friendly and approachable.';
        break;
      case 'concise':
        styleInstruction = 'Rewrite the text to be more concise. Remove unnecessary words and phrases while preserving the core meaning. Aim for approximately 70% of the original length.';
        break;
      default:
        styleInstruction = 'Improve the clarity and grammar of the text without changing its overall tone. Fix any errors and make it flow better.';
    }

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a helpful writing assistant. ${styleInstruction} Return only the rewritten text without any explanations or preamble.`
      },
      {
        role: 'user',
        content: text
      }
    ];

    return this.makeRequest(messages, 500);
  }

  /**
   * Interprets natural language queries and extracts user intent
   * Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async interpret(query: string): Promise<Intent> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an intent classifier for a Windows 95-style desktop application. Analyze the user's query and determine their intent.

Respond with a JSON object containing:
- type: one of "openApp", "createDocument", "search", or "unknown"
- confidence: a number between 0 and 1 indicating how confident you are
- parameters: an object with relevant parameters

For "openApp" intent, include appId (one of: "notepad", "explorer")
For "createDocument" intent, include appId and optionally content
For "search" intent, include searchTerm

Examples:
- "open notepad" -> {"type": "openApp", "confidence": 0.95, "parameters": {"appId": "notepad"}}
- "create a todo list" -> {"type": "createDocument", "confidence": 0.9, "parameters": {"appId": "notepad", "content": "# Todo List\\n\\n- [ ] Task 1"}}
- "find my documents" -> {"type": "search", "confidence": 0.8, "parameters": {"searchTerm": "documents"}}

Respond ONLY with the JSON object, no other text.`
      },
      {
        role: 'user',
        content: query
      }
    ];

    try {
      const response = await this.makeRequest(messages, 200);
      const parsed = JSON.parse(response) as Intent;
      
      // Validate the response structure
      if (!parsed.type || !['openApp', 'createDocument', 'search', 'unknown'].includes(parsed.type)) {
        return this.getDefaultIntent(query);
      }
      
      return {
        type: parsed.type,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        parameters: parsed.parameters || {}
      };
    } catch {
      // If parsing fails, return a search intent as fallback
      return this.getDefaultIntent(query);
    }
  }

  private getDefaultIntent(query: string): Intent {
    return {
      type: 'search',
      confidence: 0.5,
      parameters: { searchTerm: query }
    };
  }


  /**
   * Analyzes folder contents and provides explanations and recommendations
   * Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async explainFolder(data: FolderData): Promise<FolderExplanation> {
    const fileList = data.filenames.slice(0, 50).join('\n'); // Limit to 50 files
    const sampleContent = data.sampleContents.slice(0, 3).join('\n---\n'); // Limit samples

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a helpful file organization assistant. Analyze the folder contents and provide insights.

Respond with a JSON object containing:
- description: A natural language description of the folder (2-3 sentences) analyzing file types, naming patterns, and content themes
- recommendations: An array of 2-5 actionable suggestions for organization improvements, categorization, or cleanup actions

Be specific and helpful. Focus on practical advice.

Respond ONLY with the JSON object, no other text.`
      },
      {
        role: 'user',
        content: `Folder path: ${data.path}

Files in folder:
${fileList}

Sample file contents:
${sampleContent || 'No content samples available'}`
      }
    ];

    try {
      const response = await this.makeRequest(messages, 400);
      const parsed = JSON.parse(response) as { description: string; recommendations: string[] };
      
      return {
        description: parsed.description || `This folder contains ${data.filenames.length} files.`,
        recommendations: Array.isArray(parsed.recommendations) 
          ? parsed.recommendations.slice(0, 5) 
          : ['Consider organizing files by type or date'],
        folderPath: data.path
      };
    } catch {
      // Fallback response if parsing fails
      return {
        description: `This folder at "${data.path}" contains ${data.filenames.length} file(s).`,
        recommendations: [
          'Consider organizing files by type or date',
          'Add descriptive names to files for easier identification'
        ],
        folderPath: data.path
      };
    }
  }
}
