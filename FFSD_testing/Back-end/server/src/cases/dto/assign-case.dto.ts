import { IsNumber } from 'class-validator';

export class AssignCaseDto {
  @IsNumber()
  officerId: number;
}