import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './common/guards/roles/roles.guard';
import { LoggerService } from './common/services/logger.service';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [UsersModule, CasesModule, DepartmentsModule],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [LoggerService],
})
export class AppModule {}
