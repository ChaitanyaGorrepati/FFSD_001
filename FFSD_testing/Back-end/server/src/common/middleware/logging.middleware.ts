import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private morganMiddleware: any;

  constructor(private loggerService: LoggerService) {
    // Create custom morgan format for structured logging
    morgan.token('user-id', (req: any) => {
      return req.headers['x-user-id'] || 'anonymous';
    });

    morgan.token('user-role', (req: any) => {
      return req.headers['x-user-role'] || 'unknown';
    });

    // Create morgan middleware with custom format
    this.morganMiddleware = morgan((tokens, req, res) => {
      const method = tokens.method(req, res) || 'UNKNOWN';
      const url = tokens.url(req, res) || '';
      const status = tokens.status(req, res) || '200';
      const responseTime = tokens['response-time'](req, res) || '0';
      const userId = tokens['user-id'](req, res) || 'anonymous';
      const userRole = tokens['user-role'](req, res) || 'unknown';

      // Log via LoggerService
      this.loggerService.logRequest(
        method,
        url,
        parseInt(status, 10),
        parseFloat(responseTime),
        userId,
        userRole,
      );

      // Also return morgan's default format for console
      return `${method} ${url} ${status} ${responseTime}ms - ${userId} (${userRole})`;
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Add request timestamp
    (req as any).startTime = Date.now();

    // Use morgan middleware
    this.morganMiddleware(req, res, next);
  }
}
