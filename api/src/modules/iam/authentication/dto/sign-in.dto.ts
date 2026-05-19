import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class SignInDto {
    @ApiProperty({
        example: 'admin@strategee.us',
        description: 'Correo electrónico del usuario',
    })
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Contraseña del usuario',
    })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    password: string;
}
