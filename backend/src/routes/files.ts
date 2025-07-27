import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, FileNode } from '@shared/types';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createFileSchema = z.object({
  projectId: z.string().uuid(),
  path: z.string().min(1),
  content: z.string().optional(),
  type: z.enum(['file', 'directory']).default('file'),
});

const updateFileContentSchema = z.object({
  content: z.string(),
});

const renameFileSchema = z.object({
  name: z.string().min(1),
});

const moveFileSchema = z.object({
  path: z.string().min(1),
});

const fileParamsSchema = z.object({
  id: z.string().uuid(),
});

const projectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const searchQuerySchema = z.object({
  q: z.string().min(1),
});

// Helper functions
const buildFileTree = (files: any[]): FileNode[] => {
  const fileMap = new Map<string, FileNode>();
  const rootFiles: FileNode[] = [];

  // Create file nodes
  files.forEach(file => {
    fileMap.set(file.id, {
      ...file,
      children: [],
    });
  });

  // Build tree structure
  files.forEach(file => {
    const fileNode = fileMap.get(file.id)!;
    if (file.parentId && fileMap.has(file.parentId)) {
      const parent = fileMap.get(file.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(fileNode);
    } else {
      rootFiles.push(fileNode);
    }
  });

  return rootFiles;
};

const checkProjectAccess = async (projectId: string, userId: string) => {
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

  return !!project;
};

// Routes
router.get('/project/:projectId', 
  validateParams(projectParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;
    const userId = req.userId;

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to project'
        }
      } as ApiResponse<never>);
    }

    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: [
        { isDirectory: 'desc' },
        { name: 'asc' }
      ]
    });

    const fileTree = buildFileTree(files);

    res.json({
      success: true,
      data: fileTree
    } as ApiResponse<FileNode[]>);
  })
);

router.get('/:id', validateParams(fileParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      project: true
    }
  });

  if (!file) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File not found'
      }
    } as ApiResponse<never>);
  }

  // Check project access
  const hasAccess = await checkProjectAccess(file.projectId, userId);
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to file'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: file
  } as ApiResponse<FileNode>);
}));

router.get('/:id/content', validateParams(fileParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const file = await prisma.file.findUnique({
    where: { id }
  });

  if (!file) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File not found'
      }
    } as ApiResponse<never>);
  }

  // Check project access
  const hasAccess = await checkProjectAccess(file.projectId, userId);
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to file'
      }
    } as ApiResponse<never>);
  }

  if (file.isDirectory) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OPERATION',
        message: 'Cannot get content of directory'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: { content: file.content || '' }
  } as ApiResponse<{ content: string }>);
}));

router.post('/', validateRequest(createFileSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId, path: filePath, content, type } = req.body;
  const userId = req.userId;

  // Check project access
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to project'
      }
    } as ApiResponse<never>);
  }

  // Parse path to get name and parent directory
  const pathParts = filePath.split('/').filter(Boolean);
  const name = pathParts[pathParts.length - 1];
  const parentPath = pathParts.slice(0, -1).join('/');

  // Find parent directory if exists
  let parentId: string | null = null;
  if (parentPath) {
    const parent = await prisma.file.findFirst({
      where: {
        projectId,
        path: parentPath,
        isDirectory: true,
      }
    });
    parentId = parent?.id || null;
  }

  // Check if file already exists
  const existingFile = await prisma.file.findFirst({
    where: {
      projectId,
      path: filePath,
    }
  });

  if (existingFile) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'File already exists at this path'
      }
    } as ApiResponse<never>);
  }

  const file = await prisma.file.create({
    data: {
      name,
      path: filePath,
      content: type === 'file' ? (content || '') : null,
      isDirectory: type === 'directory',
      projectId,
      parentId,
    }
  });

  res.status(201).json({
    success: true,
    data: file
  } as ApiResponse<FileNode>);
}));

router.put('/:id/content', 
  validateParams(fileParamsSchema),
  validateRequest(updateFileContentSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found'
        }
      } as ApiResponse<never>);
    }

    // Check project access
    const hasAccess = await checkProjectAccess(file.projectId, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to file'
        }
      } as ApiResponse<never>);
    }

    if (file.isDirectory) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: 'Cannot update content of directory'
        }
      } as ApiResponse<never>);
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: { 
        content,
        updatedAt: new Date(),
      }
    });

    res.json({
      success: true,
      data: updatedFile
    } as ApiResponse<FileNode>);
  })
);

router.put('/:id/rename',
  validateParams(fileParamsSchema),
  validateRequest(renameFileSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found'
        }
      } as ApiResponse<never>);
    }

    // Check project access
    const hasAccess = await checkProjectAccess(file.projectId, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to file'
        }
      } as ApiResponse<never>);
    }

    // Update path
    const pathParts = file.path.split('/');
    pathParts[pathParts.length - 1] = name;
    const newPath = pathParts.join('/');

    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        name,
        path: newPath,
        updatedAt: new Date(),
      }
    });

    res.json({
      success: true,
      data: updatedFile
    } as ApiResponse<FileNode>);
  })
);

router.delete('/:id', validateParams(fileParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.userId;

  const file = await prisma.file.findUnique({
    where: { id }
  });

  if (!file) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File not found'
      }
    } as ApiResponse<never>);
  }

  // Check project access
  const hasAccess = await checkProjectAccess(file.projectId, userId);
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to file'
      }
    } as ApiResponse<never>);
  }

  // If directory, delete all children recursively
  if (file.isDirectory) {
    await prisma.file.deleteMany({
      where: {
        path: {
          startsWith: file.path + '/'
        },
        projectId: file.projectId,
      }
    });
  }

  await prisma.file.delete({
    where: { id }
  });

  res.json({
    success: true,
    data: null
  } as ApiResponse<null>);
}));

router.get('/project/:projectId/search',
  validateParams(projectParamsSchema),
  validateQuery(searchQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;
    const { q } = req.query;
    const userId = req.userId;

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to project'
        }
      } as ApiResponse<never>);
    }

    const files = await prisma.file.findMany({
      where: {
        projectId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } }
        ]
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: files
    } as ApiResponse<FileNode[]>);
  })
);

export default router;
