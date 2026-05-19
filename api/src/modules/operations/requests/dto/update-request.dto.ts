import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRequestDto {
    @ApiPropertyOptional({ description: 'Detalles actualizados de la solicitud' })
    @IsOptional()
    @IsObject()
    details?: any;
}
