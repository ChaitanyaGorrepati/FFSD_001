import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from './cases.service';
import { UsersService } from '../users/users.service';

describe('CasesService', () => {
  let service: CasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasesService, UsersService],
    }).compile();

    service = module.get<CasesService>(CasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
