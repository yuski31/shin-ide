import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../../utils/logger';

export class DeepSeekService implements AIProvider {
  private apiKey: string;
  private logger = new Logger('DeepSeekService');
  private model: string = 'deepseek-coder';
  private usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    lastRequest: null as Date | null,
  };

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    if (model) this.model = model;
  }

  getName(): string {
    return 'DeepSeek';
  }

  supportsCapability(capability: AICapability): boolean {
    // DeepSeek is particularly strong at code-related tasks
    const supportedCapabilities = [
      AICapability.CODE_GENERATION,
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.CODE_OPTIMIZATION,
      AICapability.CODE_REVIEW,
      AICapability.TEST_GENERATION,
      AICapability.REFACTORING,
      AICapability.CHAT_COMPLETION,
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
      AICapability.REFACTORING,
      AICapability.CHAT_COMPLETION,
    ];
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Sending request to DeepSeek with model: ${this.model}`);

      // Mock response - would integrate with DeepSeek API in production
      const mockResponse: AIResponse = {
        content: `DeepSeek AI response for ${request.capability}: ${request.prompt.substring(0, 100)}...`,
        usage: {
          promptTokens: 110,
          completionTokens: 190,
          totalTokens: 300,
        },
        model: this.model,
        finishReason: 'stop',
        metadata: {
          provider: 'deepseek',
          processingTime: Date.now() - startTime,
        },
      };

      this.updateUsageStats(mockResponse);
      return mockResponse;
    } catch (error) {
      this.logger.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // Estimate cost for DeepSeek (very competitive pricing)
      const inputCost = (response.usage.promptTokens / 1000) * 0.0001;
      const outputCost = (response.usage.completionTokens / 1000) * 0.0002;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      // Mock health check
      this.logger.debug('DeepSeek health check passed');
    } catch (error) {
      throw new Error(`DeepSeek health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'deepseek',
      model: this.model,
      ...this.usageStats,
    };
  }
}
