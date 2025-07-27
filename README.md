# SHIN IDE

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/RoshanEi/bolt.new)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/RoshanEi/bolt.new)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green)](https://nodejs.org/)

> A modern, AI-powered web-based Integrated Development Environment for collaborative software development

SHIN IDE is a cutting-edge, browser-based development environment that combines the power of AI assistance with real-time collaboration features. Built with modern web technologies, it provides developers with a comprehensive coding experience without the need for local installations.

## ✨ Key Features

### 🤖 AI-Powered Development
- **Multi-Provider AI Support**: Integration with 9+ AI providers including OpenAI GPT-4, Claude, Gemini, Bedrock, Cohere, DeepSeek, Mistral, Ollama, and OpenRouter
- **Intelligent Code Completion**: Context-aware AI suggestions and auto-completion
- **Code Generation**: Generate complete applications from natural language descriptions
- **Code Explanation & Documentation**: AI-powered code analysis and documentation generation
- **Debugging Assistance**: Smart error detection and fix suggestions
- **Performance Optimization**: Automated code optimization recommendations
- **Security Analysis**: Comprehensive vulnerability scanning and security recommendations
- **Test Generation**: Automated unit, integration, and E2E test creation

### 🤝 Real-Time Collaboration
- **Live Editing**: Multiple developers can edit files simultaneously
- **Cursor Tracking**: See other users' cursor positions and selections in real-time
- **Conflict Resolution**: Automatic merge conflict resolution
- **User Presence**: Online/offline indicators and activity tracking
- **Shared Terminal**: Collaborative terminal sessions with synchronized output
- **Project Sharing**: Fine-grained permission control for team collaboration

### 💻 Advanced Code Editor
- **Monaco Editor**: Full-featured code editor with IntelliSense
- **Multi-Language Support**: Syntax highlighting for 50+ programming languages
- **Code Folding & Minimap**: Advanced navigation and code organization
- **Find & Replace**: Global search with regex support across project files
- **Custom Themes**: Dark/light themes with customizable preferences
- **Keyboard Shortcuts**: Extensive keyboard shortcuts for productivity

### 🌐 WebContainer Integration
- **Browser-Based Execution**: Run Node.js applications directly in the browser
- **Package Management**: Support for npm, yarn, and pnpm
- **Development Server**: Integrated dev server with live preview
- **Build System**: Automated build processes with artifact generation
- **Terminal Access**: Full-featured terminal with command execution
- **File System**: Complete file operations within isolated containers

### 📁 Project Management
- **Template System**: Pre-configured project templates for React, Vue, Next.js, and more
- **File Explorer**: Hierarchical file management with drag-and-drop support
- **Version Control**: Git integration preparation for future releases
- **Project Archives**: Export and import projects as ZIP files
- **Search & Navigation**: Advanced search across files and project structure

## �️ Technology Stack

### Frontend
- **React 18** - Modern UI framework with hooks and concurrent features
- **TypeScript 5.0+** - Type-safe development with latest language features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Monaco Editor** - VS Code's editor for web applications
- **XTerm.js** - Terminal emulation for web browsers
- **Zustand** - Lightweight state management
- **Socket.io Client** - Real-time WebSocket communication

### Backend
- **Node.js 18+** - JavaScript runtime for server-side development
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server-side development
- **PostgreSQL** - Robust relational database
- **Prisma ORM** - Type-safe database toolkit
- **Redis** - In-memory caching and session storage
- **Socket.io** - Real-time bidirectional communication
- **Winston** - Professional logging library

### AI Integration
- **OpenAI API** - GPT-4 and GPT-3.5 models
- **Anthropic Claude** - Advanced reasoning and code analysis
- **Google Gemini** - Multi-modal AI capabilities
- **Amazon Bedrock** - Enterprise AI services
- **Multiple Providers** - Cohere, DeepSeek, Mistral, Ollama, OpenRouter

### Infrastructure
- **Docker** - Containerization for deployment
- **WebContainer API** - Browser-based code execution
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - API protection and abuse prevention

## � Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18.0 or higher)
- **PostgreSQL** (version 14.0 or higher)
- **Redis** (version 6.0 or higher) - Optional but recommended
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RoshanEi/bolt.new.git
   cd bolt.new/ums
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies
   npm install

   # Or install for each package separately
   cd frontend && npm install
   cd ../backend && npm install
   cd ../shared && npm install
   ```

3. **Environment Configuration**

   Create environment files:
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   ```

   Configure your environment variables in `backend/.env`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/shinide"

   # Authentication
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"

   # AI Providers (Optional - configure as needed)
   OPENAI_API_KEY="sk-..."
   CLAUDE_API_KEY="sk-ant-..."
   GEMINI_API_KEY="AI..."

   # Redis (Optional)
   REDIS_URL="redis://localhost:6379"

   # Application
   NODE_ENV="development"
   PORT=3000
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Database Setup**
   ```bash
   cd backend

   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Optional: Seed with sample data
   npx prisma db seed
   ```

5. **Start Development Servers**
   ```bash
   # Start all services (from root directory)
   npm run dev

   # Or start individually
   npm run dev:frontend  # Frontend: http://localhost:5173
   npm run dev:backend   # Backend: http://localhost:3000
   ```

6. **Access the Application**

   Open your browser and navigate to `http://localhost:5173`

## � Usage Guide

### Getting Started

1. **Create an Account**: Register with your email and create a secure password
2. **Create a Project**: Choose from templates or start with a blank project
3. **Invite Collaborators**: Share your project with team members
4. **Start Coding**: Use the Monaco editor with AI assistance
5. **Run Your Code**: Use WebContainer to execute and preview your application

### AI Assistant Usage

The AI assistant can help you with various development tasks:

```typescript
// Example: Generate a React component
// Type in the AI chat: "Generate a React component for a user profile card"

// Example: Explain complex code
// Select code and press Ctrl+Shift+E to get AI explanation

// Example: Debug errors
// Paste error message in AI chat for debugging assistance
```

### Collaboration Features

- **Real-time Editing**: Multiple users can edit the same file simultaneously
- **Live Cursors**: See where your teammates are working
- **Shared Terminal**: Run commands that all team members can see
- **Project Permissions**: Control who can view, edit, or manage your projects

### WebContainer Development

```bash
# Install dependencies
npm install express

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📚 API Documentation

SHIN IDE provides comprehensive REST APIs for integration:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### AI Services
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/generate-code` - Generate code
- `POST /api/ai/explain-code` - Explain code
- `POST /api/ai/debug-code` - Debug assistance
- `POST /api/ai/generate-application` - Generate full applications

### WebContainer
- `POST /api/webcontainer/initialize` - Initialize container
- `POST /api/webcontainer/start-dev-server` - Start development server
- `POST /api/webcontainer/build` - Build project

For detailed API documentation, see [API Reference](./docs/api.md).

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow our coding standards
4. **Add tests**: Ensure your changes are well-tested
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes and their benefits

### Coding Standards

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Functional components with hooks
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Document complex logic and public APIs
- **Testing**: Write unit tests for new features
- **Linting**: Follow ESLint and Prettier configurations

### Reporting Issues

- Use the [GitHub Issues](https://github.com/RoshanEi/bolt.new/issues) page
- Provide detailed reproduction steps
- Include environment information
- Add relevant logs and screenshots

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](./docs/user-guide.md)
- [Developer Guide](./docs/developer-guide.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

### Community
- [GitHub Discussions](https://github.com/RoshanEi/bolt.new/discussions)
- [Discord Server](https://discord.gg/shinide)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/shin-ide)

### Contact
- **Email**: support@shinide.dev
- **Website**: [https://shinide.dev](https://shinide.dev)
- **Twitter**: [@ShinIDE](https://twitter.com/ShinIDE)

---

<div align="center">
  <p>Built with ❤️ by the SHIN IDE team</p>
  <p>
    <a href="https://shinide.dev">Website</a> •
    <a href="./docs">Documentation</a> •
    <a href="https://github.com/RoshanEi/bolt.new/issues">Issues</a> •
    <a href="https://github.com/RoshanEi/bolt.new/discussions">Discussions</a>
  </p>
</div>
