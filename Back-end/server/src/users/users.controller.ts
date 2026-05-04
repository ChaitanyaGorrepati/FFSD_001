import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
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

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id') id: string) {
    return this.usersService.findOne(Number(id)); // ✅ FIXED
  }

  @Post()
  @Roles('superuser') // ✅ RBAC FIX
  @ApiBody({ type: CreateUserDto })
  createUser(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @Patch(':id')
  @Roles('superuser') // ✅ RBAC FIX
  @ApiBody({ type: UpdateUserDto })
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(Number(id), data); // ✅ FIXED
  }

  @Delete(':id')
  @Roles('superuser') // ✅ RBAC FIX
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(Number(id)); // ✅ FIXED
  }

  @Post('register')
@ApiOperation({ summary: 'Register as citizen' })
createCitizen(@Body() data: CreateUserDto) {
  return this.usersService.create({
    ...data,
    role: 'citizen'
  });
}
}