import { ApiProperty } from '@nestjs/swagger';

export class GiftedDaysBalanceResponseDto {
    @ApiProperty({ description: 'Días devengados por tiempo trabajado (contrato prestación de servicios)' })
    totalAccrued: number;

    @ApiProperty({ description: 'Saldo total (devengado + ajustes manuales - usos)' })
    totalDays: number;

    @ApiProperty({ description: 'Días disponibles (descontando solicitudes pendientes)' })
    availableDays: number;

    @ApiProperty({ description: 'Días en solicitudes pendientes de aprobación' })
    pendingDays: number;

    @ApiProperty({ description: 'Indica si el empleado es elegible (sin contrato activo o con contrato de prestación de servicios)' })
    isEligible: boolean;
}
