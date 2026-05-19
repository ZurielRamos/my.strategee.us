import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentType } from '../enums/attachment-type.enum';
import { AttachmentFolder } from '../enums/attachment-folder.enum';

export class FindAttachmentsDto {
    @ApiPropertyOptional({ enum: AttachmentType })
    @IsEnum(AttachmentType)
    @IsOptional()
    type?: AttachmentType;

    @ApiPropertyOptional({ enum: AttachmentFolder })
    @IsEnum(AttachmentFolder)
    @IsOptional()
    folder?: AttachmentFolder;

    @ApiPropertyOptional({ description: 'Búsqueda por nombre de archivo' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Búsqueda por título' })
    @IsString()
    @IsOptional()
    searchTitle?: string;

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Orden por fecha de subida' })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    sortByDate?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({ default: 1 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;
}
