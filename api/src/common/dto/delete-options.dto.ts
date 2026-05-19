import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for delete operation options
 */
export class DeleteOptionsDto {
    @ApiProperty({
        description: 'Force deletion even with dependencies (admin only)',
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    force?: boolean;

    @ApiProperty({
        description: 'Cascade delete to related entities',
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    cascade?: boolean;
}
