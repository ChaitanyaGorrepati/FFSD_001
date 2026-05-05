import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';

@ApiTags('departments')
@ApiHeader({
  name: 'role',
  required: true,
})
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }
}