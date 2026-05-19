import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, IsOptional, IsInt, IsUUID } from 'class-validator';

// Para pago en dinero (Compensación)
export class RegisterMoneyPaymentDto {
    @ApiProperty({ description: 'ID del empleado', example: '37df3f1e-9ad4-4944-be0e-6b3dc3d745d3' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: 'Cantidad de días a pagar (debe ser positivo)', example: 5 })
    @IsNumber()
    @Min(0.5)
    days: number; // El admin envía 5, el sistema lo guardará como -5

    @ApiProperty({ description: 'Motivo del pago', example: 'Compensación de vacaciones no disfrutadas' })
    @IsString()
    @IsNotEmpty()
    note: string;
}

// Para Ajustes Manuales (+ o -)
export class RegisterAdjustmentDto {
    @ApiProperty({ description: 'ID del empleado', example: '37df3f1e-9ad4-4944-be0e-6b3dc3d745d3' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: 'Días a ajustar (Positivo suma saldo, Negativo resta saldo)', example: -2 })
    @IsNumber()
    @IsNotEmpty()
    days: number;

    @ApiProperty({ description: 'Justificación del ajuste', example: 'Error en migración de datos' })
    @IsString()
    @IsNotEmpty()
    note: string;
}