import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../services/logger.service';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorName = 'InternalServerException';
    let validationErrors: any = null;

    // Extract user info for logging
    const userId = request.headers['x-user-id'] || 'anonymous';
    const requestId = (request as any).requestId || 'unknown';
    const method = request.method;
    const path = request.path;

    // Handle HttpException
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorName = responseObj.error || 'HttpException';
        validationErrors = responseObj.message; // In case it's validation errors
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // Handle generic Error
      message = exception.message;
      errorName = exception.constructor.name;

      // Log the full error with stack trace
      this.loggerService.error(
        `Unhandled ${errorName}: ${message}`,
        exception,
        'GlobalExceptionFilter',
        {
          userId,
          requestId,
          method,
          path,
        },
      );
    } else {
      // Handle unknown error type
      message = String(exception);
      errorName = 'UnknownException';

      this.loggerService.error(
        `Unknown error type: ${message}`,
        exception,
        'GlobalExceptionFilter',
        {
          userId,
          requestId,
          method,
          path,
        },
      );
    }

    // Log the error
    if (!(exception instanceof HttpException)) {
      this.loggerService.logError(
        message,
        statusCode,
        exception,
        userId as string,
        requestId,
      );
    } else {
      this.loggerService.logError(
        message,
        statusCode,
        {
          error: errorName,
          validation: validationErrors,
        },
        userId as string,
        requestId,
      );
    }

    // Prepare error response
    const errorResponse = {
      statusCode,
      message:
        Array.isArray(message) && typeof message[0] === 'string'
          ? message[0]
          : message,
      error: errorName,
      timestamp: new Date().toISOString(),
      requestId,
      ...(Array.isArray(message) && { validationErrors: message }), // Include validation errors if present
      ...(process.env.NODE_ENV !== 'production' && {
        stack:
          exception instanceof Error ? exception.stack : undefined,
      }), // Include stack trace only in development
    };

    // Send error response
    response.status(statusCode).json(errorResponse);
  }
}
