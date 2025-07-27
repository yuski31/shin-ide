import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
    }),
  ],
});

// Logger class for better organization
export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`;
  }

  error(message: string, error?: Error | any): void {
    if (error) {
      logger.error(this.formatMessage(message), { error: error.stack || error });
    } else {
      logger.error(this.formatMessage(message));
    }
  }

  warn(message: string, meta?: any): void {
    logger.warn(this.formatMessage(message), meta);
  }

  info(message: string, meta?: any): void {
    logger.info(this.formatMessage(message), meta);
  }

  http(message: string, meta?: any): void {
    logger.http(this.formatMessage(message), meta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(this.formatMessage(message), meta);
  }

  // Specific methods for common use cases
  apiRequest(method: string, url: string, statusCode: number, responseTime: number): void {
    this.http(`${method} ${url} ${statusCode} - ${responseTime}ms`);
  }

  databaseQuery(query: string, duration: number): void {
    this.debug(`Database query executed in ${duration}ms: ${query}`);
  }

  userAction(userId: string, action: string, details?: any): void {
    this.info(`User ${userId} performed action: ${action}`, details);
  }

  securityEvent(event: string, details: any): void {
    this.warn(`Security event: ${event}`, details);
  }

  performanceMetric(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance metric - ${metric}: ${value}${unit}`);
  }

  // Method to create child logger with additional context
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`);
  }
}

// Export default logger instance
export default logger;

// Export logger class for creating contextual loggers
export { Logger as LoggerClass };

// Utility function to create a logger with context
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

// Stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Error logging middleware
export const logError = (error: Error, context?: string) => {
  const loggerInstance = context ? new Logger(context) : new Logger('Error');
  loggerInstance.error(error.message, error);
};

// Request logging utility
export const logRequest = (req: any, res: any, responseTime: number) => {
  const loggerInstance = new Logger('HTTP');
  loggerInstance.apiRequest(
    req.method,
    req.originalUrl,
    res.statusCode,
    responseTime
  );
};

// Database logging utility
export const logDatabaseQuery = (query: string, duration: number) => {
  const loggerInstance = new Logger('Database');
  loggerInstance.databaseQuery(query, duration);
};

// WebSocket logging utility
export const logWebSocketEvent = (event: string, socketId: string, data?: any) => {
  const loggerInstance = new Logger('WebSocket');
  loggerInstance.info(`Socket ${socketId} - ${event}`, data);
};
