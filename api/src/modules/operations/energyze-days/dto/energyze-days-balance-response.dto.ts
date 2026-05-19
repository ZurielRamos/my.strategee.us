import { ApiProperty } from '@nestjs/swagger';

export class EnergyzeDaysBalanceResponseDto {
    @ApiProperty({ description: 'Saldo total de días Energyze disponibles' })
    totalDays: number;

    @ApiProperty({ description: 'Días disponibles (descontando solicitudes pendientes)' })
    availableDays: number;

    @ApiProperty({ description: 'Días en solicitudes pendientes de aprobación' })
    pendingDays: number;
}
