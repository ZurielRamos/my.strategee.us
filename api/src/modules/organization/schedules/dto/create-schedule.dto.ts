import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScheduleDayDto } from './schedule-day.dto';
import { ScheduleCreatedExamples } from '../utils/schedules.examples';

export class CreateScheduleDto {
    @ApiProperty({ description: 'Nombre del horario', example: 'Administrativo' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Descripción del horario',
        required: false,
        example: 'Horario para personal administrativo',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Configuración de horarios por día de la semana',
        type: [ScheduleDayDto],
        example: [
            ...ScheduleCreatedExamples.example1.value.dailySchedules
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleDayDto)
    @ArrayMinSize(1)
    @ArrayMaxSize(7)
    dailySchedules: ScheduleDayDto[];
}
