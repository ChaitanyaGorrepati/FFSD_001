import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['citizen', 'officer', 'supervisor', 'superuser'])
  role: 'citizen' | 'officer' | 'supervisor' | 'superuser';

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