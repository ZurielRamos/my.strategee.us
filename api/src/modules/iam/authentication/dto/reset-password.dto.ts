import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ description: 'Token de recuperación recibido por email' })
    @IsString()
    token: string;

    @ApiProperty({ description: 'Nueva contraseña', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    newPassword: string;
}
