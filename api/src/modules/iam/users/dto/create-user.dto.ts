import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    Matches,
    IsEnum,
    IsOptional,
    IsArray,
} from 'class-validator';
import { Role } from '../../authorization/enums/role.enum';

export class CreateUserDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Correo electrónico único del usuario',
    })
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Contraseña del usuario (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números)',
    })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número o carácter especial',
    })
    password: string;

    @ApiProperty({
        example: [Role.EMPLOYEE],
        description: 'Roles del usuario',
        enum: Role,
        isArray: true,
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsEnum(Role, { each: true, message: 'Cada rol debe ser válido' })
    roles?: Role[];
}
