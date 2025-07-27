export enum AICapability {
  CODE_GENERATION = 'code_generation',
  CODE_EXPLANATION = 'code_explanation',
  CODE_DEBUGGING = 'code_debugging',
  CODE_OPTIMIZATION = 'code_optimization',
  CODE_REVIEW = 'code_review',
  TEST_GENERATION = 'test_generation',
  DOCUMENTATION = 'documentation',
  CHAT_COMPLETION = 'chat_completion',
  CODE_COMPLETION = 'code_completion',
  REFACTORING = 'refactoring',
  ARCHITECTURE_ADVICE = 'architecture_advice',
  SECURITY_ANALYSIS = 'security_analysis',
}

export interface AIRequest {
  capability: AICapability;
  prompt: string;
  context?: {
    language?: string;
    code?: string;
    error?: string;
    framework?: string;
    testFramework?: string;
    messages?: Array<{role: string; content: string}>;
    projectContext?: {
      files?: Array<{path: string; content: string}>;
      dependencies?: string[];
      framework?: string;
      description?: string;
    };
    [key: string]: any;
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    stream?: boolean;
    [key: string]: any;
  };
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
  metadata?: {
    provider: string;
    requestId?: string;
    processingTime?: number;
    [key: string]: any;
  };
}

export interface AIProvider {
  getName(): string;
  supportsCapability(capability: AICapability): boolean;
  getSupportedCapabilities(): AICapability[];
  generateResponse(request: AIRequest): Promise<AIResponse>;
  healthCheck(): Promise<void>;
  getUsageStats(): Promise<any>;
}

export interface AIMemory {
  id: string;
  type: 'conversation' | 'code_context' | 'project_context' | 'user_preference';
  content: any;
  metadata: {
    userId?: string;
    projectId?: string;
    fileId?: string;
    timestamp: Date;
    expiresAt?: Date;
    tags?: string[];
  };
}

export interface CodeContext {
  currentFile?: {
    path: string;
    content: string;
    language: string;
    cursor?: {line: number; column: number};
    selection?: {start: {line: number; column: number}; end: {line: number; column: number}};
  };
  openFiles?: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  projectStructure?: Array<{
    path: string;
    type: 'file' | 'directory';
    language?: string;
  }>;
  dependencies?: {
    [packageName: string]: string;
  };
  framework?: string;
  buildTools?: string[];
  recentChanges?: Array<{
    file: string;
    changes: any[];
    timestamp: Date;
  }>;
}

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  topic?: string;
  intent?: string;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  rateLimits?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

export interface AIAnalysisResult {
  type: 'code_analysis' | 'security_analysis' | 'performance_analysis' | 'architecture_analysis';
  findings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    message: string;
    file?: string;
    line?: number;
    column?: number;
    suggestion?: string;
    confidence: number;
  }>;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  recommendations: string[];
  metadata: {
    analysisTime: number;
    linesAnalyzed: number;
    filesAnalyzed: number;
    provider: string;
  };
}

export interface AICodeSuggestion {
  type: 'completion' | 'refactor' | 'fix' | 'optimize';
  original: {
    file: string;
    startLine: number;
    endLine: number;
    content: string;
  };
  suggested: {
    content: string;
    explanation: string;
    confidence: number;
  };
  metadata: {
    provider: string;
    model: string;
    timestamp: Date;
  };
}

export interface AITestCase {
  name: string;
  description: string;
  code: string;
  framework: string;
  type: 'unit' | 'integration' | 'e2e';
  coverage?: {
    lines: number[];
    functions: string[];
    branches: number[];
  };
  dependencies?: string[];
  setup?: string;
  teardown?: string;
}

export interface AIDocumentation {
  type: 'function' | 'class' | 'module' | 'api' | 'readme';
  content: string;
  format: 'markdown' | 'jsdoc' | 'sphinx' | 'javadoc';
  sections: Array<{
    title: string;
    content: string;
    type: 'description' | 'parameters' | 'returns' | 'examples' | 'notes';
  }>;
  metadata: {
    generatedFor: string;
    language: string;
    provider: string;
    timestamp: Date;
  };
}

// Enhanced types for bolt.diy integration
export interface ProjectStructure {
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

export interface RefactoredFiles {
  refactoredFiles: Array<{
    path: string;
    content: string;
    changes: string[];
  }>;
  summary: string;
  changes: Array<{
    type: 'added' | 'modified' | 'deleted' | 'moved';
    file: string;
    description: string;
  }>;
}

export interface OptimizationSuggestions {
  suggestions: Array<{
    type: 'performance' | 'memory' | 'network' | 'database' | 'ui';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
  estimatedImpact: 'low' | 'medium' | 'high';
  implementationTime: 'low' | 'medium' | 'high';
}

export interface Documentation {
  readme: string;
  apiDocs: string;
  userGuide: string;
  developerGuide: string;
  changelog: string;
  contributing: string;
}

export interface SecurityReport {
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    file?: string;
    line?: number;
    recommendation: string;
  }>;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
  summary: string;
}

export interface TestFiles {
  unitTests: string;
  integrationTests: string;
  e2eTests: string;
  testConfig: string;
  coverage: number;
}
