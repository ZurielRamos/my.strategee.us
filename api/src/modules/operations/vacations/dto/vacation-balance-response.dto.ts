import { ApiProperty } from '@nestjs/swagger';

class VacationUsageBreakdownDto {
    @ApiProperty({ description: 'Días disfrutados físicamente (Ausencias)', example: 5 })
    taken: number;

    @ApiProperty({ description: 'Días compensados en dinero (No disfrutados)', example: 2 })
    compensated: number;

    @ApiProperty({ description: 'Días liquidados al finalizar contrato', example: 0 })
    settled: number;

    @ApiProperty({ description: 'Suma neta de ajustes manuales (+/-)', example: 1 })
    adjustments: number;
}

export class VacationBalanceResponseDto {
    @ApiProperty({ description: 'Tasa anual aplicada', example: 15 })
    rateApplied: number;

    // --- SECCIÓN DE INGRESOS ---
    @ApiProperty({ description: 'Total de días ganados (Devengados) por tiempo trabajado', example: 20 })
    totalAccrued: number;

    // --- SECCIÓN DE EGRESOS/USO ---
    @ApiProperty({ description: 'Total general descontado del saldo (Suma del desglose)', example: 7 })
    totalUsed: number;

    @ApiProperty({ type: VacationUsageBreakdownDto, description: 'Detalle de cómo se han utilizado los días' })
    breakdown: VacationUsageBreakdownDto;

    // --- SECCIÓN DE SALDOS ---
    @ApiProperty({ description: 'Días apartados en solicitudes pendientes', example: 2 })
    pendingReserved: number;

    @ApiProperty({ description: 'Balance técnico actual (Ganados - Usados)', example: 13 })
    realBalance: number;

    @ApiProperty({ description: 'Días disponibles para solicitar hoy', example: 11 })
    availableBalance: number;

    @ApiProperty({ description: 'Indica si el empleado es elegible para vacaciones (contrato laboral activo: Término Indefinido o Término Fijo)' })
    isEligible: boolean;
}