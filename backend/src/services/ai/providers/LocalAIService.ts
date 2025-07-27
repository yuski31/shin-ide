import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../utils/logger';

export class LocalAIService implements AIProvider {
  private logger = new Logger('LocalAIService');
  private usageStats = {
    totalRequests: 0,
    lastRequest: null as Date | null,
  };

  constructor() {
    // Local AI service doesn't require API keys
  }

  getName(): string {
    return 'Local AI';
  }

  supportsCapability(capability: AICapability): boolean {
    // Local AI supports basic capabilities with rule-based responses
    const supportedCapabilities = [
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.DOCUMENTATION,
      AICapability.CHAT_COMPLETION,
    ];
    
    return supportedCapabilities.includes(capability);
  }

  getSupportedCapabilities(): AICapability[] {
    return [
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.DOCUMENTATION,
      AICapability.CHAT_COMPLETION,
    ];
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Processing request with Local AI for capability: ${request.capability}`);

      let content = '';
      
      switch (request.capability) {
        case AICapability.CODE_EXPLANATION:
          content = this.explainCode(request);
          break;
        case AICapability.CODE_DEBUGGING:
          content = this.debugCode(request);
          break;
        case AICapability.DOCUMENTATION:
          content = this.generateDocumentation(request);
          break;
        case AICapability.CHAT_COMPLETION:
          content = this.chatCompletion(request);
          break;
        default:
          content = this.getDefaultResponse(request);
      }

      const response: AIResponse = {
        content,
        metadata: {
          provider: 'local',
          processingTime: Date.now() - startTime,
        },
      };

      // Update usage stats
      this.updateUsageStats();

      return response;
    } catch (error) {
      this.logger.error('Local AI processing error:', error);
      throw new Error(`Local AI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private explainCode(request: AIRequest): string {
    const { context } = request;
    const language = context?.language || 'unknown';
    const code = context?.code || '';

    if (!code) {
      return 'No code provided for explanation.';
    }

    // Basic code analysis
    const lines = code.split('\n').filter(line => line.trim());
    const functions = this.extractFunctions(code, language);
    const variables = this.extractVariables(code, language);
    const imports = this.extractImports(code, language);

    let explanation = `## Code Explanation\n\n`;
    explanation += `**Language:** ${language}\n`;
    explanation += `**Lines of code:** ${lines.length}\n\n`;

    if (imports.length > 0) {
      explanation += `### Imports/Dependencies\n`;
      imports.forEach(imp => {
        explanation += `- ${imp}\n`;
      });
      explanation += '\n';
    }

    if (functions.length > 0) {
      explanation += `### Functions/Methods\n`;
      functions.forEach(func => {
        explanation += `- **${func.name}**: ${func.description}\n`;
      });
      explanation += '\n';
    }

    if (variables.length > 0) {
      explanation += `### Variables\n`;
      variables.forEach(variable => {
        explanation += `- ${variable}\n`;
      });
      explanation += '\n';
    }

    explanation += `### Code Structure\n`;
    explanation += `This ${language} code contains ${lines.length} lines with ${functions.length} functions and ${variables.length} variables. `;
    
    if (code.includes('class ')) {
      explanation += 'It appears to define one or more classes. ';
    }
    
    if (code.includes('async ') || code.includes('await ')) {
      explanation += 'It uses asynchronous programming patterns. ';
    }
    
    if (code.includes('try') && code.includes('catch')) {
      explanation += 'It includes error handling with try-catch blocks. ';
    }

    explanation += '\n\n*Note: This is a basic analysis. For more detailed explanations, consider using an AI-powered service.*';

    return explanation;
  }

  private debugCode(request: AIRequest): string {
    const { context } = request;
    const language = context?.language || 'unknown';
    const code = context?.code || '';
    const error = context?.error || '';

    if (!code || !error) {
      return 'Please provide both code and error message for debugging assistance.';
    }

    let suggestions = `## Debugging Suggestions\n\n`;
    suggestions += `**Error:** ${error}\n\n`;
    suggestions += `### Common Solutions:\n\n`;

    // Basic error pattern matching
    if (error.toLowerCase().includes('undefined')) {
      suggestions += `1. **Undefined Variable/Property**: Check if all variables are properly declared and initialized.\n`;
      suggestions += `2. **Null/Undefined Access**: Verify that objects exist before accessing their properties.\n`;
      suggestions += `3. **Scope Issues**: Ensure variables are accessible in the current scope.\n\n`;
    }

    if (error.toLowerCase().includes('syntax')) {
      suggestions += `1. **Syntax Error**: Check for missing brackets, parentheses, or semicolons.\n`;
      suggestions += `2. **Typos**: Look for misspelled keywords or variable names.\n`;
      suggestions += `3. **Indentation**: Ensure proper code indentation (especially in Python).\n\n`;
    }

    if (error.toLowerCase().includes('type')) {
      suggestions += `1. **Type Mismatch**: Verify that variables are of the expected type.\n`;
      suggestions += `2. **Function Arguments**: Check if correct number and types of arguments are passed.\n`;
      suggestions += `3. **Return Types**: Ensure functions return the expected data type.\n\n`;
    }

    if (error.toLowerCase().includes('import') || error.toLowerCase().includes('module')) {
      suggestions += `1. **Missing Import**: Check if all required modules are imported.\n`;
      suggestions += `2. **Installation**: Verify that dependencies are properly installed.\n`;
      suggestions += `3. **Path Issues**: Ensure import paths are correct.\n\n`;
    }

    suggestions += `### General Debugging Tips:\n\n`;
    suggestions += `- Add console.log() or print() statements to trace execution\n`;
    suggestions += `- Use a debugger to step through the code\n`;
    suggestions += `- Check the documentation for the functions/methods being used\n`;
    suggestions += `- Verify input data and expected output formats\n\n`;

    suggestions += `*Note: This is a basic analysis. For more detailed debugging, consider using an AI-powered service.*`;

    return suggestions;
  }

  private generateDocumentation(request: AIRequest): string {
    const { context } = request;
    const language = context?.language || 'unknown';
    const code = context?.code || '';

    if (!code) {
      return 'No code provided for documentation generation.';
    }

    const functions = this.extractFunctions(code, language);
    
    let documentation = `# Code Documentation\n\n`;
    documentation += `**Language:** ${language}\n\n`;

    if (functions.length > 0) {
      documentation += `## Functions\n\n`;
      functions.forEach(func => {
        documentation += `### ${func.name}\n\n`;
        documentation += `**Description:** ${func.description}\n\n`;
        
        if (func.parameters && func.parameters.length > 0) {
          documentation += `**Parameters:**\n`;
          func.parameters.forEach(param => {
            documentation += `- \`${param}\`: Parameter description\n`;
          });
          documentation += '\n';
        }
        
        documentation += `**Returns:** Return value description\n\n`;
        documentation += `**Example:**\n\`\`\`${language}\n// Usage example\n\`\`\`\n\n`;
      });
    }

    documentation += `## Usage\n\n`;
    documentation += `This code provides functionality for [describe main purpose]. `;
    documentation += `To use this code, [provide basic usage instructions].\n\n`;

    documentation += `*Note: This is a basic documentation template. For more detailed documentation, consider using an AI-powered service.*`;

    return documentation;
  }

  private chatCompletion(request: AIRequest): string {
    const prompt = request.prompt.toLowerCase();

    // Basic keyword matching for common questions
    if (prompt.includes('hello') || prompt.includes('hi')) {
      return 'Hello! I\'m the Local AI assistant. I can help with basic code explanations, debugging suggestions, and documentation. How can I assist you today?';
    }

    if (prompt.includes('help')) {
      return 'I can help you with:\n- Basic code explanations\n- Debugging suggestions\n- Documentation generation\n- General programming questions\n\nWhat would you like help with?';
    }

    if (prompt.includes('error') || prompt.includes('bug')) {
      return 'I can help you debug your code! Please provide:\n1. The code that\'s causing issues\n2. The error message you\'re seeing\n3. The programming language you\'re using\n\nThis will help me give you better debugging suggestions.';
    }

    if (prompt.includes('explain') || prompt.includes('understand')) {
      return 'I can explain code for you! Please share the code you\'d like me to explain, along with the programming language, and I\'ll break it down for you.';
    }

    // Default response
    return 'I\'m a basic Local AI assistant. I can help with simple code explanations, debugging suggestions, and documentation generation. For more advanced AI capabilities, please configure an external AI provider like OpenAI, Claude, or Gemini.';
  }

  private getDefaultResponse(request: AIRequest): string {
    return `I'm sorry, but the Local AI service doesn't support the "${request.capability}" capability. Please configure an external AI provider (OpenAI, Claude, or Gemini) for advanced AI features.`;
  }

  private extractFunctions(code: string, language: string): Array<{name: string; description: string; parameters?: string[]}> {
    const functions: Array<{name: string; description: string; parameters?: string[]}> = [];
    
    // Basic function extraction patterns
    const patterns = {
      javascript: /function\s+(\w+)\s*\(([^)]*)\)/g,
      typescript: /(?:function\s+(\w+)|(\w+)\s*:\s*\([^)]*\)\s*=>|(\w+)\s*\([^)]*\))/g,
      python: /def\s+(\w+)\s*\(([^)]*)\)/g,
      java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(([^)]*)\)/g,
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (pattern) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const name = match[1] || match[2] || match[3];
        if (name) {
          functions.push({
            name,
            description: `Function ${name} - basic analysis`,
            parameters: match[2] ? match[2].split(',').map(p => p.trim()).filter(Boolean) : [],
          });
        }
      }
    }

    return functions;
  }

  private extractVariables(code: string, language: string): string[] {
    const variables: string[] = [];
    
    // Basic variable extraction patterns
    const patterns = {
      javascript: /(?:var|let|const)\s+(\w+)/g,
      typescript: /(?:var|let|const)\s+(\w+)/g,
      python: /(\w+)\s*=/g,
      java: /(?:int|String|boolean|double|float)\s+(\w+)/g,
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (pattern) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (match[1] && !variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    }

    return variables.slice(0, 10); // Limit to first 10 variables
  }

  private extractImports(code: string, language: string): string[] {
    const imports: string[] = [];
    
    // Basic import extraction patterns
    const patterns = {
      javascript: /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      typescript: /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      python: /(?:import\s+(\w+)|from\s+(\w+)\s+import)/g,
      java: /import\s+([^;]+);/g,
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (pattern) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const importName = match[1] || match[2];
        if (importName && !imports.includes(importName)) {
          imports.push(importName);
        }
      }
    }

    return imports;
  }

  private updateUsageStats(): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
  }

  async healthCheck(): Promise<void> {
    // Local AI is always healthy
    return Promise.resolve();
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'local',
      ...this.usageStats,
    };
  }
}
