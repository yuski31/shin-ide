import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, User } from '@shared/types';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    fontSize: z.number().min(10).max(24).optional(),
    tabSize: z.number().min(1).max(8).optional(),
    autoSave: z.boolean().optional(),
    autoFormat: z.boolean().optional(),
    linting: z.boolean().optional(),
  }).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

const userParamsSchema = z.object({
  id: z.string().uuid(),
});

// Helper function to exclude password
const excludePassword = (user: any): User => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Routes
router.get('/me', asyncHandler(async (req: any, res: any) => {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          ownedProjects: true,
          collaborations: true,
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: excludePassword(user)
  } as ApiResponse<User>);
}));

router.put('/me', validateRequest(updateUserSchema), asyncHandler(async (req: any, res: any) => {
  const userId = req.userId;
  const updates = req.body;

  // Check if username is being updated and is unique
  if (updates.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: updates.username,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_TAKEN',
          message: 'Username is already taken'
        }
      } as ApiResponse<never>);
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updates,
      preferences: updates.preferences 
        ? { ...updates.preferences }
        : undefined,
    },
    include: {
      _count: {
        select: {
          ownedProjects: true,
          collaborations: true,
        }
      }
    }
  });

  res.json({
    success: true,
    data: excludePassword(user)
  } as ApiResponse<User>);
}));

router.post('/change-password', 
  validateRequest(changePasswordSchema), 
  asyncHandler(async (req: any, res: any) => {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      } as ApiResponse<never>);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      } as ApiResponse<never>);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      data: { message: 'Password changed successfully' }
    } as ApiResponse<{ message: string }>);
  })
);

router.get('/:id', validateParams(userParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          ownedProjects: {
            where: { isPublic: true }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    } as ApiResponse<never>);
  }

  res.json({
    success: true,
    data: user
  } as ApiResponse<any>);
}));

router.delete('/me', asyncHandler(async (req: any, res: any) => {
  const userId = req.userId;

  // Delete user and all related data (cascading deletes handled by Prisma)
  await prisma.user.delete({
    where: { id: userId }
  });

  res.json({
    success: true,
    data: { message: 'Account deleted successfully' }
  } as ApiResponse<{ message: string }>);
}));

export default router;
