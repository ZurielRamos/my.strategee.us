import { IsString, IsNotEmpty, IsEnum, IsNumber, IsUUID, IsDateString, IsOptional, Min, ValidateIf, IsBoolean, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationFrequency } from '../enums/compensation-frequency.enum';
import { CompensationStatus } from '../enums/compensation-status.enum';
import { CompensationCondition } from '../enums/compensation-condition.enum';


export class CreateCompensationDto {
    @ApiProperty({ description: 'ID del empleado', example: 'uuid-employee-id' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: 'Concepto del ingreso', example: 'Bono Trimestral' })
    @IsString()
    @IsNotEmpty()
    concept: string;

    @ApiProperty({ description: 'Indica si está vinculado a un parámetro global', default: false })
    @IsBoolean()
    @IsOptional()
    isLinkedGlobalParameter?: boolean;

    @ApiProperty({ description: 'Condición de la compensación', enum: CompensationCondition, default: CompensationCondition.NONE })
    @IsEnum(CompensationCondition)
    @IsOptional()
    condition?: CompensationCondition;

    @ApiProperty({ description: 'Frecuencia de pago', enum: CompensationFrequency })
    @IsEnum(CompensationFrequency)
    @IsNotEmpty()
    frequency: CompensationFrequency;

    @ApiPropertyOptional({ description: 'Estado de la compensación', enum: CompensationStatus, default: CompensationStatus.ACTIVE })
    @IsEnum(CompensationStatus)
    @IsOptional()
    status?: CompensationStatus;

    @ApiPropertyOptional({ description: 'Monto fijo (Requerido si isLinkedGlobalParameter es false)', example: 500000 })
    @ValidateIf((o) => !o.isLinkedGlobalParameter)
    @IsNumber()
    @Min(0)
    @IsNotEmpty({ message: 'El monto es obligatorio si no está vinculado a un parámetro global' })
    amount?: number;

    @ApiPropertyOptional({ description: 'Clave del parámetro global vinculado (Requerido si isLinkedGlobalParameter es true)', example: 'SALARIO_MINIMO' })
    @ValidateIf((o) => o.isLinkedGlobalParameter)
    @IsString()
    @IsNotEmpty({ message: 'El parámetro global es obligatorio si isLinkedGlobalParameter es true' })
    linkedGlobalParameter?: string;

    @ApiProperty({ description: 'Fecha de inicio (YYYY-MM-DD)', example: '2024-02-01' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)', example: '2024-12-31' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Fecha de pago (Requerido si frecuencia es ONE_TIME)', example: '2024-02-15' })
    @ValidateIf((o) => o.frequency === CompensationFrequency.ONE_TIME)
    @IsDateString()
    @IsNotEmpty({ message: 'La fecha de pago es obligatoria para pagos únicos' })
    paymentDate?: string;

    @ApiPropertyOptional({ description: 'Día de pago (1-31) (Requerido si frecuencia es MENSUAL o QUINCENAL)', example: 15 })
    @ValidateIf((o) => o.frequency === CompensationFrequency.RECURRING_MONTHLY || o.frequency === CompensationFrequency.RECURRING_BIWEEKLY)
    @IsNumber()
    @Min(1)
    @Max(31)
    @IsNotEmpty({ message: 'El día de pago es obligatorio para frecuencias mensuales o quincenales' })
    paymentDay?: number;

    @ApiPropertyOptional({ description: 'Segundo día de pago (1-31) (Requerido si frecuencia es QUINCENAL)', example: 30 })
    @ValidateIf((o) => o.frequency === CompensationFrequency.RECURRING_BIWEEKLY)
    @IsNumber()
    @Min(1)
    @Max(31)
    @IsNotEmpty({ message: 'El segundo día de pago es obligatorio para frecuencia quincenal' })
    secondPaymentDay?: number;
}
