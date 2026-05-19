import { ApiProperty } from '@nestjs/swagger';

class CompensatedTimeUsageBreakdownDto {
    @ApiProperty({ description: 'Horas acumuladas por aprobaciones', example: 17 })
    accumulated: number;

    @ApiProperty({ description: 'Horas disfrutadas (usadas)', example: 8.5 })
    used: number;

    @ApiProperty({ description: 'Horas vencidas', example: 0 })
    expired: number;

    @ApiProperty({ description: 'Suma neta de ajustes manuales (+/-)', example: 0 })
    adjustments: number;
}

export class CompensatedTimeBalanceResponseDto {
    @ApiProperty({ description: 'Total de horas acumuladas', example: 17 })
    totalAccumulated: number;

    @ApiProperty({ description: 'Total de horas utilizadas', example: 8.5 })
    totalUsed: number;

    @ApiProperty({ type: CompensatedTimeUsageBreakdownDto, description: 'Detalle del balance' })
    breakdown: CompensatedTimeUsageBreakdownDto;

    @ApiProperty({ description: 'Horas apartadas en solicitudes pendientes', example: 4 })
    pendingReserved: number;

    @ApiProperty({ description: 'Balance actual (Acumulado - Usado)', example: 8.5 })
    realBalance: number;

    @ApiProperty({ description: 'Horas disponibles para solicitar hoy', example: 4.5 })
    availableBalance: number;

    @ApiProperty({ description: 'Balance en días (realBalance / HOURS_PER_DAY)', example: 1 })
    realBalanceInDays: number;

    @ApiProperty({ description: 'Balance disponible en días', example: 0.53 })
    availableBalanceInDays: number;
}
