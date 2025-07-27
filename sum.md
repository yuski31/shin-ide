# SHIN IDE - Comprehensive Technical Summary

## 📋 Project Overview

SHIN IDE is a modern, full-stack web-based Integrated Development Environment designed for collaborative software development. Built with cutting-edge technologies, it provides developers with a powerful, browser-based coding experience featuring real-time collaboration, AI-powered assistance, and comprehensive development tools.

### Key Highlights
- **Web-based**: No installation required, accessible from any modern browser
- **Real-time Collaboration**: Multiple developers can work simultaneously on the same project
- **AI-Powered**: Integrated AI assistance for code generation, debugging, and optimization
- **Multi-language Support**: Comprehensive syntax highlighting and IntelliSense for popular programming languages
- **Terminal Integration**: Full-featured terminal with WebSocket-based communication
- **Project Management**: Complete project lifecycle management with templates and collaboration tools

## 🏗️ Architecture Summary

SHIN IDE follows a modern microservices-oriented architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  AI Services    │
│                 │    │                 │    │                 │
│ React + TS      │◄──►│ Node.js + Express│◄──►│ OpenAI/Claude   │
│ Monaco Editor   │    │ PostgreSQL      │    │ Gemini/Local    │
│ WebSocket       │    │ WebSocket       │    │                 │
│ Zustand         │    │ Prisma ORM      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Frontend Layer**
   - React 18 with TypeScript for type safety
   - Monaco Editor for advanced code editing
   - XTerm.js for terminal emulation
   - Zustand for state management
   - Tailwind CSS for styling

2. **Backend Layer**
   - Node.js with Express.js framework
   - PostgreSQL database with Prisma ORM
   - Socket.io for real-time WebSocket communication
   - JWT-based authentication
   - Comprehensive API with validation

3. **AI Service Layer**
   - Multi-provider architecture (OpenAI, Claude, Gemini)
   - Local AI fallback for offline capabilities
   - Intelligent code assistance and generation
   - Context-aware suggestions

4. **Data Layer**
   - PostgreSQL for persistent data storage
   - Redis for caching and session management
   - File system for project storage

## 🛠️ Technology Stack

### Frontend Technologies
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Core** | React | ^18.2.0 | UI framework |
| **Language** | TypeScript | ^5.0.0 | Type safety |
| **Build Tool** | Vite | ^4.4.0 | Fast development and building |
| **Styling** | Tailwind CSS | ^3.3.0 | Utility-first CSS framework |
| **Editor** | Monaco Editor | ^0.41.0 | Code editing capabilities |
| **Terminal** | XTerm.js | ^5.3.0 | Terminal emulation |
| **State** | Zustand | ^4.4.0 | State management |
| **Routing** | React Router | ^6.15.0 | Client-side routing |
| **WebSocket** | Socket.io Client | ^4.7.0 | Real-time communication |
| **HTTP** | Axios | ^1.5.0 | API requests |

### Backend Technologies
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | >=18.0.0 | JavaScript runtime |
| **Framework** | Express.js | ^4.18.0 | Web application framework |
| **Language** | TypeScript | ^5.0.0 | Type safety |
| **Database** | PostgreSQL | ^14.0.0 | Primary database |
| **ORM** | Prisma | ^5.2.0 | Database toolkit |
| **Cache** | Redis | ^5.3.0 | Caching and sessions |
| **WebSocket** | Socket.io | ^4.7.0 | Real-time communication |
| **Auth** | JWT | ^9.0.0 | Authentication tokens |
| **Validation** | Zod | ^3.22.0 | Schema validation |
| **Logging** | Winston | ^3.10.0 | Application logging |

### AI Integration
| Provider | SDK | Purpose |
|----------|-----|---------|
| **OpenAI** | openai ^4.0.0 | GPT-4 for advanced code generation |
| **Claude** | @anthropic-ai/sdk ^0.6.0 | Detailed code analysis |
| **Gemini** | @google/generative-ai ^0.1.0 | Multi-modal AI capabilities |
| **Local AI** | Custom implementation | Offline fallback |

