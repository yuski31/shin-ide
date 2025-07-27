import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '@shared/types';
import { AIServiceManager } from '../services/ai/AIServiceManager';
import { AICapability } from '../services/ai/types';

const router = express.Router();
const prisma = new PrismaClient();
const aiManager = new AIServiceManager();

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  provider: z.string().optional(),
});

const codeGenerationSchema = z.object({
  prompt: z.string().min(1),
  language: z.string().min(1),
  framework: z.string().optional(),
  context: z.object({
    projectId: z.string().uuid().optional(),
    currentFile: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
  }).optional(),
  provider: z.string().optional(),
});

const codeExplanationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  provider: z.string().optional(),
});

const codeDebuggingSchema = z.object({
  code: z.string().min(1),
  error: z.string().min(1),
  language: z.string().min(1),
  provider: z.string().optional(),
});

const codeOptimizationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  provider: z.string().optional(),
});

const testGenerationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  testFramework: z.string().optional(),
  provider: z.string().optional(),
});

const documentationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  provider: z.string().optional(),
});

const conversationParamsSchema = z.object({
  id: z.string().uuid(),
});

// Routes
router.get('/providers', asyncHandler(async (req: any, res: any) => {
  const providers = aiManager.getAvailableProviders();
  const defaultProvider = aiManager.getDefaultProvider();
  
  res.json({
    success: true,
    data: {
      providers,
      defaultProvider,
    }
  } as ApiResponse<any>);
}));

router.get('/health', asyncHandler(async (req: any, res: any) => {
  const healthStatus = await aiManager.healthCheck();
  
  res.json({
    success: true,
    data: healthStatus
  } as ApiResponse<any>);
}));

router.get('/usage', asyncHandler(async (req: any, res: any) => {
  const usageStats = await aiManager.getUsageStats();
  
  res.json({
    success: true,
    data: usageStats
  } as ApiResponse<any>);
}));

