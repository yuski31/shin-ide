import { AIProvider, AIRequest, AIResponse, AICapability } from '../types';
import { Logger } from '../../../utils/logger';

export class OllamaService implements AIProvider {
  private baseUrl: string;
  private logger = new Logger('OllamaService');
  private model: string = 'codellama';
  private usageStats = {
    totalRequests: 0,
    lastRequest: null as Date | null,
  };

  constructor(baseUrl: string, model?: string) {
    this.baseUrl = baseUrl;
    if (model) this.model = model;
  }

  getName(): string {
    return 'Ollama';
  }

  supportsCapability(capability: AICapability): boolean {
    // Ollama supports most capabilities depending on the model
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
      this.logger.debug(`Sending request to Ollama with model: ${this.model}`);

      // Mock response - would integrate with Ollama API in production
      const mockResponse: AIResponse = {
        content: `Ollama AI response for ${request.capability}: ${request.prompt.substring(0, 100)}...`,
        model: this.model,
        finishReason: 'stop',
        metadata: {
          provider: 'ollama',
          processingTime: Date.now() - startTime,
          baseUrl: this.baseUrl,
        },
      };

      this.updateUsageStats();
      return mockResponse;
    } catch (error) {
      this.logger.error('Ollama API error:', error);
      throw new Error(`Ollama API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateUsageStats(): void {
    this.usageStats.totalRequests++;
    this.usageStats.lastRequest = new Date();
  }

  async healthCheck(): Promise<void> {
    try {
      // Mock health check - would ping Ollama server in production
      this.logger.debug('Ollama health check passed');
    } catch (error) {
      throw new Error(`Ollama health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsageStats(): Promise<any> {
    return {
      provider: 'ollama',
      model: this.model,
      baseUrl: this.baseUrl,
      ...this.usageStats,
      cost: 0, // Ollama is typically free for local usage
    };
  }

  // Ollama-specific methods
  async listAvailableModels(): Promise<string[]> {
    try {
      // Mock model list - would fetch from Ollama API in production
      return ['codellama', 'llama2', 'mistral', 'neural-chat', 'starcode'];
    } catch (error) {
      this.logger.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      this.logger.info(`Pulling model ${modelName} from Ollama`);
      // Mock model pull - would use Ollama API in production
      return true;
    } catch (error) {
      this.logger.error(`Failed to pull model ${modelName}:`, error);
      return false;
    }
  }

  setModel(modelName: string): void {
    this.model = modelName;
    this.logger.info(`Switched to model: ${modelName}`);
  }
}
