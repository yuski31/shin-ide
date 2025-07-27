import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../../utils/logger';

export class CohereService implements AIProvider {
  private apiKey: string;
  private logger = new Logger('CohereService');
  private model: string = 'command-r-plus';
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
    return 'Cohere';
  }

  supportsCapability(capability: AICapability): boolean {
    const supportedCapabilities = [
      AICapability.CODE_GENERATION,
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.CODE_OPTIMIZATION,
      AICapability.TEST_GENERATION,
      AICapability.DOCUMENTATION,
      AICapability.CHAT_COMPLETION,
      AICapability.REFACTORING,
    ];
    
    return supportedCapabilities.includes(capability);
  }

  getSupportedCapabilities(): AICapability[] {
    return [
      AICapability.CODE_GENERATION,
      AICapability.CODE_EXPLANATION,
      AICapability.CODE_DEBUGGING,
      AICapability.CODE_OPTIMIZATION,
      AICapability.TEST_GENERATION,
      AICapability.DOCUMENTATION,
      AICapability.CHAT_COMPLETION,
      AICapability.REFACTORING,
    ];
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Sending request to Cohere with model: ${this.model}`);

      // Mock response for now - would integrate with Cohere SDK in production
      const mockResponse: AIResponse = {
        content: `Cohere AI response for ${request.capability}: ${request.prompt.substring(0, 100)}...`,
        usage: {
          promptTokens: 120,
          completionTokens: 180,
          totalTokens: 300,
        },
        model: this.model,
        finishReason: 'complete',
        metadata: {
          provider: 'cohere',
          processingTime: Date.now() - startTime,
        },
      };

      this.updateUsageStats(mockResponse);
      return mockResponse;
    } catch (error) {
      this.logger.error('Cohere API error:', error);
      throw new Error(`Cohere API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // Estimate cost for Cohere (approximate pricing)
      const inputCost = (response.usage.promptTokens / 1000) * 0.001;
      const outputCost = (response.usage.completionTokens / 1000) * 0.002;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      // Mock health check
      this.logger.debug('Cohere health check passed');
    } catch (error) {
      throw new Error(`Cohere health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'cohere',
      model: this.model,
      ...this.usageStats,
    };
  }
}
