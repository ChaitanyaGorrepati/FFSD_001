import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsString()
  department: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  zone: string;

  @IsIn(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @IsNumber()
  citizenId: number;
}