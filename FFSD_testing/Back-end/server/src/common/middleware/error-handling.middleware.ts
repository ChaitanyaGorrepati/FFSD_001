import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  constructor(private loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Store original send method
    const originalSend = res.send.bind(res);
    const loggerService = this.loggerService;

    // Override send to catch errors
    res.send = function (data: any) {
      // Check if response indicates an error
      const statusCode = res.statusCode;
      const userId = req.headers['x-user-id'] || 'anonymous';
      const requestId = (req as any).requestId || 'unknown';

      if (statusCode >= 400) {
        try {
          const errorData = typeof data === 'string' ? JSON.parse(data) : data;
          loggerService.logError(
            errorData.message || 'HTTP Error',
            statusCode,
            errorData,
            userId as string,
            requestId,
          );
        } catch (e) {
          loggerService.logError(
            'Unknown error occurred',
            statusCode,
            { raw: data },
            userId as string,
            requestId,
          );
        }
      }

      return originalSend(data);
    };

    try {
      next();
    } catch (error) {
      const userId = req.headers['x-user-id'] || 'anonymous';
      const requestId = (req as any).requestId || 'unknown';
      const statusCode =
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

      // Log the error
      this.loggerService.logError(
        error.message || 'Internal Server Error',
        statusCode,
        error,
        userId as string,
        requestId,
      );

      // Format error response
      const errorResponse = {
        statusCode,
        message: error.message || 'Internal Server Error',
        error:
          error instanceof HttpException
            ? error.name
            : 'InternalServerException',
        timestamp: new Date().toISOString(),
        requestId,
      };

      // Return error response
      res.status(statusCode).json(errorResponse);
    }
  }
}
