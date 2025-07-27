import { OpenAIService } from './providers/OpenAIService';
import { ClaudeService } from './providers/ClaudeService';
import { GeminiService } from './providers/GeminiService';
import { LocalAIService } from './providers/LocalAIService';
import { BedrockService } from './providers/BedrockService';
import { CohereService } from './providers/CohereService';
import { DeepSeekService } from './providers/DeepSeekService';
import { MistralService } from './providers/MistralService';
import { OllamaService } from './providers/OllamaService';
import { OpenRouterService } from './providers/OpenRouterService';
import { AIProvider, AIRequest, AIResponse, AICapability, ProjectStructure, RefactoredFiles, OptimizationSuggestions, Documentation, SecurityReport, TestFiles } from './types';
import { Logger } from '../../utils/logger';

export class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map();
  private logger = new Logger('AIServiceManager');
  private defaultProvider: string = 'openai';

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    try {
      // Initialize existing SHIN IDE providers
      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAIService(process.env.OPENAI_API_KEY);
        this.providers.set('openai', openai);
        this.logger.info('OpenAI service initialized');
      }

      if (process.env.CLAUDE_API_KEY) {
        const claude = new ClaudeService(process.env.CLAUDE_API_KEY);
        this.providers.set('claude', claude);
        this.logger.info('Claude service initialized');
      }

      if (process.env.GEMINI_API_KEY) {
        const gemini = new GeminiService(process.env.GEMINI_API_KEY);
        this.providers.set('gemini', gemini);
        this.logger.info('Gemini service initialized');
      }

      // Initialize new bolt.diy providers
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const bedrock = new BedrockService({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1'
        });
        this.providers.set('bedrock', bedrock);
        this.logger.info('Amazon Bedrock service initialized');
      }

      if (process.env.COHERE_API_KEY) {
        const cohere = new CohereService(process.env.COHERE_API_KEY);
        this.providers.set('cohere', cohere);
        this.logger.info('Cohere service initialized');
      }

      if (process.env.DEEPSEEK_API_KEY) {
        const deepseek = new DeepSeekService(process.env.DEEPSEEK_API_KEY);
        this.providers.set('deepseek', deepseek);
        this.logger.info('DeepSeek service initialized');
      }

      if (process.env.MISTRAL_API_KEY) {
        const mistral = new MistralService(process.env.MISTRAL_API_KEY);
        this.providers.set('mistral', mistral);
        this.logger.info('Mistral service initialized');
      }

      if (process.env.OLLAMA_BASE_URL) {
        const ollama = new OllamaService(process.env.OLLAMA_BASE_URL);
        this.providers.set('ollama', ollama);
        this.logger.info('Ollama service initialized');
      }

      if (process.env.OPENROUTER_API_KEY) {
        const openrouter = new OpenRouterService(process.env.OPENROUTER_API_KEY);
        this.providers.set('openrouter', openrouter);
        this.logger.info('OpenRouter service initialized');
      }

      // Initialize Local AI (always available)
      const localAI = new LocalAIService();
      this.providers.set('local', localAI);
      this.logger.info('Local AI service initialized');

      // Set default provider based on availability priority
      const providerPriority = ['openai', 'claude', 'gemini', 'bedrock', 'mistral', 'cohere', 'deepseek', 'openrouter', 'ollama', 'local'];
      for (const provider of providerPriority) {
        if (this.providers.has(provider)) {
          this.defaultProvider = provider;
          break;
        }
      }

      this.logger.info(`Default AI provider set to: ${this.defaultProvider}`);
      this.logger.info(`Total AI providers initialized: ${this.providers.size}`);
    } catch (error) {
      this.logger.error('Failed to initialize AI providers:', error);
    }
  }

  async generateResponse(request: AIRequest, providerId?: string): Promise<AIResponse> {
    const provider = this.getProvider(providerId);
    
    try {
      this.logger.info(`Generating response with ${provider.getName()} for capability: ${request.capability}`);
      
      // Check if provider supports the requested capability
      if (!provider.supportsCapability(request.capability)) {
        throw new Error(`Provider ${provider.getName()} does not support capability: ${request.capability}`);
      }

      const response = await provider.generateResponse(request);
      
      this.logger.info(`Response generated successfully with ${provider.getName()}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to generate response with ${provider.getName()}:`, error);
      
      // Try fallback to default provider if different
      if (providerId && providerId !== this.defaultProvider) {
        this.logger.info(`Attempting fallback to default provider: ${this.defaultProvider}`);
        return this.generateResponse(request, this.defaultProvider);
      }
      
      throw error;
    }
  }

  async generateCode(prompt: string, language: string, context?: any, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.CODE_GENERATION,
      prompt,
      context: {
        language,
        ...context,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  async explainCode(code: string, language: string, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.CODE_EXPLANATION,
      prompt: `Explain this ${language} code:\n\n${code}`,
      context: {
        language,
        code,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  async debugCode(code: string, error: string, language: string, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.CODE_DEBUGGING,
      prompt: `Debug this ${language} code that has the following error: ${error}\n\nCode:\n${code}`,
      context: {
        language,
        code,
        error,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  async optimizeCode(code: string, language: string, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.CODE_OPTIMIZATION,
      prompt: `Optimize this ${language} code for better performance and readability:\n\n${code}`,
      context: {
        language,
        code,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  async generateTests(code: string, language: string, testFramework?: string, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.TEST_GENERATION,
      prompt: `Generate ${testFramework || 'unit'} tests for this ${language} code:\n\n${code}`,
      context: {
        language,
        code,
        testFramework,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  async generateDocumentation(code: string, language: string, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.DOCUMENTATION,
      prompt: `Generate comprehensive documentation for this ${language} code:\n\n${code}`,
      context: {
        language,
        code,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  async chatCompletion(messages: Array<{role: string; content: string}>, providerId?: string): Promise<string> {
    const request: AIRequest = {
      capability: AICapability.CHAT_COMPLETION,
      prompt: messages[messages.length - 1].content,
      context: {
        messages,
      },
    };

    const response = await this.generateResponse(request, providerId);
    return response.content;
  }

  getProvider(providerId?: string): AIProvider {
    const id = providerId || this.defaultProvider;
    const provider = this.providers.get(id);
    
    if (!provider) {
      throw new Error(`AI provider '${id}' not found or not initialized`);
    }
    
    return provider;
  }

  getAvailableProviders(): Array<{id: string; name: string; capabilities: AICapability[]}> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getName(),
      capabilities: provider.getSupportedCapabilities(),
    }));
  }

  setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    
    this.defaultProvider = providerId;
    this.logger.info(`Default provider changed to: ${providerId}`);
  }

  getDefaultProvider(): string {
    return this.defaultProvider;
  }

  async healthCheck(): Promise<{[providerId: string]: boolean}> {
    const results: {[providerId: string]: boolean} = {};
    
    for (const [id, provider] of this.providers.entries()) {
      try {
        await provider.healthCheck();
        results[id] = true;
      } catch (error) {
        this.logger.warn(`Health check failed for provider ${id}:`, error);
        results[id] = false;
      }
    }
    
    return results;
  }

  async getUsageStats(): Promise<{[providerId: string]: any}> {
    const stats: {[providerId: string]: any} = {};

    for (const [id, provider] of this.providers.entries()) {
      try {
        stats[id] = await provider.getUsageStats();
      } catch (error) {
        this.logger.warn(`Failed to get usage stats for provider ${id}:`, error);
        stats[id] = { error: 'Failed to retrieve stats' };
      }
    }

    return stats;
  }

  // Enhanced capabilities from bolt.diy integration
  async generateFullApplication(prompt: string, providerId?: string): Promise<ProjectStructure> {
    const request: AIRequest = {
      capability: AICapability.CODE_GENERATION,
      prompt: `Generate a complete application based on this description: ${prompt}. Include all necessary files, dependencies, configuration, and documentation.`,
      context: {
        projectType: 'full-application',
        includeTests: true,
        includeDocumentation: true,
        includeDeployment: true,
      },
      options: {
        temperature: 0.7,
        maxTokens: 8000,
      },
    };

    const response = await this.generateResponse(request, providerId);

    // Parse the response to extract project structure
    // This would need more sophisticated parsing in a real implementation
    return {
      name: 'Generated Application',
      description: 'AI-generated application',
      files: [],
      dependencies: {},
      scripts: {},
      configuration: {},
      documentation: response.content,
    };
  }

  async refactorCodebase(files: any[], providerId?: string): Promise<RefactoredFiles> {
    const filesContent = files.map(file => `File: ${file.path}\n${file.content}`).join('\n\n');

    const request: AIRequest = {
      capability: AICapability.REFACTORING,
      prompt: `Refactor this codebase for better structure, performance, and maintainability:\n\n${filesContent}`,
      context: {
        files,
        refactorType: 'comprehensive',
      },
      options: {
        temperature: 0.3,
        maxTokens: 6000,
      },
    };

    const response = await this.generateResponse(request, providerId);

    return {
      refactoredFiles: files.map(file => ({
        ...file,
        content: response.content, // This would need proper parsing
      })),
      summary: 'Codebase refactored for improved structure and performance',
      changes: [],
    };
  }

  async optimizePerformance(project: any, providerId?: string): Promise<OptimizationSuggestions> {
    const request: AIRequest = {
      capability: AICapability.CODE_OPTIMIZATION,
      prompt: `Analyze this project and provide performance optimization suggestions: ${JSON.stringify(project, null, 2)}`,
      context: {
        project,
        optimizationType: 'performance',
      },
      options: {
        temperature: 0.2,
        maxTokens: 4000,
      },
    };

    const response = await this.generateResponse(request, providerId);

    return {
      suggestions: [
        {
          type: 'performance',
          priority: 'high',
          description: response.content,
          impact: 'medium',
          effort: 'low',
        },
      ],
      estimatedImpact: 'medium',
      implementationTime: 'low',
    };
  }

  async generateDocumentation(project: any, providerId?: string): Promise<Documentation> {
    const request: AIRequest = {
      capability: AICapability.DOCUMENTATION,
      prompt: `Generate comprehensive documentation for this project: ${JSON.stringify(project, null, 2)}`,
      context: {
        project,
        documentationType: 'comprehensive',
      },
      options: {
        temperature: 0.4,
        maxTokens: 6000,
      },
    };

    const response = await this.generateResponse(request, providerId);

    return {
      readme: response.content,
      apiDocs: '',
      userGuide: '',
      developerGuide: '',
      changelog: '',
      contributing: '',
    };
  }

  async reviewSecurity(codebase: any, providerId?: string): Promise<SecurityReport> {
    const request: AIRequest = {
      capability: AICapability.SECURITY_ANALYSIS,
      prompt: `Perform a comprehensive security analysis of this codebase: ${JSON.stringify(codebase, null, 2)}`,
      context: {
        codebase,
        analysisType: 'comprehensive',
      },
      options: {
        temperature: 0.1,
        maxTokens: 5000,
      },
    };

    const response = await this.generateResponse(request, providerId);

    return {
      vulnerabilities: [],
      recommendations: [response.content],
      riskLevel: 'medium',
      complianceStatus: 'partial',
      summary: response.content,
    };
  }

  async createTestSuite(code: string, framework: string, providerId?: string): Promise<TestFiles> {
    const request: AIRequest = {
      capability: AICapability.TEST_GENERATION,
      prompt: `Generate a comprehensive test suite for this code using ${framework}:\n\n${code}`,
      context: {
        code,
        framework,
        testType: 'comprehensive',
      },
      options: {
        temperature: 0.3,
        maxTokens: 4000,
      },
    };

    const response = await this.generateResponse(request, providerId);

    return {
      unitTests: response.content,
      integrationTests: '',
      e2eTests: '',
      testConfig: '',
      coverage: 0,
    };
  }
}