## 📁 Directory Structure

```
ums/
├── 📁 frontend/                    # React TypeScript Frontend
│   ├── 📄 package.json            # Dependencies and scripts
│   ├── 📄 vite.config.ts          # Vite configuration
│   ├── 📄 tailwind.config.js      # Tailwind CSS config
│   ├── 📁 public/                 # Static assets
│   └── 📁 src/                    # Source code
│       ├── 📄 main.tsx            # Application entry point
│       ├── 📄 App.tsx             # Root component
│       ├── 📁 components/         # Reusable UI components
│       │   ├── 📁 ui/             # Basic UI components
│       │   ├── 📁 auth/           # Authentication components
│       │   ├── 📁 editor/         # Monaco Editor components
│       │   ├── 📁 file-explorer/  # File management
│       │   ├── 📁 terminal/       # Terminal components
│       │   ├── 📁 ai/             # AI assistant components
│       │   └── 📁 ide/            # IDE-specific components
│       ├── 📁 pages/              # Route components
│       ├── 📁 hooks/              # Custom React hooks
│       ├── 📁 store/              # Zustand state management
│       ├── 📁 services/           # API service layer
│       ├── 📁 utils/              # Utility functions
│       └── 📁 types/              # TypeScript definitions
│
├── 📁 backend/                     # Node.js Express Backend
│   ├── 📄 package.json            # Dependencies and scripts
│   ├── 📄 tsconfig.json           # TypeScript configuration
│   ├── 📁 prisma/                 # Database schema
│   │   ├── 📄 schema.prisma       # Prisma schema definition
│   │   └── 📁 migrations/         # Database migrations
│   └── 📁 src/                    # Source code
│       ├── 📄 index.ts            # Server entry point
│       ├── 📁 routes/             # API route handlers
│       │   ├── 📄 auth.ts         # Authentication endpoints
│       │   ├── 📄 projects.ts     # Project management
│       │   ├── 📄 files.ts        # File operations
│       │   ├── 📄 ai.ts           # AI service endpoints
│       │   └── 📄 terminal.ts     # Terminal management
│       ├── 📁 middleware/         # Express middleware
│       ├── 📁 services/           # Business logic
│       │   └── 📁 ai/             # AI service architecture
│       │       ├── 📄 AIServiceManager.ts # AI coordinator
│       │       ├── 📄 types.ts    # AI type definitions
│       │       └── 📁 providers/  # AI provider implementations
│       ├── 📁 websocket/          # WebSocket handlers
│       └── 📁 utils/              # Utility functions
│
└── 📁 shared/                      # Shared TypeScript Types
    └── 📁 src/
        ├── 📁 types/              # Common type definitions
        └── 📁 constants/          # Shared constants
```

## ✨ Key Features

### 🎯 Core Development Features
- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting, IntelliSense, and code completion
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, and more
- **File Management**: Hierarchical file explorer with create, rename, delete, and move operations
- **Project Templates**: Pre-configured project templates for React, Vue, Next.js, and vanilla JavaScript
- **Search & Replace**: Global search across project files with regex support

### 🤝 Collaboration Features
- **Real-time Editing**: Multiple users can edit files simultaneously
- **Live Cursors**: See other users' cursor positions and selections in real-time
- **User Presence**: Online/offline indicators and active file tracking
- **Conflict Resolution**: Automatic merge conflict resolution for simultaneous edits
- **Shared Terminal**: Collaborative terminal sessions with synchronized output

### 🤖 AI-Powered Features
- **Code Generation**: Generate code from natural language descriptions
- **Code Explanation**: Get detailed explanations of complex code
- **Debugging Assistance**: AI-powered error analysis and fix suggestions
- **Code Optimization**: Performance and readability improvement suggestions
- **Test Generation**: Automatic unit test creation
- **Documentation**: Auto-generate comprehensive code documentation
- **Security Analysis**: Vulnerability detection and security recommendations

