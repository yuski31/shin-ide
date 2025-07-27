import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { spawn, ChildProcess } from 'child_process';
import { WEBSOCKET_EVENTS } from '@shared/constants';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface TerminalSession {
  process: ChildProcess;
  projectId: string;
  userId: string;
  cwd: string;
}

// Store active terminal sessions
const terminalSessions = new Map<string, TerminalSession>();

// Store active project rooms and users
const projectRooms = new Map<string, Set<string>>();

export const setupWebSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected`);

    // Join project room
    socket.on('join_project', async (data: { projectId: string }) => {
      try {
        const { projectId } = data;

        // Verify user has access to project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { ownerId: socket.userId },
              {
                collaborators: {
                  some: { userId: socket.userId }
                }
              }
            ]
          }
        });

        if (!project) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        socket.join(`project:${projectId}`);
        
        // Track users in project room
        if (!projectRooms.has(projectId)) {
          projectRooms.set(projectId, new Set());
        }
        projectRooms.get(projectId)!.add(socket.userId!);

        // Notify other users in the project
        socket.to(`project:${projectId}`).emit(WEBSOCKET_EVENTS.USER_JOINED, {
          user: socket.user,
          projectId,
        });

        socket.emit('joined_project', { projectId });
      } catch (error) {
        console.error('Join project error:', error);
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    // Leave project room
    socket.on('leave_project', (data: { projectId: string }) => {
      const { projectId } = data;
      socket.leave(`project:${projectId}`);
      
      // Remove user from project room tracking
      if (projectRooms.has(projectId)) {
        projectRooms.get(projectId)!.delete(socket.userId!);
        if (projectRooms.get(projectId)!.size === 0) {
          projectRooms.delete(projectId);
        }
      }

      // Notify other users
      socket.to(`project:${projectId}`).emit(WEBSOCKET_EVENTS.USER_LEFT, {
        user: socket.user,
        projectId,
      });
    });

    // File operations
    socket.on('file_change', (data: {
      projectId: string;
      fileId: string;
      content: string;
      cursor?: { line: number; column: number };
    }) => {
      // Broadcast file changes to other users in the project
      socket.to(`project:${data.projectId}`).emit(WEBSOCKET_EVENTS.FILE_UPDATED, {
        fileId: data.fileId,
        content: data.content,
        userId: socket.userId,
        user: socket.user,
        cursor: data.cursor,
      });
    });

    socket.on('cursor_position', (data: {
      projectId: string;
      fileId: string;
      position: { line: number; column: number };
    }) => {
      socket.to(`project:${data.projectId}`).emit(WEBSOCKET_EVENTS.CURSOR_POSITION, {
        fileId: data.fileId,
        position: data.position,
        userId: socket.userId,
        user: socket.user,
      });
    });

    socket.on('selection_change', (data: {
      projectId: string;
      fileId: string;
      selection: { start: { line: number; column: number }; end: { line: number; column: number } };
    }) => {
      socket.to(`project:${data.projectId}`).emit(WEBSOCKET_EVENTS.SELECTION_CHANGE, {
        fileId: data.fileId,
        selection: data.selection,
        userId: socket.userId,
        user: socket.user,
      });
    });

    // Terminal operations
    socket.on('terminal_create', async (data: {
      projectId: string;
      terminalId: string;
      cols: number;
      rows: number;
    }) => {
      try {
        const { projectId, terminalId, cols, rows } = data;

        // Verify project access
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { ownerId: socket.userId },
              {
                collaborators: {
                  some: { userId: socket.userId }
                }
              }
            ]
          }
        });

        if (!project) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        // Create terminal process
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        const terminalProcess = spawn(shell, [], {
          cwd: process.cwd(), // TODO: Set to project directory
          env: { ...process.env, TERM: 'xterm-256color' },
        });

        // Store terminal session
        terminalSessions.set(terminalId, {
          process: terminalProcess,
          projectId,
          userId: socket.userId!,
          cwd: process.cwd(),
        });

        // Handle terminal output
        terminalProcess.stdout?.on('data', (data) => {
          socket.emit('terminal_output', {
            terminalId,
            output: data.toString(),
          });
        });

        terminalProcess.stderr?.on('data', (data) => {
          socket.emit('terminal_output', {
            terminalId,
            output: data.toString(),
          });
        });

        terminalProcess.on('exit', (code) => {
          socket.emit('terminal_exit', {
            terminalId,
            exitCode: code,
          });
          terminalSessions.delete(terminalId);
        });

        // Save terminal to database
        await prisma.terminal.create({
          data: {
            id: terminalId,
            projectId,
            userId: socket.userId!,
            pid: terminalProcess.pid || null,
            shell,
          }
        });

        socket.emit('terminal_created', { terminalId });
      } catch (error) {
        console.error('Terminal create error:', error);
        socket.emit('error', { message: 'Failed to create terminal' });
      }
    });

    socket.on('terminal_input', (data: {
      projectId: string;
      terminalId: string;
      data: string;
    }) => {
      const session = terminalSessions.get(data.terminalId);
      if (session && session.userId === socket.userId) {
        session.process.stdin?.write(data.data);
      }
    });

    socket.on('terminal_resize', (data: {
      projectId: string;
      terminalId: string;
      cols: number;
      rows: number;
    }) => {
      const session = terminalSessions.get(data.terminalId);
      if (session && session.userId === socket.userId) {
        // Resize terminal if supported
        if (session.process.stdout && 'resize' in session.process.stdout) {
          (session.process.stdout as any).resize(data.cols, data.rows);
        }
      }
    });

    socket.on('terminal_close', async (data: {
      projectId: string;
      terminalId: string;
    }) => {
      const session = terminalSessions.get(data.terminalId);
      if (session && session.userId === socket.userId) {
        session.process.kill();
        terminalSessions.delete(data.terminalId);

        // Update database
        await prisma.terminal.update({
          where: { id: data.terminalId },
          data: { isActive: false }
        });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data: {
      projectId: string;
      fileId: string;
    }) => {
      socket.to(`project:${data.projectId}`).emit(WEBSOCKET_EVENTS.USER_TYPING, {
        fileId: data.fileId,
        userId: socket.userId,
        user: socket.user,
        isTyping: true,
      });
    });

    socket.on('typing_stop', (data: {
      projectId: string;
      fileId: string;
    }) => {
      socket.to(`project:${data.projectId}`).emit(WEBSOCKET_EVENTS.USER_TYPING, {
        fileId: data.fileId,
        userId: socket.userId,
        user: socket.user,
        isTyping: false,
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.username} disconnected`);

      // Clean up terminal sessions
      for (const [terminalId, session] of terminalSessions.entries()) {
        if (session.userId === socket.userId) {
          session.process.kill();
          terminalSessions.delete(terminalId);

          // Update database
          await prisma.terminal.updateMany({
            where: {
              userId: socket.userId,
              isActive: true,
            },
            data: { isActive: false }
          });
        }
      }

      // Remove from project rooms and notify
      for (const [projectId, users] of projectRooms.entries()) {
        if (users.has(socket.userId!)) {
          users.delete(socket.userId!);
          socket.to(`project:${projectId}`).emit(WEBSOCKET_EVENTS.USER_LEFT, {
            user: socket.user,
            projectId,
          });
        }
      }
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      socket.emit(WEBSOCKET_EVENTS.HEARTBEAT, { timestamp: Date.now() });
    });
  });
};
