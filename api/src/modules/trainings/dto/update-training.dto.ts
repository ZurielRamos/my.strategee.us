import { PartialType } from '@nestjs/swagger';
import { CreateTrainingDto } from './create-training.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TrainingStatus } from '../enums/training-status.enum';

export class UpdateTrainingDto extends PartialType(CreateTrainingDto) {
  @ApiProperty({ enum: TrainingStatus, required: false })
  @IsEnum(TrainingStatus)
  @IsOptional()
  status?: TrainingStatus;
}
