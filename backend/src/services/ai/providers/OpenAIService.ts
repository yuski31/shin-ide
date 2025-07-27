import OpenAI from 'openai';
import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../utils/logger';

export class OpenAIService implements AIProvider {
  private client: OpenAI;
  private logger = new Logger('OpenAIService');
  private model: string = 'gpt-4';
  private usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    lastRequest: null as Date | null,
  };

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    if (model) this.model = model;
  }

  getName(): string {
    return 'OpenAI';
  }

  supportsCapability(capability: AICapability): boolean {
    // OpenAI supports all capabilities
    return Object.values(AICapability).includes(capability);
  }

  getSupportedCapabilities(): AICapability[] {
    return Object.values(AICapability);
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const messages = this.buildMessages(request);
      const options = this.buildOptions(request);

      this.logger.debug(`Sending request to OpenAI with model: ${options.model}`);

      const completion = await this.client.chat.completions.create({
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        ...options,
      });

      const response: AIResponse = {
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
        model: completion.model,
        finishReason: completion.choices[0]?.finish_reason || undefined,
        metadata: {
          provider: 'openai',
          requestId: completion.id,
          processingTime: Date.now() - startTime,
        },
      };

      // Update usage stats
      this.updateUsageStats(response);

      return response;
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildMessages(request: AIRequest): Array<{role: string; content: string}> {
    const messages: Array<{role: string; content: string}> = [];

    // Add system message based on capability
    const systemMessage = this.getSystemMessage(request.capability, request.context);
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }

    // Add conversation history if available
    if (request.context?.messages) {
      messages.push(...request.context.messages);
    } else {
      // Add user prompt
      messages.push({ role: 'user', content: request.prompt });
    }

    return messages;
  }

  private buildOptions(request: AIRequest) {
    const defaultOptions = {
      model: this.model,
      temperature: 0.7,
      max_tokens: 2048,
    };

    return {
      ...defaultOptions,
      ...request.options,
    };
  }

  private getSystemMessage(capability: AICapability, context?: any): string {
    switch (capability) {
      case AICapability.CODE_GENERATION:
        return `You are an expert software developer. Generate clean, efficient, and well-documented code in ${context?.language || 'the requested language'}. Follow best practices and include helpful comments.`;
      
      case AICapability.CODE_EXPLANATION:
        return `You are an expert code reviewer. Explain code clearly and comprehensively, covering what it does, how it works, and any important patterns or concepts used.`;
      
      case AICapability.CODE_DEBUGGING:
        return `You are an expert debugger. Analyze the provided code and error, identify the root cause, and provide a clear fix with explanation.`;
      
      case AICapability.CODE_OPTIMIZATION:
        return `You are a performance optimization expert. Analyze the code for performance improvements, readability enhancements, and best practices. Provide optimized code with explanations.`;
      
      case AICapability.CODE_REVIEW:
        return `You are a senior code reviewer. Review the code for bugs, security issues, performance problems, and adherence to best practices. Provide constructive feedback.`;
      
      case AICapability.TEST_GENERATION:
        return `You are a testing expert. Generate comprehensive unit tests that cover edge cases, error conditions, and normal operation. Use ${context?.testFramework || 'appropriate testing framework'}.`;
      
      case AICapability.DOCUMENTATION:
        return `You are a technical writer. Generate clear, comprehensive documentation that explains the purpose, usage, parameters, and examples for the provided code.`;
      
      case AICapability.REFACTORING:
        return `You are a refactoring expert. Improve code structure, readability, and maintainability while preserving functionality. Explain the changes made.`;
      
      case AICapability.ARCHITECTURE_ADVICE:
        return `You are a software architect. Provide architectural guidance, design patterns, and best practices for scalable, maintainable software systems.`;
      
      case AICapability.SECURITY_ANALYSIS:
        return `You are a security expert. Analyze code for security vulnerabilities, potential attack vectors, and provide secure coding recommendations.`;
      
      case AICapability.CHAT_COMPLETION:
        return `You are SHIN IDE's AI assistant. Help users with coding questions, provide explanations, generate code, and assist with development tasks. Be helpful, accurate, and concise.`;
      
      case AICapability.CODE_COMPLETION:
        return `You are a code completion assistant. Provide intelligent code completions based on context, following the established patterns and conventions in the codebase.`;
      
      default:
        return `You are a helpful AI assistant specialized in software development. Provide accurate, helpful responses to coding-related questions.`;
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // Estimate cost (approximate pricing for GPT-4)
      const inputCost = (response.usage.promptTokens / 1000) * 0.03;
      const outputCost = (response.usage.completionTokens / 1000) * 0.06;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
    } catch (error) {
      throw new Error(`OpenAI health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'openai',
      model: this.model,
      ...this.usageStats,
    };
  }

  // Additional OpenAI-specific methods
  async generateCodeCompletion(
    code: string,
    language: string,
    cursor: {line: number; column: number}
  ): Promise<string[]> {
    try {
      const prompt = `Complete the following ${language} code at the cursor position (line ${cursor.line}, column ${cursor.column}):\n\n${code}`;
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a code completion assistant. Provide only the completion text, no explanations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
        n: 3, // Generate multiple completions
      });

      return completion.choices.map(choice => choice.message?.content || '').filter(Boolean);
    } catch (error) {
      this.logger.error('Code completion error:', error);
      return [];
    }
  }

  async analyzeCodeSecurity(code: string, language: string): Promise<any> {
    const request: AIRequest = {
      capability: AICapability.SECURITY_ANALYSIS,
      prompt: `Analyze this ${language} code for security vulnerabilities:\n\n${code}`,
      context: { language, code },
      options: { temperature: 0.1 }, // Lower temperature for more consistent analysis
    };

    const response = await this.generateResponse(request);
    
    // Parse the response to extract structured security findings
    // This would typically involve more sophisticated parsing
    return {
      analysis: response.content,
      provider: 'openai',
      timestamp: new Date(),
    };
  }
}
