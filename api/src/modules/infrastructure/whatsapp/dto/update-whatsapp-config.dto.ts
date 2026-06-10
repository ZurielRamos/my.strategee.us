import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateWhatsappConfigDto {
    @ApiProperty({ description: 'URL base de Evolution API' })
    @IsString()
    @IsNotEmpty()
    @IsUrl({ require_tld: false })
    apiUrl: string;

    @ApiProperty({ description: 'API Key de autenticación de Evolution API' })
    @IsString()
    @IsNotEmpty()
    apiKey: string;
}
