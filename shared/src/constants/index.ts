// API Constants
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Users
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    AVATAR: '/api/users/avatar',
    SETTINGS: '/api/users/settings',
  },
  
  // Projects
  PROJECTS: {
    BASE: '/api/projects',
    CREATE: '/api/projects',
    BY_ID: (id: string) => `/api/projects/${id}`,
    FILES: (id: string) => `/api/projects/${id}/files`,
    COLLABORATORS: (id: string) => `/api/projects/${id}/collaborators`,
    SETTINGS: (id: string) => `/api/projects/${id}/settings`,
    EXPORT: (id: string) => `/api/projects/${id}/export`,
    IMPORT: '/api/projects/import',
  },
  
  // Files
  FILES: {
    BASE: '/api/files',
    CONTENT: (path: string) => `/api/files/content?path=${encodeURIComponent(path)}`,
    UPLOAD: '/api/files/upload',
    DOWNLOAD: (path: string) => `/api/files/download?path=${encodeURIComponent(path)}`,
    TREE: (projectId: string) => `/api/files/tree/${projectId}`,
  },
  
  // Templates
  TEMPLATES: {
    BASE: '/api/templates',
    BY_FRAMEWORK: (framework: string) => `/api/templates?framework=${framework}`,
    BY_ID: (id: string) => `/api/templates/${id}`,
    OFFICIAL: '/api/templates/official',
  },
  
  // Terminal
  TERMINAL: {
    BASE: '/api/terminal',
    CREATE: '/api/terminal/create',
    EXECUTE: '/api/terminal/execute',
    HISTORY: (terminalId: string) => `/api/terminal/${terminalId}/history`,
  },
  
  // Build
  BUILD: {
    BASE: '/api/build',
    START: (projectId: string) => `/api/build/${projectId}/start`,
    STATUS: (projectId: string) => `/api/build/${projectId}/status`,
    LOGS: (projectId: string) => `/api/build/${projectId}/logs`,
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_PROJECT: 'join_project',
  LEAVE_PROJECT: 'leave_project',
  
  // File operations
  FILE_CHANGE: 'file_change',
  FILE_SAVE: 'file_save',
  FILE_CREATE: 'file_create',
  FILE_DELETE: 'file_delete',
  FILE_RENAME: 'file_rename',
  
  // Editor
  CURSOR_MOVE: 'cursor_move',
  TEXT_CHANGE: 'text_change',
  SELECTION_CHANGE: 'selection_change',
  
  // Terminal
  TERMINAL_INPUT: 'terminal_input',
  TERMINAL_OUTPUT: 'terminal_output',
  TERMINAL_RESIZE: 'terminal_resize',
  
  // Collaboration
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  USER_CURSOR: 'user_cursor',
  USER_TYPING: 'user_typing',
  
  // System
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
} as const;

// File Extensions and Languages
export const FILE_EXTENSIONS = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  
  // Styles
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.styl': 'stylus',
  
  // Markup
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.svg': 'xml',
  
  // Data
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  
  // Config
  '.env': 'dotenv',
  '.gitignore': 'gitignore',
  '.dockerignore': 'dockerignore',
  
  // Documentation
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.txt': 'plaintext',
  
  // Other
  '.vue': 'vue',
  '.py': 'python',
  '.php': 'php',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
} as const;

// Project Templates
export const PROJECT_TEMPLATES = {
  REACT: {
    BASIC: 'react-basic',
    TYPESCRIPT: 'react-typescript',
    VITE: 'react-vite',
    NEXTJS: 'react-nextjs',
    TAILWIND: 'react-tailwind',
  },
  VUE: {
    BASIC: 'vue-basic',
    TYPESCRIPT: 'vue-typescript',
    VITE: 'vue-vite',
    NUXT: 'vue-nuxt',
    COMPOSITION: 'vue-composition',
  },
  NEXTJS: {
    BASIC: 'nextjs-basic',
    TYPESCRIPT: 'nextjs-typescript',
    APP_ROUTER: 'nextjs-app-router',
    PAGES_ROUTER: 'nextjs-pages-router',
    TAILWIND: 'nextjs-tailwind',
  },
  VANILLA: {
    HTML: 'vanilla-html',
    JAVASCRIPT: 'vanilla-javascript',
    TYPESCRIPT: 'vanilla-typescript',
    VITE: 'vanilla-vite',
  },
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  EDITOR: {
    THEME: 'vs-dark',
    FONT_SIZE: 14,
    TAB_SIZE: 2,
    WORD_WRAP: true,
    MINIMAP: true,
    LINE_NUMBERS: true,
    AUTO_SAVE: true,
    AUTO_FORMAT: true,
    BRACKET_MATCHING: true,
    FOLDING: true,
  },
  TERMINAL: {
    SHELL: '/bin/bash',
    FONT_SIZE: 14,
    CURSOR_BLINK: true,
    THEME: 'dark',
  },
  PROJECT: {
    AUTO_SAVE: true,
    AUTO_FORMAT: true,
    LINTING: true,
    TYPE_CHECKING: true,
    HOT_RELOAD: true,
  },
} as const;

// Limits and Constraints
export const LIMITS = {
  FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_NAME_LENGTH: 255,
  },
  PROJECT: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_FILES: 1000,
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
  },
  USER: {
    MAX_PROJECTS: 50,
    MAX_USERNAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 8,
  },
  TERMINAL: {
    MAX_HISTORY: 1000,
    TIMEOUT: 5 * 60 * 1000, // 5 minutes
  },
  COLLABORATION: {
    MAX_COLLABORATORS: 10,
    MAX_CONCURRENT_USERS: 50,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Authentication token has expired',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    ACCOUNT_DISABLED: 'Your account has been disabled',
  },
  PROJECT: {
    NOT_FOUND: 'Project not found',
    ACCESS_DENIED: 'You do not have access to this project',
    SIZE_LIMIT_EXCEEDED: 'Project size limit exceeded',
    NAME_TAKEN: 'Project name is already taken',
  },
  FILE: {
    NOT_FOUND: 'File not found',
    SIZE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_NAME: 'Invalid file name',
    PERMISSION_DENIED: 'Permission denied',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
    INVALID_FORMAT: 'Invalid format',
  },
  SYSTEM: {
    INTERNAL_ERROR: 'An internal error occurred',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Successfully logged in',
    LOGOUT_SUCCESS: 'Successfully logged out',
    REGISTER_SUCCESS: 'Account created successfully',
    PASSWORD_RESET: 'Password reset successfully',
  },
  PROJECT: {
    CREATED: 'Project created successfully',
    UPDATED: 'Project updated successfully',
    DELETED: 'Project deleted successfully',
    EXPORTED: 'Project exported successfully',
  },
  FILE: {
    SAVED: 'File saved successfully',
    CREATED: 'File created successfully',
    DELETED: 'File deleted successfully',
    UPLOADED: 'File uploaded successfully',
  },
} as const;
