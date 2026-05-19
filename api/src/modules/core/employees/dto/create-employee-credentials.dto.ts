import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    Matches,
    IsEnum,
    IsArray,
} from 'class-validator';
import { Role } from '@modules/iam/authorization/enums/role.enum';

export class CreateEmployeeCredentialsDto {


    @ApiProperty({
        example: [Role.EMPLOYEE],
        description: 'Roles del usuario',
        enum: Role,
        isArray: true,
    })
    @IsArray({ message: 'Los roles deben ser un arreglo' })
    @IsEnum(Role, { each: true, message: 'Cada rol debe ser válido' })
    roles: Role[];
}
