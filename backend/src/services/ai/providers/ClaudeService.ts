import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../utils/logger';

export class ClaudeService implements AIProvider {
  private client: Anthropic;
  private logger = new Logger('ClaudeService');
  private model: string = 'claude-3-sonnet-20240229';
  private usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    lastRequest: null as Date | null,
  };

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    if (model) this.model = model;
  }

  getName(): string {
    return 'Claude';
  }

  supportsCapability(capability: AICapability): boolean {
    // Claude supports most capabilities
    const supportedCapabilities = [
      AICapability.CODE_GENERATION,
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.CODE_OPTIMIZATION,
      AICapability.CODE_REVIEW,
      AICapability.TEST_GENERATION,
      AICapability.DOCUMENTATION,
      AICapability.CHAT_COMPLETION,
      AICapability.REFACTORING,
      AICapability.ARCHITECTURE_ADVICE,
      AICapability.SECURITY_ANALYSIS,
    ];
    
    return supportedCapabilities.includes(capability);
  }

  getSupportedCapabilities(): AICapability[] {
    return [
      AICapability.CODE_GENERATION,
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.CODE_OPTIMIZATION,
      AICapability.CODE_REVIEW,
      AICapability.TEST_GENERATION,
      AICapability.DOCUMENTATION,
      AICapability.CHAT_COMPLETION,
      AICapability.REFACTORING,
      AICapability.ARCHITECTURE_ADVICE,
      AICapability.SECURITY_ANALYSIS,
    ];
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const messages = this.buildMessages(request);
      const options = this.buildOptions(request);

      this.logger.debug(`Sending request to Claude with model: ${options.model}`);

      const completion = await this.client.messages.create({
        model: options.model,
        messages,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
        system: this.getSystemMessage(request.capability, request.context),
      });

      const response: AIResponse = {
        content: completion.content[0]?.type === 'text' ? completion.content[0].text : '',
        usage: completion.usage ? {
          promptTokens: completion.usage.input_tokens,
          completionTokens: completion.usage.output_tokens,
          totalTokens: completion.usage.input_tokens + completion.usage.output_tokens,
        } : undefined,
        model: completion.model,
        finishReason: completion.stop_reason || undefined,
        metadata: {
          provider: 'claude',
          requestId: completion.id,
          processingTime: Date.now() - startTime,
        },
      };

      // Update usage stats
      this.updateUsageStats(response);

      return response;
    } catch (error) {
      this.logger.error('Claude API error:', error);
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildMessages(request: AIRequest): Array<{role: 'user' | 'assistant'; content: string}> {
    const messages: Array<{role: 'user' | 'assistant'; content: string}> = [];

    // Add conversation history if available
    if (request.context?.messages) {
      for (const msg of request.context.messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
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
        return `You are an expert software developer with deep knowledge of ${context?.language || 'multiple programming languages'}. Generate clean, efficient, and well-documented code following best practices. Include helpful comments and consider edge cases.`;
      
      case AICapability.CODE_EXPLANATION:
        return `You are an expert code reviewer and educator. Explain code clearly and comprehensively, breaking down complex concepts into understandable parts. Cover what the code does, how it works, and any important patterns or concepts used.`;
      
      case AICapability.CODE_DEBUGGING:
        return `You are an expert debugger with extensive experience in ${context?.language || 'multiple programming languages'}. Analyze the provided code and error carefully, identify the root cause, and provide a clear, working fix with detailed explanation.`;
      
      case AICapability.CODE_OPTIMIZATION:
        return `You are a performance optimization expert. Analyze code for performance improvements, memory efficiency, readability enhancements, and adherence to best practices. Provide optimized code with clear explanations of the improvements made.`;
      
      case AICapability.CODE_REVIEW:
        return `You are a senior code reviewer with expertise in software engineering best practices. Review the code thoroughly for bugs, security issues, performance problems, maintainability concerns, and adherence to coding standards. Provide constructive, actionable feedback.`;
      
      case AICapability.TEST_GENERATION:
        return `You are a testing expert specializing in ${context?.testFramework || 'modern testing frameworks'}. Generate comprehensive, well-structured tests that cover normal operation, edge cases, error conditions, and boundary conditions. Ensure tests are maintainable and follow testing best practices.`;
      
      case AICapability.DOCUMENTATION:
        return `You are a technical writer specializing in software documentation. Generate clear, comprehensive, and well-structured documentation that explains the purpose, usage, parameters, return values, and provides practical examples. Make it accessible to developers of varying experience levels.`;
      
      case AICapability.REFACTORING:
        return `You are a refactoring expert with deep knowledge of software design patterns and clean code principles. Improve code structure, readability, maintainability, and performance while preserving functionality. Explain the rationale behind each change.`;
      
      case AICapability.ARCHITECTURE_ADVICE:
        return `You are a senior software architect with extensive experience in designing scalable, maintainable systems. Provide architectural guidance, recommend appropriate design patterns, and suggest best practices for the given context and requirements.`;
      
      case AICapability.SECURITY_ANALYSIS:
        return `You are a cybersecurity expert specializing in secure coding practices. Analyze code for security vulnerabilities, potential attack vectors, and provide detailed recommendations for secure implementation. Consider OWASP guidelines and industry best practices.`;
      
      case AICapability.CHAT_COMPLETION:
        return `You are SHIN IDE's AI assistant, a knowledgeable and helpful coding companion. Assist users with programming questions, provide clear explanations, generate code, debug issues, and help with development tasks. Be accurate, concise, and supportive.`;
      
      default:
        return `You are a helpful AI assistant with expertise in software development. Provide accurate, detailed, and practical responses to coding-related questions and tasks.`;
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // Estimate cost (approximate pricing for Claude)
      const inputCost = (response.usage.promptTokens / 1000) * 0.015;
      const outputCost = (response.usage.completionTokens / 1000) * 0.075;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
    } catch (error) {
      throw new Error(`Claude health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'claude',
      model: this.model,
      ...this.usageStats,
    };
  }

  // Claude-specific methods
  async analyzeCodeWithContext(
    code: string,
    language: string,
    projectContext?: any
  ): Promise<string> {
    const contextInfo = projectContext ? `
Project Context:
- Framework: ${projectContext.framework || 'Unknown'}
- Dependencies: ${projectContext.dependencies?.join(', ') || 'None specified'}
- Description: ${projectContext.description || 'No description'}
` : '';

    const request: AIRequest = {
      capability: AICapability.CODE_REVIEW,
      prompt: `Analyze this ${language} code with the following context:\n\n${contextInfo}\n\nCode to analyze:\n${code}`,
      context: { language, code, projectContext },
      options: { temperature: 0.3 },
    };

    const response = await this.generateResponse(request);
    return response.content;
  }

  async generateArchitecturalAdvice(
    description: string,
    requirements: string[],
    constraints: string[]
  ): Promise<string> {
    const prompt = `
Provide architectural advice for the following system:

Description: ${description}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Constraints:
${constraints.map(constraint => `- ${constraint}`).join('\n')}

Please provide:
1. Recommended architecture patterns
2. Technology stack suggestions
3. Scalability considerations
4. Security recommendations
5. Implementation roadmap
`;

    const request: AIRequest = {
      capability: AICapability.ARCHITECTURE_ADVICE,
      prompt,
      context: { description, requirements, constraints },
      options: { temperature: 0.4 },
    };

    const response = await this.generateResponse(request);
    return response.content;
  }
}
