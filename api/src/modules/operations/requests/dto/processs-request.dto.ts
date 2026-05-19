import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProcessRequestDto {
    @ApiProperty({ description: 'Comentario del revisor (opcional)', required: false })
    @IsOptional()
    @IsString()
    reviewerComment?: string;
}