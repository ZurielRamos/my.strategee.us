import { IsNotEmpty, IsEnum, IsNumber, IsInt, IsDateString, IsOptional, Min, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalParameterKey } from '../enums/global-parameter-key.enum';

export class CreateGlobalParameterDto {
    @ApiProperty({ description: 'Clave del parámetro', example: 'MINIMUM_WAGE' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ description: 'Valor numérico', example: 1300000 })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    value: number;

    @ApiProperty({ description: 'Fecha de inicio de vigencia (YYYY-MM-DD)', example: '2024-01-01' })
    @IsDateString()
    @IsNotEmpty()
    validFrom: string;
}
