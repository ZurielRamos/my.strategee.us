import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AreaResponseDto {
    @ApiProperty({ description: 'ID del área', example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ description: 'Nombre del área', example: 'Recursos Humanos' })
    name: string;

    @ApiPropertyOptional({ description: 'Descripción del área', example: 'Área encargada de la gestión del talento humano' })
    description?: string;

    @ApiProperty({ description: 'Indica si el área está activa', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Fecha de creación', example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Fecha de última actualización', example: '2024-01-01T00:00:00.000Z' })
    updatedAt: Date;
}
