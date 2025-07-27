// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

// Project and File System Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  framework: ProjectFramework;
  template: string;
  ownerId: string;
  collaborators: ProjectCollaborator[];
  isPublic: boolean;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectFramework {
  REACT = 'react',
  VUE = 'vue',
  NEXTJS = 'nextjs',
  VANILLA = 'vanilla',
}

export interface ProjectCollaborator {
  userId: string;
  role: CollaboratorRole;
  permissions: Permission[];
  addedAt: Date;
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin',
}

export interface ProjectSettings {
  autoSave: boolean;
  autoFormat: boolean;
  linting: boolean;
  typeChecking: boolean;
  hotReload: boolean;
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
}

// File System Types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileType;
  size?: number;
  content?: string;
  language?: string;
  isDirectory: boolean;
  children?: FileNode[];
  parentId?: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory',
}

export interface FileOperation {
  type: FileOperationType;
  path: string;
  newPath?: string;
  content?: string;
  timestamp: Date;
}

export enum FileOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RENAME = 'rename',
  MOVE = 'move',
}

// WebSocket and Real-time Types
export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: Date;
  userId?: string;
  projectId?: string;
}

export enum MessageType {
  // File operations
  FILE_CREATED = 'file_created',
  FILE_UPDATED = 'file_updated',
  FILE_DELETED = 'file_deleted',
  FILE_RENAMED = 'file_renamed',
  
  // Editor operations
  CURSOR_POSITION = 'cursor_position',
  TEXT_CHANGE = 'text_change',
  SELECTION_CHANGE = 'selection_change',
  
  // Terminal operations
  TERMINAL_DATA = 'terminal_data',
  TERMINAL_RESIZE = 'terminal_resize',
  TERMINAL_COMMAND = 'terminal_command',
  
  // Collaboration
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_TYPING = 'user_typing',
  
  // System
  ERROR = 'error',
  SUCCESS = 'success',
  HEARTBEAT = 'heartbeat',
}

// Terminal Types
export interface Terminal {
  id: string;
  projectId: string;
  userId: string;
  pid: number;
  cwd: string;
  shell: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TerminalCommand {
  id: string;
  terminalId: string;
  command: string;
  output: string;
  exitCode?: number;
  duration: number;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  PROJECT_LIMIT_EXCEEDED = 'PROJECT_LIMIT_EXCEEDED',
}

// Monaco Editor Types
export interface EditorState {
  content: string;
  language: string;
  cursorPosition: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  scrollPosition: { top: number; left: number };
}

export interface EditorChange {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
  rangeLength: number;
}

// Template Types
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  framework: ProjectFramework;
  tags: string[];
  thumbnail?: string;
  files: TemplateFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  isOfficial: boolean;
  downloadCount: number;
  rating: number;
  createdAt: Date;
}

export interface TemplateFile {
  path: string;
  content: string;
  language: string;
}

// Build and Deployment Types
export interface BuildConfig {
  framework: ProjectFramework;
  buildCommand: string;
  outputDir: string;
  installCommand: string;
  devCommand: string;
  env: Record<string, string>;
}

export interface BuildResult {
  success: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  duration: number;
  timestamp: Date;
}
