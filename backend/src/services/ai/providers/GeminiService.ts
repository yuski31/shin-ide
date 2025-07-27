import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../utils/logger';

export class GeminiService implements AIProvider {
  private client: GoogleGenerativeAI;
  private logger = new Logger('GeminiService');
  private model: string = 'gemini-pro';
  private usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    lastRequest: null as Date | null,
  };

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    if (model) this.model = model;
  }

  getName(): string {
    return 'Gemini';
  }

  supportsCapability(capability: AICapability): boolean {
    // Gemini supports most capabilities
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
      const model = this.client.getGenerativeModel({ model: this.model });
      const prompt = this.buildPrompt(request);

      this.logger.debug(`Sending request to Gemini with model: ${this.model}`);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const aiResponse: AIResponse = {
        content: text,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
        model: this.model,
        finishReason: response.candidates?.[0]?.finishReason || undefined,
        metadata: {
          provider: 'gemini',
          processingTime: Date.now() - startTime,
        },
      };

      // Update usage stats
      this.updateUsageStats(aiResponse);

      return aiResponse;
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(request: AIRequest): string {
    const systemMessage = this.getSystemMessage(request.capability, request.context);
    
    if (request.context?.messages) {
      // Build conversation format
      let prompt = systemMessage + '\n\n';
      for (const msg of request.context.messages) {
        prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n\n`;
      }
      return prompt;
    } else {
      // Single prompt format
      return `${systemMessage}\n\nHuman: ${request.prompt}\n\nAssistant:`;
    }
  }

  private getSystemMessage(capability: AICapability, context?: any): string {
    switch (capability) {
      case AICapability.CODE_GENERATION:
        return `You are an expert software developer specializing in ${context?.language || 'multiple programming languages'}. Generate clean, efficient, well-documented code that follows best practices and includes helpful comments. Consider edge cases and error handling.`;
      
      case AICapability.CODE_EXPLANATION:
        return `You are an expert code educator. Explain code clearly and comprehensively, breaking down complex concepts into understandable parts. Cover functionality, logic flow, and important programming concepts used.`;
      
      case AICapability.CODE_DEBUGGING:
        return `You are an expert debugger. Analyze the provided code and error message carefully, identify the root cause of the issue, and provide a clear, working solution with detailed explanation of the fix.`;
      
      case AICapability.CODE_OPTIMIZATION:
        return `You are a performance optimization specialist. Analyze code for improvements in performance, memory usage, readability, and maintainability. Provide optimized code with clear explanations of the improvements.`;
      
      case AICapability.CODE_REVIEW:
        return `You are a senior code reviewer. Thoroughly review code for bugs, security vulnerabilities, performance issues, code quality, and adherence to best practices. Provide constructive, actionable feedback.`;
      
      case AICapability.TEST_GENERATION:
        return `You are a testing expert. Generate comprehensive, well-structured tests using ${context?.testFramework || 'appropriate testing frameworks'}. Cover normal cases, edge cases, error conditions, and ensure good test coverage.`;
      
      case AICapability.DOCUMENTATION:
        return `You are a technical documentation specialist. Create clear, comprehensive documentation that explains purpose, usage, parameters, return values, and includes practical examples. Make it accessible and useful.`;
      
      case AICapability.REFACTORING:
        return `You are a refactoring expert. Improve code structure, readability, maintainability, and performance while preserving functionality. Apply clean code principles and design patterns where appropriate.`;
      
      case AICapability.ARCHITECTURE_ADVICE:
        return `You are a software architect. Provide architectural guidance, design pattern recommendations, and best practices for building scalable, maintainable software systems.`;
      
      case AICapability.SECURITY_ANALYSIS:
        return `You are a cybersecurity expert. Analyze code for security vulnerabilities, potential attack vectors, and provide detailed security recommendations following industry best practices and OWASP guidelines.`;
      
      case AICapability.CHAT_COMPLETION:
        return `You are SHIN IDE's AI assistant. Help users with programming questions, code generation, debugging, and development tasks. Be helpful, accurate, and provide practical solutions.`;
      
      default:
        return `You are a helpful AI assistant with expertise in software development. Provide accurate, detailed responses to programming-related questions and tasks.`;
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // Estimate cost (approximate pricing for Gemini)
      const inputCost = (response.usage.promptTokens / 1000) * 0.00025;
      const outputCost = (response.usage.completionTokens / 1000) * 0.0005;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('Hello');
    } catch (error) {
      throw new Error(`Gemini health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'gemini',
      model: this.model,
      ...this.usageStats,
    };
  }

  // Gemini-specific methods
  async generateWithImages(
    prompt: string,
    images: Array<{data: string; mimeType: string}>
  ): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      const imageParts = images.map(img => ({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      }));

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Gemini vision API error:', error);
      throw new Error(`Gemini vision API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeCodeWithMultipleFiles(
    files: Array<{path: string; content: string; language: string}>,
    analysisType: 'review' | 'security' | 'optimization'
  ): Promise<string> {
    const filesContent = files.map(file => 
      `File: ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
    ).join('\n\n');

    let capability: AICapability;
    switch (analysisType) {
      case 'review':
        capability = AICapability.CODE_REVIEW;
        break;
      case 'security':
        capability = AICapability.SECURITY_ANALYSIS;
        break;
      case 'optimization':
        capability = AICapability.CODE_OPTIMIZATION;
        break;
    }

    const request: AIRequest = {
      capability,
      prompt: `Analyze the following files for ${analysisType}:\n\n${filesContent}`,
      context: { files, analysisType },
      options: { temperature: 0.3 },
    };

    const response = await this.generateResponse(request);
    return response.content;
  }

  async generateProjectStructure(
    description: string,
    framework: string,
    features: string[]
  ): Promise<string> {
    const prompt = `
Generate a project structure for a ${framework} application with the following description and features:

Description: ${description}

Features:
${features.map(feature => `- ${feature}`).join('\n')}

Please provide:
1. Recommended folder structure
2. Key files and their purposes
3. Configuration files needed
4. Dependencies to install
5. Basic setup instructions
`;

    const request: AIRequest = {
      capability: AICapability.ARCHITECTURE_ADVICE,
      prompt,
      context: { description, framework, features },
      options: { temperature: 0.4 },
    };

    const response = await this.generateResponse(request);
    return response.content;
  }
}
