import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AttachmentFolder } from '../enums/attachment-folder.enum';

export class UploadAttachmentDto {
    @ApiPropertyOptional({ description: 'Título del archivo' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ enum: AttachmentFolder, default: AttachmentFolder.GENERAL })
    @IsEnum(AttachmentFolder)
    @IsOptional()
    folder?: AttachmentFolder = AttachmentFolder.GENERAL;

    @ApiPropertyOptional({ description: 'Texto alternativo (para imágenes)' })
    @IsString()
    @IsOptional()
    alt?: string;

    @ApiPropertyOptional({ description: 'Descripción del archivo' })
    @IsString()
    @IsOptional()
    description?: string;
}
