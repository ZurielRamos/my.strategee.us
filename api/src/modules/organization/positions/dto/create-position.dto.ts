import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskLevel } from '../enums/risk-level.enum';

export class CreatePositionDto {
    @ApiProperty({ description: 'Nombre del cargo', example: 'Desarrollador Backend Senior' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Nivel de riesgo ARL', enum: RiskLevel, example: RiskLevel.I })
    @IsEnum(RiskLevel)
    @IsNotEmpty()
    riskLevel: RiskLevel;

    @ApiProperty({ description: 'ID del departamento al que pertenece', example: 'uuid-department-id' })
    @IsUUID()
    @IsNotEmpty()
    departmentId: string;

}