### 🖥️ Terminal & Build Features
- **Integrated Terminal**: Full-featured terminal with multiple session support
- **WebSocket Communication**: Real-time terminal input/output streaming
- **Command History**: Persistent command history across sessions
- **Build Integration**: Support for npm, yarn, and other build tools
- **Process Management**: Start, stop, and monitor development servers

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: User roles and project-level permissions
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation with Zod
- **CORS Protection**: Configured CORS policies for secure cross-origin requests

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
users (
  id: TEXT PRIMARY KEY,
  email: TEXT UNIQUE NOT NULL,
  username: TEXT UNIQUE NOT NULL,
  first_name: TEXT NOT NULL,
  last_name: TEXT NOT NULL,
  password: TEXT NOT NULL,
  role: TEXT DEFAULT 'user',
  is_email_verified: BOOLEAN DEFAULT false,
  avatar: TEXT,
  bio: TEXT,
  preferences: JSONB DEFAULT '{}',
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
)
```

#### Projects
```sql
projects (
  id: TEXT PRIMARY KEY,
  name: TEXT NOT NULL,
  description: TEXT,
  framework: TEXT NOT NULL,
  is_public: BOOLEAN DEFAULT false,
  settings: JSONB DEFAULT '{}',
  owner_id: TEXT REFERENCES users(id),
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
)
```

#### Files
```sql
files (
  id: TEXT PRIMARY KEY,
  name: TEXT NOT NULL,
  path: TEXT NOT NULL,
  content: TEXT,
  is_directory: BOOLEAN DEFAULT false,
  size: INTEGER DEFAULT 0,
  mime_type: TEXT,
  project_id: TEXT REFERENCES projects(id),
  parent_id: TEXT REFERENCES files(id),
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
)
```

### Relationships
- **Collaborators**: Many-to-many relationship between users and projects
- **AI Conversations**: User conversations with AI assistant
- **AI Messages**: Individual messages within conversations
- **Refresh Tokens**: JWT refresh token management
- **Templates**: Project template definitions

## 🌐 API Endpoints

### Authentication Routes
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/refresh      # Token refresh
POST   /api/auth/logout       # User logout
GET    /api/auth/me           # Get current user
```

### Project Management
```
GET    /api/projects          # List user projects
POST   /api/projects          # Create new project
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
```

### File Operations
```
GET    /api/files/project/:projectId    # Get project files
GET    /api/files/:id                   # Get file details
POST   /api/files                       # Create file/directory
PUT    /api/files/:id/content           # Update file content
PUT    /api/files/:id/rename            # Rename file
DELETE /api/files/:id                   # Delete file
```

### AI Services
```
GET    /api/ai/providers               # List available AI providers
POST   /api/ai/chat                    # Chat with AI assistant
POST   /api/ai/generate-code           # Generate code
POST   /api/ai/explain-code            # Explain code
POST   /api/ai/debug-code              # Debug assistance
POST   /api/ai/optimize-code           # Code optimization
POST   /api/ai/generate-tests          # Generate tests
POST   /api/ai/generate-docs           # Generate documentation
```

### WebSocket Events
```
join_project        # Join project room
leave_project       # Leave project room
file_change         # File content changes
cursor_position     # Cursor position updates
terminal_create     # Create terminal session
terminal_input      # Terminal input
terminal_output     # Terminal output
user_joined         # User joined project
user_left           # User left project
```

## 🤖 AI Integration Architecture

### Multi-Provider System
SHIN IDE implements a flexible AI service architecture supporting multiple providers:

#### Provider Capabilities
| Provider | Code Gen | Explanation | Debugging | Optimization | Chat |
|----------|----------|-------------|-----------|--------------|------|
| **OpenAI** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Claude** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gemini** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Local AI** | ❌ | ✅ | ✅ | ❌ | ✅ |

#### AI Service Manager
```typescript
class AIServiceManager {
  // Provider management
  getAvailableProviders(): Provider[]
  setDefaultProvider(providerId: string): void
  
  // Core AI capabilities
  generateCode(prompt: string, language: string): Promise<string>
  explainCode(code: string, language: string): Promise<string>
  debugCode(code: string, error: string): Promise<string>
  optimizeCode(code: string, language: string): Promise<string>
  generateTests(code: string, framework: string): Promise<string>
  chatCompletion(messages: Message[]): Promise<string>
}
```

