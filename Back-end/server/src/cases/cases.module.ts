import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { UsersModule } from '../users/users.module'; // ✅ ADD

@Module({
  imports: [UsersModule], // ✅ IMPORTANT
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}