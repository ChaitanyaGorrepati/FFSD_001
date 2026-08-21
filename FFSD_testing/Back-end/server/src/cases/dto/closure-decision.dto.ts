import { IsIn } from 'class-validator';

export class ClosureDecisionDto {
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';
}