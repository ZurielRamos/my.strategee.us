import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @ApiProperty({ description: 'Nombre del área o departamento', example: 'Recursos Humanos' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Código de centro de costos', example: 'CC-001' })
    @IsString()
    @IsOptional()
    costCenterCode?: string;

    @ApiPropertyOptional({ description: 'Descripción del área o departamento', example: 'Área encargada de la gestión del talento humano' })
    @IsString()
    @IsOptional()
    description?: string;
}
