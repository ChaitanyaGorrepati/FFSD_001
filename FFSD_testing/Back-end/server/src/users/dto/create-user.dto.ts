import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['officer', 'supervisor'])
  role: 'officer' | 'supervisor';

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  // 🔥 ADD THESE
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;
}