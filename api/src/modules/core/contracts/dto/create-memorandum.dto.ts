import { IsString, IsNotEmpty, IsEnum, IsNumber, IsUUID, IsDateString, IsOptional, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalaryType } from '../enums/salary-type.enum';

export class CreateMemorandumDto {
    @ApiProperty({ description: 'ID del cargo (Position)', example: 'uuid-position-id' })
    @IsUUID()
    @IsNotEmpty()
    positionId: string;

    @ApiProperty({ description: 'ID del horario', example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    @IsUUID()
    @IsOptional()
    scheduleId?: string;

    @ApiProperty({ description: 'ID de la ubicación', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
    @IsUUID()
    @IsOptional()
    locationId?: string;

    @ApiProperty({ description: 'ID del departamento/área', example: '550e8400-e29b-41d4-a716-446655440002', required: false })
    @IsUUID()
    @IsOptional()
    departmentId?: string;

    @ApiProperty({ description: 'Tipo de salario', enum: SalaryType, example: SalaryType.FIXED })
    @IsEnum(SalaryType)
    @IsNotEmpty()
    salaryType: SalaryType;

    @ApiProperty({ description: 'Monto del salario (Requerido sí es FIXED o INTEGRAL)', example: 2500000, required: false })
    @ValidateIf((o) => o.salaryType === SalaryType.FIXED || o.salaryType === SalaryType.INTEGRAL)
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    salaryAmount?: number;

    @ApiProperty({ description: 'Clave del parámetro (Requerido si es PARAMETER)', example: 'MINIMUM_WAGE', required: false })
    @ValidateIf((o) => o.salaryType === SalaryType.PARAMETER)
    @IsString()
    @IsNotEmpty()
    parameterKey?: string;

    @ApiProperty({ description: 'Fecha de inicio del cambio (YYYY-MM-DD)', example: '2024-02-01' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({ description: 'Fecha de fin del cambio (YYYY-MM-DD)', example: '2025-02-01' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiProperty({ description: 'Razón del cambio', example: 'Ingreso inicial' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}
