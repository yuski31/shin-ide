import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { WS_EVENTS, MessageType } from '@shared/constants';
import { WebSocketMessage } from '@shared/types';
import { Logger } from '../utils/logger.js';

const prisma = new PrismaClient();
const logger = new Logger('WebSocket');

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentProject?: string;
}

interface ConnectedUser {
  socketId: string;
  userId: string;
  username: string;
  projectId?: string;
  lastSeen: Date;
}

// Store connected users
const connectedUsers = new Map<string, ConnectedUser>();
const projectUsers = new Map<string, Set<string>>(); // projectId -> Set of userIds

export function setupWebSocketHandlers(io: SocketIOServer) {
  // Authentication middleware for WebSocket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string;
        username: string;
      };

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.username} connected with socket ${socket.id}`);

    // Add user to connected users
    if (socket.userId && socket.username) {
      connectedUsers.set(socket.id, {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        lastSeen: new Date(),
      });
    }

    // Handle joining a project
    socket.on(WS_EVENTS.JOIN_PROJECT, async (data: { projectId: string }) => {
      try {
        const { projectId } = data;

        // Verify user has access to the project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { ownerId: socket.userId },
              { 
                collaborators: {
                  some: { userId: socket.userId }
                }
              },
              { isPublic: true }
            ]
          },
        });

        if (!project) {
          socket.emit(WS_EVENTS.ERROR, {
            message: 'Project not found or access denied',
            code: 'PROJECT_ACCESS_DENIED',
          });
          return;
        }

        // Leave previous project if any
        if (socket.currentProject) {
          socket.leave(socket.currentProject);
          const prevProjectUsers = projectUsers.get(socket.currentProject);
          if (prevProjectUsers && socket.userId) {
            prevProjectUsers.delete(socket.userId);
            if (prevProjectUsers.size === 0) {
              projectUsers.delete(socket.currentProject);
            }
          }
        }

        // Join new project
        socket.join(projectId);
        socket.currentProject = projectId;

        // Update project users
        if (!projectUsers.has(projectId)) {
          projectUsers.set(projectId, new Set());
        }
        if (socket.userId) {
          projectUsers.get(projectId)?.add(socket.userId);
        }

        // Update connected user info
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          userInfo.projectId = projectId;
          connectedUsers.set(socket.id, userInfo);
        }

        // Notify other users in the project
        socket.to(projectId).emit(WS_EVENTS.USER_JOIN, {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date(),
        });

        // Send current project users to the joining user
        const currentUsers = Array.from(projectUsers.get(projectId) || [])
          .map(userId => {
            const userSocket = Array.from(connectedUsers.values())
              .find(u => u.userId === userId);
            return userSocket ? {
              userId: userSocket.userId,
              username: userSocket.username,
            } : null;
          })
          .filter(Boolean);

        socket.emit('project_users', currentUsers);

        logger.info(`User ${socket.username} joined project ${projectId}`);
      } catch (error) {
        logger.error('Error joining project:', error);
        socket.emit(WS_EVENTS.ERROR, {
          message: 'Failed to join project',
          code: 'JOIN_PROJECT_ERROR',
        });
      }
    });

    // Handle leaving a project
    socket.on(WS_EVENTS.LEAVE_PROJECT, () => {
      if (socket.currentProject && socket.userId) {
        socket.leave(socket.currentProject);
        
        // Remove from project users
        const projectUsersSet = projectUsers.get(socket.currentProject);
        if (projectUsersSet) {
          projectUsersSet.delete(socket.userId);
          if (projectUsersSet.size === 0) {
            projectUsers.delete(socket.currentProject);
          }
        }

        // Notify other users
        socket.to(socket.currentProject).emit(WS_EVENTS.USER_LEAVE, {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date(),
        });

        logger.info(`User ${socket.username} left project ${socket.currentProject}`);
        socket.currentProject = undefined;
      }
    });

    // Handle file changes
    socket.on('file_change', (data: {
      projectId: string;
      path: string;
      content: string;
      changes: any[];
    }) => {
      if (socket.currentProject === data.projectId) {
        socket.to(data.projectId).emit('remote_file_change', {
          ...data,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date(),
        });
      }
    });

    // Handle cursor movements
    socket.on('cursor_move', (data: {
      projectId: string;
      path: string;
      position: { line: number; column: number };
    }) => {
      if (socket.currentProject === data.projectId) {
        socket.to(data.projectId).emit('remote_cursor_move', {
          ...data,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date(),
        });
      }
    });

    // Handle text changes
    socket.on('text_change', (data: {
      projectId: string;
      path: string;
      changes: any[];
      content: string;
    }) => {
      if (socket.currentProject === data.projectId) {
        socket.to(data.projectId).emit('remote_text_change', {
          ...data,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date(),
        });
      }
    });

    // Handle terminal input
    socket.on('terminal_input', (data: {
      terminalId: string;
      input: string;
    }) => {
      // Forward to terminal service
      socket.to(`terminal_${data.terminalId}`).emit('terminal_data', {
        data: data.input,
        timestamp: new Date(),
      });
    });

    // Handle terminal resize
    socket.on('terminal_resize', (data: {
      terminalId: string;
      cols: number;
      rows: number;
    }) => {
      socket.to(`terminal_${data.terminalId}`).emit('terminal_resize', data);
    });

    // Handle heartbeat
    socket.on(WS_EVENTS.HEARTBEAT, () => {
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.lastSeen = new Date();
        connectedUsers.set(socket.id, userInfo);
      }
      socket.emit(WS_EVENTS.HEARTBEAT, { timestamp: new Date() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User ${socket.username} disconnected: ${reason}`);

      // Remove from connected users
      connectedUsers.delete(socket.id);

      // Remove from project users
      if (socket.currentProject && socket.userId) {
        const projectUsersSet = projectUsers.get(socket.currentProject);
        if (projectUsersSet) {
          projectUsersSet.delete(socket.userId);
          if (projectUsersSet.size === 0) {
            projectUsers.delete(socket.currentProject);
          }
        }

        // Notify other users in the project
        socket.to(socket.currentProject).emit(WS_EVENTS.USER_LEAVE, {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date(),
        });
      }
    });
  });

  // Cleanup inactive connections
  setInterval(() => {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, user] of connectedUsers.entries()) {
      if (now.getTime() - user.lastSeen.getTime() > timeout) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        connectedUsers.delete(socketId);
      }
    }
  }, 60000); // Check every minute

  logger.info('WebSocket handlers initialized');
}
