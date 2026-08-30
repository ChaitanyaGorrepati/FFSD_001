import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const PUBLIC_PATHS = [
  '/',
  '/users/register',
  '/api',
  '/api/',
  '/swagger',
  '/docs',
  '/health',
];

const VALID_TOKENS = new Set([
  'demo-auth-token',
  'civictrack-demo-token',
  'admin-demo-token',
]);

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.originalUrl || req.url || '/';
    const isPublicRoute = PUBLIC_PATHS.some(
      (publicPath) =>
        path === publicPath ||
        path.startsWith('/api') ||
        path.startsWith('/docs') ||
        path.startsWith('/swagger'),
    );

    if (isPublicRoute) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    const role =
      (req.headers['role'] as string | undefined) ||
      (req.headers['x-user-role'] as string | undefined) ||
      'citizen';

    const userId =
      (req.headers['userid'] as string | undefined) ||
      (req.headers['x-user-id'] as string | undefined) ||
      '1';

    if (!token || !VALID_TOKENS.has(token)) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized. Please send a valid Bearer token.',
        error: 'UnauthorizedException',
      });
    }

    (req as any).user = {
      id: Number(userId),
      role,
    };

    req.headers['x-user-id'] = String(userId);
    req.headers['x-user-role'] = role;
    req.headers['role'] = role;

    return next();
  }
}