#### Provider Configuration
```typescript
// Environment variables for AI providers
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...

// Automatic fallback hierarchy
1. OpenAI (if configured)
2. Claude (if configured)
3. Gemini (if configured)
4. Local AI (always available)
```

## 🔐 Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Access tokens (15 min) + Refresh tokens (7 days)
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Role-based Access**: Admin, User, Guest roles
- **Project Permissions**: Owner, Editor, Viewer levels

### Security Middleware
```typescript
// Rate limiting
- General API: 1000 requests/15 minutes
- Auth endpoints: 10 attempts/15 minutes
- File uploads: 50 requests/minute
- Terminal commands: 100 requests/minute

// Input validation
- Zod schema validation for all endpoints
- SQL injection prevention via Prisma
- XSS protection with input sanitization

// CORS configuration
- Restricted origins
- Credential support
- Specific allowed methods and headers
```

### Data Protection
- **Encryption**: Sensitive data encryption at rest
- **HTTPS**: TLS encryption for data in transit
- **Session Management**: Secure session handling with Redis
- **Content Security Policy**: XSS protection headers

## 🚀 Development Setup

### Prerequisites
```bash
# Required software
Node.js >= 18.0.0
PostgreSQL >= 14.0.0
Redis >= 6.0.0 (optional)
Git
```

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/your-org/shin-ide.git
cd shin-ide
```

2. **Install Dependencies**
```bash
# Install all dependencies
npm install

# Or install individually
cd frontend && npm install
cd ../backend && npm install
cd ../shared && npm install
```

3. **Environment Configuration**
```bash
# Backend environment (.env)
cp backend/.env.example backend/.env

# Configure database
DATABASE_URL="postgresql://user:password@localhost:5432/shinide"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Optional: AI provider keys
OPENAI_API_KEY="sk-..."
CLAUDE_API_KEY="sk-ant-..."
GEMINI_API_KEY="AI..."

# Optional: Redis
REDIS_URL="redis://localhost:6379"
```

4. **Database Setup**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # Optional: seed with sample data
```

5. **Start Development Servers**
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
```

### Development Scripts
```json
{
  "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
  "build": "npm run build:frontend && npm run build:backend",
  "test": "npm run test:frontend && npm run test:backend",
  "lint": "npm run lint:frontend && npm run lint:backend",
  "type-check": "npm run type-check:frontend && npm run type-check:backend"
}
```

## 🚀 Deployment Information

### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/shinide

# Security
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# AI Services (optional)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...

# Cache (optional)
REDIS_URL=redis://redis-host:6379
```

### Docker Deployment
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=shinide
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Build Process
```bash
# Frontend build
cd frontend
npm run build
# Outputs to frontend/dist/

# Backend build
cd backend
npm run build
# Outputs to backend/dist/

# Database migrations
npx prisma migrate deploy
```

### Performance Considerations
- **CDN**: Serve static assets via CDN
- **Load Balancing**: Multiple backend instances
- **Database**: Connection pooling and read replicas
- **Caching**: Redis for session and data caching
- **Monitoring**: Application performance monitoring

### Security Checklist
- [ ] HTTPS/SSL certificates configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Content Security Policy headers
- [ ] Regular security updates
- [ ] Backup strategy implemented

---

## 📞 Support & Contributing

### Getting Help
- **Documentation**: Refer to this comprehensive guide
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Workflow
1. **Planning**: Create GitHub issues for new features
2. **Development**: Follow coding standards and conventions
3. **Testing**: Write comprehensive tests
4. **Review**: Code review process
5. **Deployment**: Automated CI/CD pipeline

---

## 🚀 Recent Enhancements (bolt.diy Integration)

