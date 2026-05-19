import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateEmergencyContactDto {
    @ApiProperty({ description: 'Nombre completo del contacto', example: 'María García' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    name: string;

    @ApiProperty({ description: 'Parentesco o relación', example: 'Madre' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    relationship: string;

    @ApiProperty({ description: 'Teléfono de contacto', example: '3001234567' })
    @IsString()
    @IsNotEmpty()
    @Length(7, 20)
    phone: string;

    @ApiPropertyOptional({ description: 'Correo electrónico', example: 'maria@email.com' })
    @IsOptional()
    @IsEmail()
    email?: string;
}
