import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, IsInt } from 'class-validator';

// Para ajustes manuales (+ o -)
export class RegisterCompensatedTimeAdjustmentDto {
    @ApiProperty({ description: 'ID del empleado', example: '1' })
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: 'Horas a ajustar (Positivo suma, Negativo resta)', example: -2 })
    @IsNumber()
    @IsNotEmpty()
    hours: number;

    @ApiProperty({ description: 'Justificación del ajuste', example: 'Corrección por error administrativo' })
    @IsString()
    @IsNotEmpty()
    note: string;
}