### Enhanced AI Service Architecture
- **Multi-Provider Support**: Added support for 8 AI providers:
  - OpenAI GPT-4 (existing)
  - Anthropic Claude (existing)
  - Google Gemini (existing)
  - Amazon Bedrock (new)
  - Cohere (new)
  - DeepSeek (new)
  - Mistral (new)
  - Ollama (new)
  - OpenRouter (new)
  - Local AI fallback (existing)

### New AI Capabilities
- **Full Application Generation**: Generate complete applications from prompts
- **Codebase Refactoring**: AI-powered code restructuring and optimization
- **Performance Analysis**: Automated performance optimization suggestions
- **Security Review**: Comprehensive security vulnerability analysis
- **Test Suite Generation**: Automated test creation for multiple frameworks
- **Enhanced Code Completion**: Context-aware AI code suggestions
- **Real-time Collaboration**: Live cursor tracking and simultaneous editing

### WebContainer Integration
- **Browser-based Execution**: Run Node.js applications directly in the browser
- **Package Management**: Support for npm, yarn, and pnpm
- **Development Server**: Integrated dev server with live preview
- **Build System**: Automated build processes with artifact generation
- **Terminal Commands**: Execute shell commands in isolated containers
- **File Operations**: Read/write files within the container environment

### Enhanced Frontend Components
- **EnhancedMonacoEditor**: AI-powered code editor with intelligent suggestions
- **EnhancedAIChat**: Advanced AI assistant with multi-provider support
- **WebContainer Integration**: Browser-based development environment
- **Real-time Collaboration**: Live editing with conflict resolution

### New API Endpoints
```
# Enhanced AI Services
POST   /api/ai/generate-application    # Generate full applications
POST   /api/ai/refactor-codebase      # Refactor existing code
POST   /api/ai/optimize-performance   # Performance optimization
POST   /api/ai/security-review        # Security analysis
POST   /api/ai/create-test-suite      # Test generation

# WebContainer Services
POST   /api/webcontainer/initialize           # Initialize container
POST   /api/webcontainer/install-dependencies # Install packages
POST   /api/webcontainer/start-dev-server     # Start development server
POST   /api/webcontainer/build                # Build project
POST   /api/webcontainer/execute-command      # Execute terminal commands
POST   /api/webcontainer/write-file           # Write files
POST   /api/webcontainer/read-file            # Read files
GET    /api/webcontainer/preview/:projectId/:port # Get preview URL
GET    /api/webcontainer/processes/:projectId     # List processes
DELETE /api/webcontainer/processes/:projectId/:processId # Stop process
DELETE /api/webcontainer/cleanup/:projectId       # Cleanup container
```

### Enhanced File Operations
- **Advanced Search**: Regex-based search across project files
- **Project Archives**: Create and extract project ZIP files
- **Auto Documentation**: Generate project documentation
- **File Versioning**: Track file changes and history
- **Bulk Operations**: Handle multiple file operations efficiently

### Updated Dependencies
```json
{
  "backend": {
    "ai-providers": [
      "openai@^4.28.0",
      "@anthropic-ai/sdk@^0.17.1",
      "@google/generative-ai@^0.2.1",
      "@ai-sdk/openai@^0.0.9",
      "@ai-sdk/anthropic@^0.0.9",
      "@ai-sdk/google@^0.0.9",
      "@ai-sdk/amazon-bedrock@^0.0.3",
      "@ai-sdk/cohere@^0.0.3",
      "@ai-sdk/mistral@^0.0.9"
    ],
    "webcontainer": "@webcontainer/api@^1.1.9",
    "enhanced-validation": "zod@^3.22.4"
  },
  "frontend": {
    "ai-integration": "ai@^3.0.12",
    "webcontainer": "@webcontainer/api@^1.1.9",
    "enhanced-editor": "@codemirror/*@^6.x",
    "ui-components": "@radix-ui/*@^1.0.x",
    "state-management": "nanostores@^0.9.5"
  }
}
```

---

**SHIN IDE** - Now with bolt.diy integration for enhanced AI-powered development, WebContainer support, and advanced collaboration features.

*Last updated: January 2025*
