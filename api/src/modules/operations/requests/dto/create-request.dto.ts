import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { RequestType } from '../enums/request-type.enum';

export class CreateRequestDto {
    @ApiProperty({ enum: RequestType, description: 'Tipo de solicitud' })
    @IsEnum(RequestType)
    @IsNotEmpty()
    type: RequestType;

    @ApiProperty({
        description: 'Detalles dinámicos según el tipo. Ej: { startDate: "...", endDate: "..." } para VACATION',
        type: 'object',
        additionalProperties: true
    })
    @IsObject()
    @IsNotEmpty()
    details: Record<string, any>;
}