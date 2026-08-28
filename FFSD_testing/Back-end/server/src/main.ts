import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import {
  LoggingMiddleware,
  ErrorHandlingMiddleware,
  SecurityMiddleware,
} from './common/middleware';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize Logger Service
  const loggerService = app.get(LoggerService);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role'],
  });

  // Register Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter(loggerService));

  // Register Global Middleware (in order)
  // 1. Security middleware (helmet, rate limiting)
  app.use(new SecurityMiddleware(loggerService).use.bind(new SecurityMiddleware(loggerService)));

  // 2. Logging middleware
  app.use(new LoggingMiddleware(loggerService).use.bind(new LoggingMiddleware(loggerService)));

  // 3. Error handling middleware
  app.use(new ErrorHandlingMiddleware(loggerService).use.bind(new ErrorHandlingMiddleware(loggerService)));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('CivicTrack - Case Management API')
    .setDescription('Comprehensive case management API for citizen complaints')
    .setVersion('1.0.0')
    .addTag('Users', 'User management endpoints')
    .addTag('Cases', 'Case management endpoints')
    .addTag('Departments', 'Department management endpoints')
    .addTag('Notifications', 'Notification management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Export Swagger JSON to docs/swagger.json
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(docsDir, 'swagger.json'),
    JSON.stringify(document, null, 2),
  );

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const complaintsDir = path.join(uploadsDir, 'complaints');
  if (!fs.existsSync(complaintsDir)) {
    fs.mkdirSync(complaintsDir, { recursive: true });
  }
  const profilesDir = path.join(uploadsDir, 'profiles');
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  loggerService.log(
    `CivicTrack API Server is running on http://localhost:${port}`,
    'NestApplication',
    {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  );
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
