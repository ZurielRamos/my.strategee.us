import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class SignUpDto {
    @ApiProperty({
        example: 'admin@strategee.us',
        description: 'Correo electrónico del usuario',
    })
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Contraseña del usuario (mínimo 8 caracteres)',
    })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número o carácter especial',
    })
    password: string;
}
