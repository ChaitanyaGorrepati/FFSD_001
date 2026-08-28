import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { UsersModule } from '../users/users.module'; // ✅ ADD
import { LoggerService } from '../common/services/logger.service';
import { FileUploadMiddleware } from '../common/middleware/file-upload.middleware';

@Module({
  imports: [UsersModule], // ✅ IMPORTANT
  controllers: [CasesController],
  providers: [CasesService, LoggerService],
})
export class CasesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FileUploadMiddleware)
      .forRoutes({ path: 'cases', method: RequestMethod.POST });
  }
}