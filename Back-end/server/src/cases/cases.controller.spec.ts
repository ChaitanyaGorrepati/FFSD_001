import { Controller, Post, Get, Patch, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('cases')
@ApiHeader({
  name: 'role',
  required: true,
  description: 'citizen | officer | supervisor | superuser',
})
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @Roles('citizen')
  @ApiOperation({ summary: 'Create case' })
  createCase(@Body() data: any) {
    return this.casesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases' })
  getAllCases() {
    return this.casesService.findAll();
  }

  @Get(':id')
  getCase(@Param('id') id: string) {
    return this.casesService.findOne(Number(id));
  }

  @Patch(':id/status')
  @Roles('officer')
  updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.casesService.updateStatus(Number(id), body.status);
  }

  @Patch(':id/assign')
  @Roles('supervisor')
  assignCase(@Param('id') id: string, @Body() body: any) {
    return this.casesService.assignCase(Number(id), body.officerId);
  }
}