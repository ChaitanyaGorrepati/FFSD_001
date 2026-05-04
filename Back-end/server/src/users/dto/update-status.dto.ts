import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['open', 'in-progress', 'closed'])
  status: 'open' | 'in-progress' | 'closed';
}