router.post('/chat', validateRequest(chatRequestSchema), asyncHandler(async (req: any, res: any) => {
  const { message, conversationId, projectId, provider } = req.body;
  const userId = req.userId;

  try {
    let conversation;
    
    if (conversationId) {
      // Get existing conversation
      conversation = await prisma.aIConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        } as ApiResponse<never>);
      }
    } else {
      // Create new conversation
      conversation = await prisma.aIConversation.create({
        data: {
          userId,
          projectId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: {
          messages: true
        }
      });
    }

    // Add user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      }
    });

    // Prepare messages for AI
    const messages = [
      ...conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message }
    ];

    // Get AI response
    const aiResponse = await aiManager.chatCompletion(messages, provider);

    // Save AI response
    const aiMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
      }
    });

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: aiMessage,
        response: aiResponse,
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'AI service error'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/generate-code', validateRequest(codeGenerationSchema), asyncHandler(async (req: any, res: any) => {
  const { prompt, language, framework, context, provider } = req.body;

  try {
    const code = await aiManager.generateCode(prompt, language, {
      framework,
      ...context,
    }, provider);

    res.json({
      success: true,
      data: { code }
    } as ApiResponse<{ code: string }>);
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Code generation failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/explain-code', validateRequest(codeExplanationSchema), asyncHandler(async (req: any, res: any) => {
  const { code, language, provider } = req.body;

  try {
    const explanation = await aiManager.explainCode(code, language, provider);

    res.json({
      success: true,
      data: { explanation }
    } as ApiResponse<{ explanation: string }>);
  } catch (error) {
    console.error('Code explanation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Code explanation failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/debug-code', validateRequest(codeDebuggingSchema), asyncHandler(async (req: any, res: any) => {
  const { code, error, language, provider } = req.body;

  try {
    const debugSuggestion = await aiManager.debugCode(code, error, language, provider);

    res.json({
      success: true,
      data: { debugSuggestion }
    } as ApiResponse<{ debugSuggestion: string }>);
  } catch (error) {
    console.error('Code debugging error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Code debugging failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/optimize-code', validateRequest(codeOptimizationSchema), asyncHandler(async (req: any, res: any) => {
  const { code, language, provider } = req.body;

  try {
    const optimizedCode = await aiManager.optimizeCode(code, language, provider);

    res.json({
      success: true,
      data: { optimizedCode }
    } as ApiResponse<{ optimizedCode: string }>);
  } catch (error) {
    console.error('Code optimization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Code optimization failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/generate-tests', validateRequest(testGenerationSchema), asyncHandler(async (req: any, res: any) => {
  const { code, language, testFramework, provider } = req.body;

  try {
    const tests = await aiManager.generateTests(code, language, testFramework, provider);

    res.json({
      success: true,
      data: { tests }
    } as ApiResponse<{ tests: string }>);
  } catch (error) {
    console.error('Test generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Test generation failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/generate-docs', validateRequest(documentationSchema), asyncHandler(async (req: any, res: any) => {
  const { code, language, provider } = req.body;

  try {
    const documentation = await aiManager.generateDocumentation(code, language, provider);

    res.json({
      success: true,
      data: { documentation }
    } as ApiResponse<{ documentation: string }>);
  } catch (error) {
    console.error('Documentation generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Documentation generation failed'
      }
    } as ApiResponse<never>);
  }
}));

// Conversation management
router.get('/conversations', asyncHandler(async (req: any, res: any) => {
  const userId = req.userId;
  const { projectId } = req.query;

  const where: any = { userId };
  if (projectId) {
    where.projectId = projectId;
  }

  const conversations = await prisma.aIConversation.findMany({
    where,
    include: {
      _count: {
        select: { messages: true }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  res.json({
    success: true,
    data: conversations
  } as ApiResponse<any[]>);
}));

router.get('/conversations/:id', 
  validateParams(conversationParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found'
        }
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: conversation
    } as ApiResponse<any>);
  })
);

router.delete('/conversations/:id',
  validateParams(conversationParamsSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId,
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found'
        }
      } as ApiResponse<never>);
    }

    await prisma.aIConversation.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: null
    } as ApiResponse<null>);
  })
);

// Enhanced bolt.diy integration endpoints
const generateApplicationSchema = z.object({
  prompt: z.string().min(1),
  provider: z.string().optional(),
});

const refactorCodebaseSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
  provider: z.string().optional(),
});

const optimizePerformanceSchema = z.object({
  project: z.object({
    id: z.string(),
    files: z.array(z.any()).optional(),
  }),
  provider: z.string().optional(),
});

const securityReviewSchema = z.object({
  codebase: z.object({
    files: z.array(z.any()),
  }),
  provider: z.string().optional(),
});

const testSuiteSchema = z.object({
  code: z.string().min(1),
  framework: z.string().min(1),
  provider: z.string().optional(),
});

router.post('/generate-application', validateRequest(generateApplicationSchema), asyncHandler(async (req: any, res: any) => {
  const { prompt, provider } = req.body;

  try {
    const application = await aiManager.generateFullApplication(prompt, provider);

    res.json({
      success: true,
      data: application
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Application generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Application generation failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/refactor-codebase', validateRequest(refactorCodebaseSchema), asyncHandler(async (req: any, res: any) => {
  const { files, provider } = req.body;

  try {
    const refactoredCode = await aiManager.refactorCodebase(files, provider);

    res.json({
      success: true,
      data: refactoredCode
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Codebase refactoring error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Codebase refactoring failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/optimize-performance', validateRequest(optimizePerformanceSchema), asyncHandler(async (req: any, res: any) => {
  const { project, provider } = req.body;

  try {
    const optimizations = await aiManager.optimizePerformance(project, provider);

    res.json({
      success: true,
      data: optimizations
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Performance optimization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Performance optimization failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/security-review', validateRequest(securityReviewSchema), asyncHandler(async (req: any, res: any) => {
  const { codebase, provider } = req.body;

  try {
    const securityReport = await aiManager.reviewSecurity(codebase, provider);

    res.json({
      success: true,
      data: securityReport
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Security review error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Security review failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/create-test-suite', validateRequest(testSuiteSchema), asyncHandler(async (req: any, res: any) => {
  const { code, framework, provider } = req.body;

  try {
    const testSuite = await aiManager.createTestSuite(code, framework, provider);

    res.json({
      success: true,
      data: testSuite
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Test suite creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Test suite creation failed'
      }
    } as ApiResponse<never>);
  }
}));

export default router;
