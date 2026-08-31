import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { LoggerService } from '../services/logger.service';

interface RateLimitRequest extends Request {
  rateLimit?: {
    limit?: number;
    current?: number;
    remaining?: number;
    resetTime?: number;
  };
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private helmetMiddleware: any;
  private rateLimiter: any;

  constructor(private loggerService: LoggerService) {
    // Initialize Helmet for security headers
    this.helmetMiddleware = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    });

    // Initialize Rate Limiter
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5000, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req: RateLimitRequest, res: Response) => {
        const clientIp = this.getClientIp(req);
        this.loggerService.warn(
          'Rate limit exceeded',
          'SecurityMiddleware',
          {
            clientIp,
            path: req.path,
            method: req.method,
          },
        );

        res.status(429).json({
          statusCode: 429,
          message: 'Too many requests, please try again later.',
          error: 'TooManyRequestsException',
          retryAfter: req.rateLimit?.resetTime,
        });
      },
      skip: (req: RateLimitRequest) => {
        // Skip rate limiting for health check endpoints
        return req.path === '/health' || req.path === '/api';
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Add security headers via Helmet
    this.helmetMiddleware(req, res, () => {
      // Apply rate limiting
      this.rateLimiter(req, res, () => {
        // Sanitize input
        this.sanitizeInput(req);

        // Add security headers
        this.addSecurityHeaders(res);

        // Add request ID
        (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        next();
      });
    });
  }

  private sanitizeInput(req: Request) {
    // Sanitize query parameters
    if (req.query) {
      for (const key in req.query) {
        req.query[key] = this.sanitizeString(req.query[key] as string);
      }
    }

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(String(obj));
    }

    const sanitized = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = this.sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    // Remove HTML tags
    let sanitized = str.replace(/<[^>]*>/g, '');

    // Escape special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  private addSecurityHeaders(res: Response) {
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove powered-by header
    res.removeHeader('X-Powered-By');
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.socket?.remoteAddress as string) ||
      req.ip ||
      'unknown'
    );
  }
}
