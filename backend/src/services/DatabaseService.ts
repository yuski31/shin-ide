import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async runMigrations(): Promise<void> {
    try {
      // In production, migrations should be run separately
      if (process.env.NODE_ENV !== 'production') {
        console.log('Running database migrations...');
        // Note: Prisma migrations are typically run via CLI
        // This is just a placeholder for any custom migration logic
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async seedDatabase(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Seeding database...');
        
        // Check if admin user exists
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });

        if (!adminUser) {
          // Create default admin user
          await this.prisma.user.create({
            data: {
              email: 'admin@shinide.com',
              username: 'admin',
              firstName: 'Admin',
              lastName: 'User',
              password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', // password: admin123
              role: 'ADMIN',
              isActive: true,
            }
          });
          console.log('✅ Default admin user created');
        }

        // Seed default templates if none exist
        const templateCount = await this.prisma.template.count();
        if (templateCount === 0) {
          await this.seedDefaultTemplates();
        }
      }
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }

  private async seedDefaultTemplates(): Promise<void> {
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
        files: []
      },
      {
        name: 'Next.js App Router',
        description: 'Next.js 13+ application with App Router and TypeScript',
        framework: 'NEXTJS',
        category: 'starter',
        tags: ['nextjs', 'typescript', 'app-router'],
        isOfficial: true,
        files: []
      }
    ];

    for (const template of defaultTemplates) {
      await this.prisma.template.create({
        data: template
      });
    }

    console.log('✅ Default templates seeded');
  }

  async getStats(): Promise<any> {
    try {
      const [userCount, projectCount, fileCount, templateCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.file.count(),
        this.prisma.template.count(),
      ]);

      return {
        users: userCount,
        projects: projectCount,
        files: fileCount,
        templates: templateCount,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up old sessions
      await this.prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      // Clean up inactive terminals older than 24 hours
      await this.prisma.terminal.deleteMany({
        where: {
          isActive: false,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Clean up old build logs (keep last 100 per project)
      const projects = await this.prisma.project.findMany({
        select: { id: true }
      });

      for (const project of projects) {
        const oldBuilds = await this.prisma.buildLog.findMany({
          where: { projectId: project.id },
          orderBy: { startedAt: 'desc' },
          skip: 100,
          select: { id: true }
        });

        if (oldBuilds.length > 0) {
          await this.prisma.buildLog.deleteMany({
            where: {
              id: {
                in: oldBuilds.map(b => b.id)
              }
            }
          });
        }
      }

      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('Database cleanup failed:', error);
      throw error;
    }
  }
}
