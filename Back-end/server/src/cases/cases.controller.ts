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
  description: 'user id for filtering (citizen/officer/supervisor)',
})
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  // ── CREATE ────────────────────────────────────
  @Post()
  @Roles('citizen')
  @ApiOperation({ summary: 'Citizen creates a case' })
  @ApiBody({ type: CreateCaseDto })
  createCase(@Body() data: CreateCaseDto) {
    return this.casesService.create(data);
  }

  // ── GET ALL (ROLE BASED) ──────────────────────
  @Get()
  @ApiOperation({ summary: 'Get cases (role-based)' })
  getAllCases(
    @Headers('role') role: string,
    @Headers('userid') userId: string,
  ) {
    return this.casesService.findAll(role, Number(userId));
  }

  // ── GET ONE ───────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  getCase(@Param('id') id: string) {
    return this.casesService.findOne(Number(id));
  }

  // ── STATUS UPDATE ─────────────────────────────
  @Patch(':id/status')
  @Roles('officer')
  @ApiOperation({ summary: 'Officer updates case status' })
  @ApiBody({ type: UpdateStatusDto })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.casesService.updateStatus(Number(id), body.status);
  }

  // ── ASSIGN CASE ───────────────────────────────
  @Patch(':id/assign')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Supervisor assigns case' })
  @ApiBody({ type: AssignCaseDto })
  assignCase(@Param('id') id: string, @Body() body: AssignCaseDto) {
    return this.casesService.assignCase(Number(id), body.officerId);
  }

  // ── REQUEST CLOSURE ───────────────────────────
  @Patch(':id/request-closure')
  @Roles('officer')
  @ApiOperation({ summary: 'Officer requests closure' })
  requestClosure(@Param('id') id: string) {
    return this.casesService.requestClosure(Number(id));
  }

  // ── CLOSURE DECISION ──────────────────────────
  @Patch(':id/closure-decision')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Supervisor handles closure request' })
  @ApiBody({ type: ClosureDecisionDto })
  handleClosure(
    @Param('id') id: string,
    @Body() body: ClosureDecisionDto,
  ) {
    return this.casesService.handleClosureDecision(
      Number(id),
      body.decision
    );
  }

  // ── REQUEST TRANSFER ──────────────────────────
  @Patch(':id/request-transfer')
  @Roles('officer')
  @ApiOperation({ summary: 'Officer requests transfer' })
  @ApiBody({
    schema: {
      example: { toDepartment: 'sanitation' },
    },
  })
  requestTransfer(
    @Param('id') id: string,
    @Body() body: { toDepartment: string }
  ) {
    return this.casesService.requestTransfer(Number(id), body.toDepartment);
  }

  // ── TRANSFER DECISION ─────────────────────────
  @Patch(':id/transfer-decision')
  @Roles('supervisor')
  @ApiOperation({ summary: 'Supervisor approves/rejects transfer' })
  @ApiBody({
    schema: {
      example: { decision: 'approved' },
    },
  })
  transferDecision(
    @Param('id') id: string,
    @Headers('userid') userId: string,
    @Body() body: { decision: string }
  ) {
    return this.casesService.transferDecision(
      Number(id),
      body.decision,
      Number(userId)
    );
  }
}