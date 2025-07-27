import express from 'express';
import { z } from 'zod';
import { validateRequest, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '@shared/types';
import { WebContainerService } from '../services/WebContainerService';

const router = express.Router();
const webContainerService = new WebContainerService();

// Validation schemas
const initializeContainerSchema = z.object({
  projectId: z.string().uuid(),
});

const installDependenciesSchema = z.object({
  projectId: z.string().uuid(),
  packageManager: z.enum(['npm', 'yarn', 'pnpm']).default('npm'),
});

const startDevServerSchema = z.object({
  projectId: z.string().uuid(),
  port: z.number().min(1000).max(65535).default(3000),
});

const executeCommandSchema = z.object({
  projectId: z.string().uuid(),
  command: z.string().min(1),
});

const writeFileSchema = z.object({
  projectId: z.string().uuid(),
  path: z.string().min(1),
  content: z.string(),
});

const readFileSchema = z.object({
  projectId: z.string().uuid(),
  path: z.string().min(1),
});

const projectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

// Routes
router.post('/initialize', validateRequest(initializeContainerSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId } = req.body;

  try {
    await webContainerService.initializeContainer(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        status: 'initialized',
        message: 'WebContainer initialized successfully'
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('WebContainer initialization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'WebContainer initialization failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/install-dependencies', validateRequest(installDependenciesSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId, packageManager } = req.body;

  try {
    await webContainerService.installDependencies(packageManager);

    res.json({
      success: true,
      data: {
        projectId,
        packageManager,
        status: 'installing',
        message: 'Dependencies installation started'
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Dependencies installation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'Dependencies installation failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/start-dev-server', validateRequest(startDevServerSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId, port } = req.body;

  try {
    const url = await webContainerService.startDevServer(port);

    res.json({
      success: true,
      data: {
        projectId,
        port,
        url,
        status: 'starting',
        message: 'Development server starting'
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Dev server start error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'Dev server start failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/build', validateRequest(initializeContainerSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId } = req.body;

  try {
    const buildResult = await webContainerService.runBuildProcess();

    res.json({
      success: true,
      data: {
        projectId,
        ...buildResult
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Build process error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'Build process failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/execute-command', validateRequest(executeCommandSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId, command } = req.body;

  try {
    const result = await webContainerService.executeTerminalCommand(command);

    res.json({
      success: true,
      data: {
        projectId,
        command,
        ...result
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Command execution error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'Command execution failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/write-file', validateRequest(writeFileSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId, path, content } = req.body;

  try {
    await webContainerService.writeFile(path, content);

    res.json({
      success: true,
      data: {
        projectId,
        path,
        message: 'File written successfully'
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('File write error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'File write failed'
      }
    } as ApiResponse<never>);
  }
}));

router.post('/read-file', validateRequest(readFileSchema), asyncHandler(async (req: any, res: any) => {
  const { projectId, path } = req.body;

  try {
    const content = await webContainerService.readFile(path);

    res.json({
      success: true,
      data: {
        projectId,
        path,
        content
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('File read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBCONTAINER_ERROR',
        message: error instanceof Error ? error.message : 'File read failed'
      }
    } as ApiResponse<never>);
  }
}));

router.get('/preview/:projectId/:port', 
  validateParams(z.object({
    projectId: z.string().uuid(),
    port: z.string().regex(/^\d+$/).transform(Number),
  })), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId, port } = req.params;

    try {
      const previewUrl = await webContainerService.getPreviewUrl(port);

      res.json({
        success: true,
        data: {
          projectId,
          port,
          previewUrl
        }
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Preview URL generation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WEBCONTAINER_ERROR',
          message: error instanceof Error ? error.message : 'Preview URL generation failed'
        }
      } as ApiResponse<never>);
    }
  })
);

router.get('/processes/:projectId', 
  validateParams(projectParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;

    try {
      const processes = webContainerService.getRunningProcesses();

      res.json({
        success: true,
        data: {
          projectId,
          processes
        }
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Process list error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WEBCONTAINER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get process list'
        }
      } as ApiResponse<never>);
    }
  })
);

router.delete('/processes/:projectId/:processId', 
  validateParams(z.object({
    projectId: z.string().uuid(),
    processId: z.string(),
  })), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId, processId } = req.params;

    try {
      await webContainerService.stopProcess(processId);

      res.json({
        success: true,
        data: {
          projectId,
          processId,
          message: 'Process stopped successfully'
        }
      } as ApiResponse<any>);
    } catch (error) {
      console.error('Process stop error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WEBCONTAINER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to stop process'
        }
      } as ApiResponse<never>);
    }
  })
);

router.delete('/cleanup/:projectId', 
  validateParams(projectParamsSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { projectId } = req.params;

    try {
      await webContainerService.cleanup();

      res.json({
        success: true,
        data: {
          projectId,
          message: 'WebContainer cleaned up successfully'
        }
      } as ApiResponse<any>);
    } catch (error) {
      console.error('WebContainer cleanup error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WEBCONTAINER_ERROR',
          message: error instanceof Error ? error.message : 'WebContainer cleanup failed'
        }
      } as ApiResponse<never>);
    }
  })
);

export default router;
