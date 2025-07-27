import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '@shared/types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const terminalParamsSchema = z.object({
  id: z.string().uuid(),
});

const projectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const commandSchema = z.object({
  command: z.string().min(1),
});

// Routes
router.get('/project/:projectId', 
  validateParams(projectParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;
    const userId = req.userId;

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: { userId }
            }
          }
        ]
      }
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to project'
        }
      } as ApiResponse<never>);
    }

    const terminals = await prisma.terminal.findMany({
      where: {
        projectId,
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: terminals
    } as ApiResponse<any[]>);
  })
);

router.get('/:id', validateParams(terminalParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const terminal = await prisma.terminal.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });

  if (!terminal) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Terminal not found'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: terminal
  } as ApiResponse<any>);
}));

router.get('/:id/history', 
  validateParams(terminalParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.userId;

    // Verify terminal ownership
    const terminal = await prisma.terminal.findFirst({
      where: {
        id,
        userId,
      }
    });

    if (!terminal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Terminal not found'
        }
      } as ApiResponse<never>);
    }

    const commands = await prisma.terminalCommand.findMany({
      where: { terminalId: id },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to last 100 commands
    });

    res.json({
      success: true,
      data: commands
    } as ApiResponse<any[]>);
  })
);

router.post('/:id/command', 
  validateParams(terminalParamsSchema),
  validateRequest(commandSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { command } = req.body;
    const userId = req.userId;

    // Verify terminal ownership
    const terminal = await prisma.terminal.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      }
    });

    if (!terminal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Terminal not found or inactive'
        }
      } as ApiResponse<never>);
    }

    // Save command to history
    const terminalCommand = await prisma.terminalCommand.create({
      data: {
        terminalId: id,
        command,
        timestamp: new Date(),
      }
    });

    res.json({
      success: true,
      data: terminalCommand
    } as ApiResponse<any>);
  })
);

router.put('/:id/deactivate', 
  validateParams(terminalParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.userId;

    const terminal = await prisma.terminal.findFirst({
      where: {
        id,
        userId,
      }
    });

    if (!terminal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Terminal not found'
        }
      } as ApiResponse<never>);
    }

    const updatedTerminal = await prisma.terminal.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      data: updatedTerminal
    } as ApiResponse<any>);
  })
);

router.delete('/:id', validateParams(terminalParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const terminal = await prisma.terminal.findFirst({
    where: {
      id,
      userId,
    }
  });

  if (!terminal) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Terminal not found'
      }
    } as ApiResponse<never>);
  }

  // Delete terminal and all associated commands
  await prisma.terminal.delete({
    where: { id }
  });

  res.json({
    success: true,
    data: null
  } as ApiResponse<null>);
}));

// Get terminal statistics
router.get('/project/:projectId/stats', 
  validateParams(projectParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;
    const userId = req.userId;

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: { userId }
            }
          }
        ]
      }
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to project'
        }
      } as ApiResponse<never>);
    }

    const stats = await prisma.terminal.aggregate({
      where: {
        projectId,
        userId,
      },
      _count: {
        id: true,
      },
    });

    const commandStats = await prisma.terminalCommand.aggregate({
      where: {
        terminal: {
          projectId,
          userId,
        }
      },
      _count: {
        id: true,
      },
    });

    const activeTerminals = await prisma.terminal.count({
      where: {
        projectId,
        userId,
        isActive: true,
      }
    });

    res.json({
      success: true,
      data: {
        totalTerminals: stats._count.id,
        activeTerminals,
        totalCommands: commandStats._count.id,
      }
    } as ApiResponse<any>);
  })
);

export default router;
