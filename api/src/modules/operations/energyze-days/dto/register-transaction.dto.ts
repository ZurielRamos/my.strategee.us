import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EnergyzeDaysTransactionType } from '../entities/energyze-days-ledger.entity';

export class RegisterEnergyzeDaysTransactionDto {
    @ApiProperty({ description: 'ID del empleado' })
    @IsString()
    employeeId: string;

    @ApiProperty({ enum: EnergyzeDaysTransactionType })
    @IsEnum(EnergyzeDaysTransactionType)
    type: EnergyzeDaysTransactionType;

    @ApiProperty({ description: 'Cantidad de días (positivo o negativo según el tipo)' })
    @IsNumber()
    days: number;

    @ApiProperty({ description: 'ID de la solicitud relacionada', required: false })
    @IsOptional()
    @IsNumber()
    requestId?: number;

    @ApiProperty({ description: 'Nota o comentario', required: false })
    @IsOptional()
    @IsString()
    note?: string;
}

export class AdjustEnergyzeDaysDto {
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
