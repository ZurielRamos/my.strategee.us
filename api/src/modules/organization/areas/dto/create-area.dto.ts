import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAreaDto {
    @ApiProperty({ description: 'Nombre del área', example: 'Recursos Humanos' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Descripción del área', example: 'Área encargada de la gestión del talento humano' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Indica si el área está activa', example: true, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
