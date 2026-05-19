import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateContactInfoDto {
    @ApiPropertyOptional({ description: 'Dirección de residencia', example: 'Calle 123 #45-67, Bogotá' })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    address?: string;

    @ApiPropertyOptional({ description: 'Teléfono personal', example: '3001234567' })
    @IsOptional()
    @IsString()
    @Length(7, 20)
    phone?: string;

    @ApiPropertyOptional({ description: 'Correo electrónico personal', example: 'juan@email.com' })
    @IsOptional()
    @IsEmail()
    personalEmail?: string;
}
