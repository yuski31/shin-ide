import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, PaginatedResponse, Project } from '@shared/types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  framework: z.enum(['react', 'vue', 'nextjs', 'vanilla', 'angular', 'svelte']),
  isPublic: z.boolean().default(false),
  settings: z.object({
    autoSave: z.boolean().default(true),
    autoFormat: z.boolean().default(true),
    linting: z.boolean().default(true),
    typeChecking: z.boolean().default(true),
    hotReload: z.boolean().default(true),
    theme: z.enum(['light', 'dark']).default('dark'),
    fontSize: z.number().min(10).max(24).default(14),
    tabSize: z.number().min(1).max(8).default(2),
    wordWrap: z.boolean().default(true),
  }).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  settings: z.object({
    autoSave: z.boolean().optional(),
    autoFormat: z.boolean().optional(),
    linting: z.boolean().optional(),
    typeChecking: z.boolean().optional(),
    hotReload: z.boolean().optional(),
    theme: z.enum(['light', 'dark']).optional(),
    fontSize: z.number().min(10).max(24).optional(),
    tabSize: z.number().min(1).max(8).optional(),
    wordWrap: z.boolean().optional(),
  }).optional(),
});

const projectParamsSchema = z.object({
  id: z.string().uuid(),
});

const projectQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  search: z.string().optional(),
  framework: z.string().optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
});

// Routes
router.get('/', validateQuery(projectQuerySchema), asyncHandler(async (req: any, res: any) => {
  const { page, limit, search, framework, isPublic } = req.query;
  const userId = req.userId;

  const where: any = {
    OR: [
      { ownerId: userId },
      {
        collaborators: {
          some: { userId }
        }
      }
    ]
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (framework) {
    where.framework = framework;
  }

  if (isPublic !== undefined) {
    where.isPublic = isPublic;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            files: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where })
  ]);

  const response: PaginatedResponse<Project> = {
    success: true,
    data: projects as any,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };

  res.json(response);
}));

router.get('/:id', validateParams(projectParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: { userId }
          }
        },
        { isPublic: true }
      ]
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        }
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      _count: {
        select: {
          files: true,
        }
      }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: project
  } as ApiResponse<Project>);
}));

router.post('/', validateRequest(createProjectSchema), asyncHandler(async (req: any, res: any) => {
  const userId = req.userId;
  const { name, description, framework, isPublic, settings } = req.body;

  // Check if user already has a project with this name
  const existingProject = await prisma.project.findFirst({
    where: {
      name,
      ownerId: userId,
    }
  });

  if (existingProject) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Project with this name already exists'
      }
    } as ApiResponse<never>);
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      framework,
      isPublic,
      settings: settings || {},
      ownerId: userId,
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        }
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      _count: {
        select: {
          files: true,
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: project
  } as ApiResponse<Project>);
}));

router.put('/:id', 
  validateParams(projectParamsSchema),
  validateRequest(updateProjectSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    // Check if user owns the project or is a collaborator with edit permissions
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: {
                userId,
                role: { in: ['owner', 'editor'] }
              }
            }
          }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found or insufficient permissions'
        }
      } as ApiResponse<never>);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...updates,
        settings: updates.settings 
          ? { ...project.settings, ...updates.settings }
          : project.settings,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            files: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedProject
    } as ApiResponse<Project>);
  })
);

router.delete('/:id', validateParams(projectParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  // Check if user owns the project
  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: userId,
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found or insufficient permissions'
      }
    } as ApiResponse<never>);
  }

  await prisma.project.delete({
    where: { id }
  });

  res.json({
    success: true,
    data: null
  } as ApiResponse<null>);
}));

export default router;
