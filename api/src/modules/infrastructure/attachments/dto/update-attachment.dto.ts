import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAttachmentDto {
    @ApiPropertyOptional({ description: 'Título del archivo' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ description: 'Texto alternativo (para imágenes)' })
    @IsString()
    @IsOptional()
    alt?: string;

    @ApiPropertyOptional({ description: 'Descripción del archivo' })
    @IsString()
    @IsOptional()
    description?: string;
}
