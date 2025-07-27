import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, PaginatedResponse } from '@shared/types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const templateQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('20'),
  framework: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

const templateParamsSchema = z.object({
  id: z.string().uuid(),
});

// Routes
router.get('/', validateQuery(templateQuerySchema), asyncHandler(async (req: any, res: any) => {
  const { page, limit, framework, category, search } = req.query;

  const where: any = {
    isPublic: true,
  };

  if (framework) {
    where.framework = framework;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } }
    ];
  }

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy: [
        { isOfficial: 'desc' },
        { downloads: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.template.count({ where })
  ]);

  const response: PaginatedResponse<any> = {
    success: true,
    data: templates,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };

  res.json(response);
}));

router.get('/categories', asyncHandler(async (req: any, res: any) => {
  const categories = await prisma.template.groupBy({
    by: ['category'],
    where: { isPublic: true },
    _count: {
      category: true,
    },
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  });

  const formattedCategories = categories.map(cat => ({
    name: cat.category,
    count: cat._count.category,
  }));

  res.json({
    success: true,
    data: formattedCategories
  } as ApiResponse<any[]>);
}));

router.get('/frameworks', asyncHandler(async (req: any, res: any) => {
  const frameworks = await prisma.template.groupBy({
    by: ['framework'],
    where: { isPublic: true },
    _count: {
      framework: true,
    },
    orderBy: {
      _count: {
        framework: 'desc'
      }
    }
  });

  const formattedFrameworks = frameworks.map(fw => ({
    name: fw.framework,
    count: fw._count.framework,
  }));

  res.json({
    success: true,
    data: formattedFrameworks
  } as ApiResponse<any[]>);
}));

router.get('/popular', asyncHandler(async (req: any, res: any) => {
  const templates = await prisma.template.findMany({
    where: { isPublic: true },
    orderBy: { downloads: 'desc' },
    take: 10,
  });

  res.json({
    success: true,
    data: templates
  } as ApiResponse<any[]>);
}));

router.get('/official', asyncHandler(async (req: any, res: any) => {
  const templates = await prisma.template.findMany({
    where: { 
      isPublic: true,
      isOfficial: true 
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: templates
  } as ApiResponse<any[]>);
}));

router.get('/:id', validateParams(templateParamsSchema), asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const template = await prisma.template.findUnique({
    where: { id }
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Template not found'
      }
    } as ApiResponse<never>);
  }

  // Increment download count
  await prisma.template.update({
    where: { id },
    data: { downloads: { increment: 1 } }
  });

  res.json({
    success: true,
    data: template
  } as ApiResponse<any>);
}));

// Default templates data
const defaultTemplates = [
  {
    name: 'React TypeScript Starter',
    description: 'A modern React application with TypeScript, Vite, and Tailwind CSS',
    framework: 'REACT',
    category: 'starter',
    tags: ['react', 'typescript', 'vite', 'tailwind'],
    isOfficial: true,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'react-typescript-starter',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview'
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            '@vitejs/plugin-react': '^4.0.0',
            typescript: '^5.0.0',
            vite: '^4.0.0',
            tailwindcss: '^3.3.0'
          }
        }, null, 2)
      },
      {
        path: 'src/App.tsx',
        content: `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to React + TypeScript
        </h1>
        <p className="text-gray-600">
          Start building your amazing application!
        </p>
      </div>
    </div>
  );
}

export default App;`
      },
      {
        path: 'src/main.tsx',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      {
        path: 'src/index.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React TypeScript App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      }
    ]
  },
  {
    name: 'Vue 3 Composition API',
    description: 'Modern Vue 3 application with Composition API and TypeScript',
    framework: 'VUE',
    category: 'starter',
    tags: ['vue', 'typescript', 'composition-api'],
    isOfficial: true,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'vue3-typescript-starter',
          version: '1.0.0',
          scripts: {
            dev: 'vite',
            build: 'vue-tsc && vite build',
            preview: 'vite preview'
          },
          dependencies: {
            vue: '^3.3.0'
          },
          devDependencies: {
            '@vitejs/plugin-vue': '^4.0.0',
            typescript: '^5.0.0',
            'vue-tsc': '^1.0.0',
            vite: '^4.0.0'
          }
        }, null, 2)
      }
    ]
  }
];

// Initialize default templates
router.post('/seed', asyncHandler(async (req: any, res: any) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Template seeding not allowed in production'
      }
    } as ApiResponse<never>);
  }

  const createdTemplates = [];
  
  for (const template of defaultTemplates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name }
    });

    if (!existing) {
      const created = await prisma.template.create({
        data: template
      });
      createdTemplates.push(created);
    }
  }

  res.json({
    success: true,
    data: {
      message: `Created ${createdTemplates.length} templates`,
      templates: createdTemplates
    }
  } as ApiResponse<any>);
}));

export default router;
