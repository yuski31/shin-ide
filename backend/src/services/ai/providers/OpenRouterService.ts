import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../../utils/logger';

export class OpenRouterService implements AIProvider {
  private apiKey: string;
  private logger = new Logger('OpenRouterService');
  private model: string = 'anthropic/claude-3-sonnet';
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
    return 'OpenRouter';
  }

  supportsCapability(capability: AICapability): boolean {
    // OpenRouter supports all capabilities as it routes to various models
    return Object.values(AICapability).includes(capability);
  }

  getSupportedCapabilities(): AICapability[] {
    return Object.values(AICapability);
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Sending request to OpenRouter with model: ${this.model}`);

      // Mock response - would integrate with OpenRouter API in production
      const mockResponse: AIResponse = {
        content: `OpenRouter AI response for ${request.capability}: ${request.prompt.substring(0, 100)}...`,
        usage: {
          promptTokens: 115,
          completionTokens: 185,
          totalTokens: 300,
        },
        model: this.model,
        finishReason: 'stop',
        metadata: {
          provider: 'openrouter',
          processingTime: Date.now() - startTime,
          routedModel: this.model,
        },
      };

      this.updateUsageStats(mockResponse);
      return mockResponse;
    } catch (error) {
      this.logger.error('OpenRouter API error:', error);
      throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
    
    if (response.usage) {
      this.usageStats.totalTokens += response.usage.totalTokens;
      
      // OpenRouter pricing varies by model - using average estimate
      const inputCost = (response.usage.promptTokens / 1000) * 0.005;
      const outputCost = (response.usage.completionTokens / 1000) * 0.015;
      this.usageStats.totalCost += inputCost + outputCost;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      // Mock health check
      this.logger.debug('OpenRouter health check passed');
    } catch (error) {
      throw new Error(`OpenRouter health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'openrouter',
      model: this.model,
      ...this.usageStats,
    };
  }

  // OpenRouter-specific methods
  async listAvailableModels(): Promise<string[]> {
    try {
      // Mock model list - would fetch from OpenRouter API in production
      return [
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku',
        'openai/gpt-4-turbo',
        'openai/gpt-3.5-turbo',
        'google/gemini-pro',
        'meta-llama/llama-2-70b-chat',
        'mistralai/mistral-7b-instruct',
        'cohere/command-r-plus',
      ];
    } catch (error) {
      this.logger.error('Failed to list OpenRouter models:', error);
      return [];
    }
  }

  setModel(modelName: string): void {
    this.model = modelName;
    this.logger.info(`Switched to model: ${modelName}`);
  }

  async getModelInfo(modelName: string): Promise<any> {
    try {
      // Mock model info - would fetch from OpenRouter API in production
      return {
        name: modelName,
        pricing: {
          prompt: 0.005,
          completion: 0.015,
        },
        context_length: 32000,
        architecture: 'transformer',
      };
    } catch (error) {
      this.logger.error(`Failed to get model info for ${modelName}:`, error);
      return null;
    }
  }
}
