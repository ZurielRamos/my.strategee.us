import { IsEnum, IsBoolean, IsString, IsOptional, IsNotEmpty, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../enums/day-of-week.enum';

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export class ScheduleDayDto {
    @ApiProperty({
        description: 'Día de la semana',
        enum: DayOfWeek,
        example: DayOfWeek.MONDAY,
    })
    @IsEnum(DayOfWeek)
    day: DayOfWeek;

    @ApiProperty({
        description: 'Indica si el día es laborado',
        example: true,
    })
    @IsBoolean()
    isWorkDay: boolean;

    @ApiProperty({
        description: 'Hora de entrada (requerido si es día laborado)',
        required: false,
        example: '08:00:00',
    })
    @ValidateIf((o) => o.isWorkDay === true)
    @IsNotEmpty({ message: 'Hora de entrada es requerida para días laborados' })
    @IsString()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    entryTime?: string;

    @ApiProperty({
        description: 'Hora de salida (requerido si es día laborado)',
        required: false,
        example: '17:00:00',
    })
    @ValidateIf((o) => o.isWorkDay === true)
    @IsNotEmpty({ message: 'Hora de salida es requerida para días laborados' })
    @IsString()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    exitTime?: string;

    @ApiProperty({
        description: 'Hora de inicio de pausa activa mañana',
        required: false,
        example: '10:00:00',
    })
    @IsString()
    @IsOptional()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    morningBreakStart?: string;

    @ApiProperty({
        description: 'Hora de fin de pausa activa mañana',
        required: false,
        example: '10:15:00',
    })
    @IsString()
    @IsOptional()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    morningBreakEnd?: string;

    @ApiProperty({
        description: 'Hora de inicio de almuerzo',
        required: false,
        example: '12:00:00',
    })
    @IsString()
    @IsOptional()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    lunchStart?: string;

    @ApiProperty({
        description: 'Hora de fin de almuerzo',
        required: false,
        example: '13:00:00',
    })
    @IsString()
    @IsOptional()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    lunchEnd?: string;

    @ApiProperty({
        description: 'Hora de inicio de pausa activa tarde',
        required: false,
        example: '15:00:00',
    })
    @IsString()
    @IsOptional()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    afternoonBreakStart?: string;

    @ApiProperty({
        description: 'Hora de fin de pausa activa tarde',
        required: false,
        example: '15:15:00',
    })
    @IsString()
    @IsOptional()
    @Matches(TIME_REGEX, { message: 'El formato debe ser HH:mm:ss' })
    afternoonBreakEnd?: string;
}
