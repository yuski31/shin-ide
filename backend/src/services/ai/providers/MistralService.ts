import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../../utils/logger';

export class MistralService implements AIProvider {
  private apiKey: string;
  private logger = new Logger('MistralService');
  private model: string = 'mistral-large-latest';
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
    return 'Mistral';
  }

  supportsCapability(capability: AICapability): boolean {
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
    ];
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Sending request to Mistral with model: ${this.model}`);

      // Mock response - would integrate with Mistral API in production
      const mockResponse: AIResponse = {
        content: `Mistral AI response for ${request.capability}: ${request.prompt.substring(0, 100)}...`,
        usage: {
          promptTokens: 105,
          completionTokens: 195,
          totalTokens: 300,
        },
        model: this.model,
        finishReason: 'stop',
        metadata: {
          provider: 'mistral',
          processingTime: Date.now() - startTime,
        },
      };

      this.updateUsageStats(mockResponse);
      return mockResponse;
    } catch (error) {
      this.logger.error('Mistral API error:', error);
      throw new Error(`Mistral API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // Estimate cost for Mistral (competitive pricing)
      const inputCost = (response.usage.promptTokens / 1000) * 0.002;
      const outputCost = (response.usage.completionTokens / 1000) * 0.006;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      // Mock health check
      this.logger.debug('Mistral health check passed');
    } catch (error) {
      throw new Error(`Mistral health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'mistral',
      model: this.model,
      ...this.usageStats,
    };
  }
}
