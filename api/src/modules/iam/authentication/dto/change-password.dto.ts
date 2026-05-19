import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ description: 'Contraseña actual' })
    @IsString()
    currentPassword: string;

    @ApiProperty({ description: 'Nueva contraseña', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    newPassword: string;
}
