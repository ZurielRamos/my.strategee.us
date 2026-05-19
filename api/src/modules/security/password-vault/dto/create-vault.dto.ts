import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateVaultDto {
    @ApiProperty({
        example: 'Proyecto Alpha',
        description: 'Nombre del vault',
        maxLength: 100,
    })
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100, { message: 'El nombre debe tener máximo 100 caracteres' })
    name: string;

    @ApiProperty({
        example: 'Credenciales para el proyecto Alpha',
        description: 'Descripción del vault',
        required: false,
    })
    @IsString({ message: 'La descripción debe ser un texto' })
    @IsOptional()
    description?: string;
}
