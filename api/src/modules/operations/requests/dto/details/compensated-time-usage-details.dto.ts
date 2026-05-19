import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, ValidateIf } from 'class-validator';

export enum UsageType {
    DAYS = 'DAYS',
    HOURS = 'HOURS'
}

export class CompensatedTimeUsageDetailsDto {
    @ApiProperty({ 
        description: 'Tipo de solicitud: Días o Horas',
        enum: UsageType,
        example: UsageType.DAYS
    })
    @IsEnum(UsageType)
    @IsNotEmpty()
    usageType: UsageType;

    @ApiProperty({ 
        description: 'Fecha de inicio (ISO 8601)',
        example: '2024-03-20'
    })
    @IsString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ 
        description: 'Fecha de fin (ISO 8601). Para tipo HOURS, debe ser igual a startDate',
        example: '2024-03-21'
    })
    @IsString()
    @IsNotEmpty()
    endDate: string;

    @ApiProperty({ 
        description: 'Hora de inicio (HH:mm). Requerido solo para tipo HOURS',
        example: '09:00',
        required: false
    })
    @IsString()
    @IsOptional()
    @ValidateIf(o => o.usageType === UsageType.HOURS)
    @IsNotEmpty()
    startTime?: string;

    @ApiProperty({ 
        description: 'Hora de fin (HH:mm). Requerido solo para tipo HOURS',
        example: '13:00',
        required: false
    })
    @IsString()
    @IsOptional()
    @ValidateIf(o => o.usageType === UsageType.HOURS)
    @IsNotEmpty()
    endTime?: string;

    @ApiProperty({ 
        description: 'Comentarios u observaciones adicionales',
        example: 'Necesito el día para asuntos personales',
        required: false
    })
    @IsString()
    @IsOptional()
    comments?: string;

    @ApiProperty({ 
        description: 'Horas calculadas según el tipo de solicitud',
        example: 8.5,
        required: false
    })
    @IsNumber()
    @IsOptional()
    calculatedHours?: number;

    @ApiProperty({ 
        description: 'Días calculados (calculatedHours / hoursPerWorkday configurado)',
        example: 1,
        required: false
    })
    @IsNumber()
    @IsOptional()
    calculatedDays?: number;

    @ApiProperty({ 
        description: 'Balance disponible después de aplicar esta solicitud (en horas)',
        example: 17,
        required: false
    })
    @IsNumber()
    @IsOptional()
    balanceAfter?: number;
}
