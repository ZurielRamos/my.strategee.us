import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
}
