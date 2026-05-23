import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  MaxLength,
} from 'class-validator';
import { AssignmentMode } from '../enums/assignment-mode.enum';

export class CreateTrainingDto {
  @ApiProperty({ example: 'Capacitación de Seguridad 2025' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, example: '2025-06-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiProperty({ required: false, example: '2025-07-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiProperty({
    enum: AssignmentMode,
    default: AssignmentMode.ALL,
    description: 'all = todos, all_with_exclusions = todos con exclusiones, selected = solo seleccionados',
  })
  @IsEnum(AssignmentMode)
  @IsOptional()
  assignmentMode?: AssignmentMode;

  @ApiProperty({
    required: false,
    description: 'IDs de empleados a excluir (para all_with_exclusions) o a incluir (para selected)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  employeeIds?: string[];
}
