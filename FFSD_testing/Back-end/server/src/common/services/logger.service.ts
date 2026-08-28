import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  private accessLogger: winston.Logger;

  constructor() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Define transport for combined logs (all levels)
    const combinedTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%YYYY-%MM-%DD.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: 30, // Keep 30 days of logs
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });

    // Define transport for error logs only
    const errorTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'errors-%YYYY-%MM-%DD.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: 30, // Keep 30 days of logs
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });

    // Define transport for access logs
    const accessTransport = new DailyRotateFile({
      filename: path.join(logsDir, 'access-%YYYY-%MM-%DD.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: 30, // Keep 30 days of logs
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
    });

    this.accessLogger = winston.createLogger({
      level: 'info',
      transports: [accessTransport],
    });

    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        combinedTransport,
        errorTransport,
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'exceptions.log'),
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json(),
          ),
        }),
      ],
    });

    // Add console output in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `[${timestamp}] [${level}] ${context ? `[${context}]` : ''} ${message} ${metaStr}`;
            }),
          ),
        }),
      );
    }
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, error?: any, context?: string, meta?: any) {
    const errorStack = error?.stack || '';
    this.logger.error(message, {
      context,
      error: error?.message || error,
      stack: errorStack,
      ...meta,
    });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    userRole?: string,
  ) {
    this.accessLogger.info(`${method} ${url}`, {
      statusCode,
      responseTime: `${responseTime}ms`,
      userId,
      userRole,
    });
  }

  logError(
    message: string,
    statusCode: number,
    error: any,
    userId?: string,
    requestId?: string,
  ) {
    this.logger.error(message, {
      statusCode,
      error: error?.message || error,
      stack: error?.stack,
      userId,
      requestId,
    });
  }
}
