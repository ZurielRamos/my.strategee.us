import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsNumber } from 'class-validator';

export class EnergyzeDayUsageDetailsDto {
    @ApiProperty({ description: 'Fecha del sábado a disfrutar (YYYY-MM-DD, debe ser sábado)' })
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Razón del disfrute', example: 'Descanso personal' })
    @IsString()
    reason: string;

    @ApiProperty({ description: 'Días a usar (siempre 1)', required: false })
    @IsOptional()
    @IsNumber()
    days?: number;

    @ApiProperty({ description: 'Balance después de la solicitud', required: false })
    @IsOptional()
    @IsNumber()
    balanceAfter?: number;
}
