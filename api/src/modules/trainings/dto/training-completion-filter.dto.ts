import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AssignmentStatus } from '../enums/assignment-status.enum';

export class TrainingCompletionFilterDto {
  @ApiProperty({ enum: AssignmentStatus, required: false })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;
}
