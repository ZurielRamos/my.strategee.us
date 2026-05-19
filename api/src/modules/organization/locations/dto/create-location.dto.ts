import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
    @ApiProperty({ description: 'Nombre de la ubicación', example: 'Oficina Principal' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Descripción de la ubicación',
        required: false,
        example: 'Sede central de la empresa',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Dirección de la ubicación',
        required: false,
        example: 'Calle 100 # 15-20',
    })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({
        description: 'Ciudad de la ubicación',
        required: false,
        example: 'Bogotá',
    })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({
        description: 'País de la ubicación',
        required: false,
        example: 'Colombia',
    })
    @IsString()
    @IsOptional()
    country?: string;
}
