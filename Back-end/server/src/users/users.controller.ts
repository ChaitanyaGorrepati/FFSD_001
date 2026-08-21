import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiHeader({
  name: 'role',
  description: 'user role (citizen, officer, supervisor, superuser)',
  required: true,
})
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET ALL USERS ─────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers() {
    return this.usersService.findAll();
  }

  // ── GET USER BY ID ────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  // ── CREATE USER (SUPERUSER ONLY) ──────────────
  @Post()
  @Roles('superuser')
  @ApiOperation({ summary: 'Create user (superuser only)' })
  @ApiBody({ type: CreateUserDto })
  createUser(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  // ── UPDATE USER ───────────────────────────────
  @Patch(':id')
  @Roles('superuser')
  @ApiOperation({ summary: 'Update user (superuser only)' })
  @ApiBody({ type: UpdateUserDto })
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(Number(id), data);
  }

  // ── DELETE USER ───────────────────────────────
  @Delete(':id')
  @Roles('superuser')
  @ApiOperation({ summary: 'Delete user (superuser only)' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }

  // ── REGISTER CITIZEN ──────────────────────────
  @Post('register')
  @ApiOperation({ summary: 'Register as citizen' })
  @ApiBody({
    schema: {
      example: {
        name: 'Rahul',
        phone: '9876543210',
        password: '123456'
      },
    },
  })
  createCitizen(@Body() data: any) {
    return this.usersService.create({
      name: data.name,
      phone: data.phone,
      password: data.password,
      role: 'citizen'
    });
  }
}