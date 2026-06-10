import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateApiKeyDto {
    @ApiProperty({
        description: 'Nombre descriptivo para la API key',
        example: 'Integración ERP',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    name: string;
}
