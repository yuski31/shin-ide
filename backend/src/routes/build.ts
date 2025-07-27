import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '@shared/types';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const buildParamsSchema = z.object({
  id: z.string().uuid(),
});

const projectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const buildRequestSchema = z.object({
  command: z.string().min(1),
  environment: z.enum(['development', 'production']).default('development'),
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

    const builds = await prisma.buildLog.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
      take: 50, // Limit to last 50 builds
    });

    res.json({
      success: true,
      data: builds
    } as ApiResponse<any[]>);
  })
);

router.get('/:id', validateParams(buildParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const build = await prisma.buildLog.findFirst({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          collaborators: {
            where: { userId },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!build) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Build not found'
      }
    } as ApiResponse<never>);
  }

  // Check access
  const hasAccess = build.project.ownerId === userId || 
                   build.project.collaborators.length > 0;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to build'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: build
  } as ApiResponse<any>);
}));

router.post('/project/:projectId/start', 
  validateParams(projectParamsSchema),
  validateRequest(buildRequestSchema),
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;
    const { command, environment } = req.body;
    const userId = req.userId;

    // Check project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: { 
                userId,
                role: { in: ['OWNER', 'EDITOR'] }
              }
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
          message: 'Access denied to project or insufficient permissions'
        }
      } as ApiResponse<never>);
    }

    // Create build log entry
    const buildLog = await prisma.buildLog.create({
      data: {
        projectId,
        command,
        status: 'RUNNING',
        startedAt: new Date(),
      }
    });

    // Start build process asynchronously
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    
    const buildProcess = spawn('npm', ['run', command], {
      cwd: projectPath,
      env: { 
        ...process.env, 
        NODE_ENV: environment 
      },
      stdio: 'pipe'
    });

    let output = '';
    let errors = '';
    let warnings = '';

    buildProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Check for warnings
      if (text.toLowerCase().includes('warning')) {
        warnings += text;
      }
    });

    buildProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      errors += text;
      
      // Some tools output warnings to stderr
      if (text.toLowerCase().includes('warning')) {
        warnings += text;
      }
    });

    buildProcess.on('close', async (code) => {
      const endTime = new Date();
      const duration = endTime.getTime() - buildLog.startedAt.getTime();
      
      await prisma.buildLog.update({
        where: { id: buildLog.id },
        data: {
          output,
          errors,
          warnings,
          status: code === 0 ? 'SUCCESS' : 'FAILED',
          duration,
          endedAt: endTime,
        }
      });
    });

    res.json({
      success: true,
      data: {
        buildId: buildLog.id,
        status: 'RUNNING',
        message: 'Build started successfully'
      }
    } as ApiResponse<any>);
  })
);

router.post('/:id/cancel', 
  validateParams(buildParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.userId;

    const build = await prisma.buildLog.findFirst({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            collaborators: {
              where: { userId },
              select: { role: true }
            }
          }
        }
      }
    });

    if (!build) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Build not found'
        }
      } as ApiResponse<never>);
    }

    // Check permissions
    const hasPermission = build.project.ownerId === userId || 
                         build.project.collaborators.some(c => 
                           ['OWNER', 'EDITOR'].includes(c.role)
                         );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to cancel build'
        }
      } as ApiResponse<never>);
    }

    if (build.status !== 'RUNNING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Build is not running'
        }
      } as ApiResponse<never>);
    }

    // Update build status
    const updatedBuild = await prisma.buildLog.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
        duration: new Date().getTime() - build.startedAt.getTime(),
      }
    });

    res.json({
      success: true,
      data: updatedBuild
    } as ApiResponse<any>);
  })
);

router.delete('/:id', validateParams(buildParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const build = await prisma.buildLog.findFirst({
    where: { id },
    include: {
      project: {
        select: {
          ownerId: true,
          collaborators: {
            where: { userId },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!build) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Build not found'
      }
    } as ApiResponse<never>);
  }

  // Check permissions
  const hasPermission = build.project.ownerId === userId || 
                       build.project.collaborators.some(c => 
                         ['OWNER', 'EDITOR'].includes(c.role)
                       );

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to delete build'
      }
    } as ApiResponse<never>);
  }

  await prisma.buildLog.delete({
    where: { id }
  });

  res.json({
    success: true,
    data: null
  } as ApiResponse<null>);
}));

// Get build statistics for a project
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

    const stats = await prisma.buildLog.groupBy({
      by: ['status'],
      where: { projectId },
      _count: {
        status: true,
      },
    });

    const totalBuilds = await prisma.buildLog.count({
      where: { projectId }
    });

    const avgDuration = await prisma.buildLog.aggregate({
      where: { 
        projectId,
        duration: { not: null }
      },
      _avg: {
        duration: true,
      },
    });

    const recentBuilds = await prisma.buildLog.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        command: true,
        status: true,
        duration: true,
        startedAt: true,
      }
    });

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        totalBuilds,
        statusCounts: formattedStats,
        averageDuration: avgDuration._avg.duration,
        recentBuilds,
      }
    } as ApiResponse<any>);
  })
);

export default router;
