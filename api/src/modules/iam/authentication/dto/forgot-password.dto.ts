import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ description: 'Email del usuario', example: 'user@example.com' })
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
    email: string;
}
