import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GrantGiftedDaysDto {
    @ApiProperty({ description: 'ID del empleado' })
    @IsString()
    employeeId: string;

    @ApiProperty({ description: 'Cantidad de días a obsequiar (positivo)' })
    @IsNumber()
    days: number;

    @ApiProperty({ description: 'Razón del obsequio (ej: Reconocimiento por servicio)' })
    @IsString()
    note: string;
}

export class AdjustGiftedDaysDto {
    @ApiProperty({ description: 'ID del empleado' })
    @IsString()
    employeeId: string;

    @ApiProperty({ description: 'Cantidad de días a ajustar (positivo para sumar, negativo para restar)' })
    @IsNumber()
    days: number;

    @ApiProperty({ description: 'Razón del ajuste' })
    @IsString()
    note: string;
}
