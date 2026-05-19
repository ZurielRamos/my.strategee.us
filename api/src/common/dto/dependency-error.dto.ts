import { ApiProperty } from '@nestjs/swagger';

export class EntityDependencyDto {
    @ApiProperty({ description: 'Entity name that has dependencies' })
    entity: string;

    @ApiProperty({ description: 'Number of dependent records' })
    count: number;

    @ApiProperty({
        description: 'Examples of dependent records (first 3)',
        required: false,
        type: [String],
    })
    examples?: string[];
}

/**
 * DTO for dependency conflict error responses
 */
export class DependencyErrorResponseDto {
    @ApiProperty({ example: 409 })
    statusCode: number;

    @ApiProperty({
        example: 'No se puede eliminar la empresa porque está siendo utilizada',
    })
    message: string;

    @ApiProperty({ example: 'Conflict' })
    error: string;

    @ApiProperty({
        type: [EntityDependencyDto],
        description: 'List of entities that depend on this record',
    })
    dependencies: EntityDependencyDto[];
}
