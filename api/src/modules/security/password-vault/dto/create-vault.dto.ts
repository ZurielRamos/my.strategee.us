import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsArray, MaxLength } from 'class-validator';
import { VisibilityLevel } from '../enums/visibility-level.enum';

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

    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'ID del vault padre para crear subcarpetas anidadas',
        required: false,
    })
    @IsUUID('4', { message: 'El parentId debe ser un UUID válido' })
    @IsOptional()
    parentId?: string;

    @ApiProperty({
        example: 'private',
        description: 'Nivel de visibilidad del directorio. Las credenciales sin visibilidad propia heredan esta configuración.',
        enum: VisibilityLevel,
        default: VisibilityLevel.PRIVATE,
        required: false,
    })
    @IsEnum(VisibilityLevel, { message: 'El nivel de visibilidad no es válido' })
    @IsOptional()
    visibilityLevel?: VisibilityLevel;

    @ApiProperty({
        description: 'IDs de empresas con acceso al directorio (cuando visibilityLevel es BY_COMPANY)',
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true, message: 'Cada companyId debe ser un UUID válido' })
    @IsOptional()
    companyIds?: string[];

    @ApiProperty({
        description: 'IDs de áreas con acceso al directorio (cuando visibilityLevel es BY_AREA)',
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true, message: 'Cada areaId debe ser un UUID válido' })
    @IsOptional()
    areaIds?: string[];

    @ApiProperty({
        description: 'IDs de puestos con acceso al directorio (cuando visibilityLevel es BY_POSITION)',
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true, message: 'Cada positionId debe ser un UUID válido' })
    @IsOptional()
    positionIds?: string[];

    @ApiProperty({
        description: 'IDs de empleados con acceso al directorio (cuando visibilityLevel es BY_EMPLOYEE_LIST)',
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true, message: 'Cada employeeId debe ser un UUID válido' })
    @IsOptional()
    employeeIds?: string[];
}
