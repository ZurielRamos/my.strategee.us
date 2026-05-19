import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, Min, Max } from 'class-validator';

export class EnergyzeDayAccumulationDetailsDto {
    @ApiProperty({ description: 'Fecha del evento que genera la acumulación (YYYY-MM-DD)' })
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Cantidad de días a acumular (solo 1 día permitido)', example: 1 })
    @IsNumber()
    @Min(1)
    @Max(1)
    days: number;

    @ApiProperty({ description: 'Razón de la acumulación', example: 'Trabajo en sábado por proyecto urgente' })
    @IsString()
    reason: string;
}
