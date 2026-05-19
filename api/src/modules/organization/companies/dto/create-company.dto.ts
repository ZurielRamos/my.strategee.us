import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ description: 'Nombre comercial de la empresa', example: 'Strategee Tech' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Razón social de la empresa', example: 'Strategee Technologies S.A.S.' })
    @IsString()
    @IsNotEmpty()
    legalName: string;

    @ApiProperty({ description: 'Número de Identificación Tributaria (NIT)', example: '900.123.456-7' })
    @IsString()
    @IsNotEmpty()
    nit: string;

    @ApiProperty({ description: 'Dirección física de la empresa', example: 'Calle 100 # 15-20' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiPropertyOptional({ description: 'ID del attachment del logo de la empresa' })
    @IsUUID()
    @IsOptional()
    logoId?: string;
}
