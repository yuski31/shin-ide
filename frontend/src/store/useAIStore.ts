import { create } from 'zustand';
import { aiService } from '../services/aiService';

interface AIProvider {
  id: string;
  name: string;
  capabilities: string[];
}

interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    tokens?: number;
    model?: string;
  };
}

interface ProjectStructure {
  name: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
    type: 'file' | 'directory';
  }>;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  configuration: Record<string, any>;
  documentation: string;
}

interface AIState {
  isLoading: boolean;
  error: string | null;
  availableProviders: AIProvider[];
  currentProvider: string;
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  
  // Enhanced Actions from bolt.diy integration
  setProvider: (providerId: string) => void;
  generateCode: (prompt: string, language: string, context?: any) => Promise<string>;
  explainCode: (code: string, language: string) => Promise<string>;
  debugCode: (code: string, error: string, language: string) => Promise<string>;
  optimizeCode: (code: string, language: string) => Promise<string>;
  generateTests: (code: string, language: string, framework?: string) => Promise<string>;
  generateDocumentation: (code: string, language: string) => Promise<string>;
  chatCompletion: (messages: AIMessage[], providerId?: string, conversationId?: string, projectId?: string) => Promise<string>;
  generateCodeCompletion: (context: string, language: string) => Promise<string[]>;
  
  // New bolt.diy capabilities
  generateFullApplication: (prompt: string, providerId?: string) => Promise<ProjectStructure>;
  refactorCodebase: (files: any[], providerId?: string) => Promise<any>;
  optimizePerformance: (project: any, providerId?: string) => Promise<any>;
  reviewSecurity: (codebase: any, providerId?: string) => Promise<any>;
  createTestSuite: (code: string, framework: string, providerId?: string) => Promise<any>;
  
  // Conversation management
  createConversation: (title?: string, projectId?: string) => Promise<AIConversation>;
  loadConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  
  // Utility actions
  loadProviders: () => Promise<void>;
  loadConversations: () => Promise<void>;
  clearError: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  isLoading: false,
  error: null,
  availableProviders: [],
  currentProvider: 'openai',
  conversations: [],
  currentConversation: null,

  setProvider: (providerId: string) => {
    set({ currentProvider: providerId });
  },

  clearError: () => {
    set({ error: null });
  },

  generateCode: async (prompt: string, language: string, context?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.generateCode({
        prompt,
        language,
        context,
        provider: get().currentProvider,
      });
      return response.code;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  explainCode: async (code: string, language: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.explainCode({
        code,
        language,
        provider: get().currentProvider,
      });
      return response.explanation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to explain code';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  debugCode: async (code: string, error: string, language: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.debugCode({
        code,
        error,
        language,
        provider: get().currentProvider,
      });
      return response.debugSuggestion;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to debug code';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  optimizeCode: async (code: string, language: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.optimizeCode({
        code,
        language,
        provider: get().currentProvider,
      });
      return response.optimizedCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize code';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateTests: async (code: string, language: string, framework?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.generateTests({
        code,
        language,
        testFramework: framework,
        provider: get().currentProvider,
      });
      return response.tests;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate tests';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateDocumentation: async (code: string, language: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.generateDocumentation({
        code,
        language,
        provider: get().currentProvider,
      });
      return response.documentation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate documentation';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  chatCompletion: async (messages: AIMessage[], providerId?: string, conversationId?: string, projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await aiService.chatCompletion({
        message: messages[messages.length - 1].content,
        conversationId,
        projectId,
        provider: providerId || get().currentProvider,
      });
      return response.response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get chat response';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateCodeCompletion: async (context: string, language: string) => {
    try {
      // Mock implementation - would call AI service in production
      return [
        `// AI-generated completion for ${language}`,
        `console.log('Generated code');`,
        `// TODO: Implement functionality`,
      ];
    } catch (error) {
      console.error('Code completion error:', error);
      return [];
    }
  },

  generateFullApplication: async (prompt: string, providerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock implementation - would call enhanced AI service
      const mockProject: ProjectStructure = {
        name: 'Generated Application',
        description: `Application generated from: ${prompt}`,
        files: [
          {
            path: 'src/App.tsx',
            content: '// Generated React application',
            type: 'file',
          },
          {
            path: 'package.json',
            content: JSON.stringify({
              name: 'generated-app',
              version: '1.0.0',
              dependencies: {
                react: '^18.0.0',
                'react-dom': '^18.0.0',
              },
            }, null, 2),
            type: 'file',
          },
        ],
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
        },
        configuration: {},
        documentation: '# Generated Application\n\nThis application was generated by AI.',
      };
      return mockProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate application';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refactorCodebase: async (files: any[], providerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock implementation
      return {
        refactoredFiles: files.map(file => ({
          ...file,
          content: `// Refactored: ${file.content}`,
        })),
        summary: 'Codebase refactored for improved structure and performance',
        changes: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refactor codebase';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  optimizePerformance: async (project: any, providerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock implementation
      return {
        suggestions: [
          {
            type: 'performance',
            priority: 'high',
            description: 'Optimize bundle size by code splitting',
            impact: 'medium',
            effort: 'low',
          },
        ],
        estimatedImpact: 'medium',
        implementationTime: 'low',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize performance';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reviewSecurity: async (codebase: any, providerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock implementation
      return {
        vulnerabilities: [],
        recommendations: ['Use HTTPS for all API calls', 'Validate user inputs'],
        riskLevel: 'medium',
        complianceStatus: 'partial',
        summary: 'Security review completed with recommendations',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to review security';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createTestSuite: async (code: string, framework: string, providerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock implementation
      return {
        unitTests: `// Generated ${framework} tests\ndescribe('Component', () => {\n  it('should render', () => {\n    // Test implementation\n  });\n});`,
        integrationTests: '',
        e2eTests: '',
        testConfig: '',
        coverage: 85,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test suite';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createConversation: async (title?: string, projectId?: string) => {
    try {
      const response = await aiService.createConversation({ title, projectId });
      const newConversation = response.conversation;
      set(state => ({
        conversations: [...state.conversations, newConversation],
        currentConversation: newConversation,
      }));
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      const response = await aiService.getConversation(conversationId);
      set({ currentConversation: response.conversation });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      await aiService.deleteConversation(conversationId);
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId ? null : state.currentConversation,
      }));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  loadProviders: async () => {
    try {
      const providers = await aiService.getProviders();
      set({ availableProviders: providers.providers });
    } catch (error) {
      console.error('Failed to load AI providers:', error);
    }
  },

  loadConversations: async () => {
    try {
      const conversations = await aiService.getConversations();
      set({ conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },
}));
