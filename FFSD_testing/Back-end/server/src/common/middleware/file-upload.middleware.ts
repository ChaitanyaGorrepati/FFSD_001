import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import fileUpload from 'express-fileupload';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class FileUploadMiddleware implements NestMiddleware {
  private MAX_FILE_SIZE = 1 * 1024 * 1024; // 10MB
  private ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'image/gif',
  ];
  private ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.gif'];

  constructor(private loggerService: LoggerService) {
    // Ensure upload directories exist
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const complaintsDir = path.join(uploadDir, 'complaints');
    const profilesDir = path.join(uploadDir, 'profiles');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(complaintsDir)) {
      fs.mkdirSync(complaintsDir, { recursive: true });
    }
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply file upload middleware only for routes that need it
    const fileUploadMiddleware = fileUpload({
      limits: {
        fileSize: this.MAX_FILE_SIZE,
      },
      abortOnLimit: true,
      responseOnLimit: 'File size exceeds the maximum limit of 10MB.',
      useTempFiles: false, // Store in memory temporarily
    });

    fileUploadMiddleware(req, res, (err) => {
      if (err) {
        this.loggerService.error(
          'File upload error',
          err,
          'FileUploadMiddleware',
        );
        return res.status(400).json({
          statusCode: 400,
          message: err.message || 'File upload failed',
          error: 'BadRequestException',
        });
      }

      // Validate uploaded files
      if (req.files && Object.keys(req.files).length > 0) {
        try {
          this.validateAndProcessFiles(req);
        } catch (error) {
          this.loggerService.error(
            'File validation error',
            error,
            'FileUploadMiddleware',
          );
          return res.status(400).json({
            statusCode: 400,
            message: error.message,
            error: 'BadRequestException',
          });
        }
      }

      next();
    });
  }

  private validateAndProcessFiles(req: Request) {
    const files = req.files as any;
    const uploadedFiles = {};

    for (const fieldName in files) {
      const fileArray = Array.isArray(files[fieldName])
        ? files[fieldName]
        : [files[fieldName]];

      uploadedFiles[fieldName] = [];

      for (const file of fileArray) {
        // Validate file size
        if (file.size > this.MAX_FILE_SIZE) {
          throw new BadRequestException(
            `File ${file.name} exceeds maximum size of 10MB`,
          );
        }

        // Validate MIME type
        if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          throw new BadRequestException(
            `File type ${file.mimetype} is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
          );
        }

        // Validate file extension
        const fileExtension = path.extname(file.name).toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
          throw new BadRequestException(
            `File extension ${fileExtension} is not allowed. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
          );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const originalName = path.parse(file.name).name;
        const uniqueFilename = `${timestamp}_${randomStr}_${originalName}${fileExtension}`;

        // Determine upload directory
        const uploadDir = this.getUploadDirectory(fieldName);
        const filePath = path.join(uploadDir, uniqueFilename);

        // Save file
        file.mv(filePath, (err) => {
          if (err) {
            throw new BadRequestException(
              `Failed to save file: ${err.message}`,
            );
          }
        });

        // Store file info for controller access
        uploadedFiles[fieldName].push({
          filename: uniqueFilename,
          originalName: file.name,
          mimetype: file.mimetype,
          size: file.size,
          path: filePath,
          relativePath: `/uploads/${this.getUploadDirectoryName(fieldName)}/${uniqueFilename}`,
        });

        this.loggerService.log(
          `File uploaded: ${uniqueFilename}`,
          'FileUploadMiddleware',
          {
            fieldName,
            originalName: file.name,
            size: file.size,
            mimetype: file.mimetype,
          },
        );
      }
    }

    // Attach uploaded files to request for controller access
    (req as any).uploadedFiles = uploadedFiles;
  }

  private getUploadDirectory(fieldName: string): string {
    const uploadBaseDir = path.join(process.cwd(), 'uploads');

    if (fieldName === 'profileImage' || fieldName === 'avatar') {
      return path.join(uploadBaseDir, 'profiles');
    }

    // Default to complaints for all other fields (caseImage, image, photo, etc.)
    return path.join(uploadBaseDir, 'complaints');
  }

  private getUploadDirectoryName(fieldName: string): string {
    if (fieldName === 'profileImage' || fieldName === 'avatar') {
      return 'profiles';
    }
    return 'complaints';
  }
}
