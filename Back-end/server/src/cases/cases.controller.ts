import { Controller, Post, Get, Patch, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignCaseDto } from './dto/assign-case.dto';
import { ClosureDecisionDto } from './dto/closure-decision.dto';
@ApiTags('cases')
@ApiHeader({
  name: 'role',
  required: true,
  description: 'citizen | officer | supervisor | superuser',
})
@ApiHeader({
  name: 'userid',
  required: false,
  description: 'user id for filtering (citizen/officer)',
})
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @Roles('citizen')
  @ApiOperation({ summary: 'Citizen creates a case' })
  @ApiBody({ type: CreateCaseDto })
  createCase(@Body() data: CreateCaseDto) {
    return this.casesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get cases (role-based)' })
  getAllCases(
    @Headers('role') role: string,
    @Headers('userid') userId: string,
  ) {
    return this.casesService.findAll(role, Number(userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  getCase(@Param('id') id: string) {
    return this.casesService.findOne(Number(id));
  }

  @Patch(':id/status')
  @Roles('officer')
  @ApiOperation({ summary: 'Officer updates case status' })
  @ApiBody({ type: UpdateStatusDto })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.casesService.updateStatus(Number(id), body.status);
  }

  @Patch(':id/assign')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Supervisor assigns case' })
  @ApiBody({ type: AssignCaseDto })
  assignCase(@Param('id') id: string, @Body() body: AssignCaseDto) {
    return this.casesService.assignCase(Number(id), body.officerId);
  }

@Patch(':id/request-closure')
@Roles('officer')
@ApiOperation({ summary: 'Officer requests closure' })
requestClosure(@Param('id') id: string) {
  return this.casesService.requestClosure(Number(id));
}

@Patch(':id/closure-decision')
@Roles('supervisor')
@ApiOperation({ summary: 'Supervisor handles closure request' })
handleClosure(
  @Param('id') id: string,
  @Body() body: ClosureDecisionDto,
) {
  return this.casesService.handleClosureDecision(
    Number(id),
    body.decision
  );
}

}