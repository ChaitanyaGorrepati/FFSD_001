import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['citizen', 'officer', 'supervisor', 'superuser'])
  role: 'citizen' | 'officer' | 'supervisor' | 'superuser';

  @IsOptional()
  @IsNumber()
  departmentId?: number;
}