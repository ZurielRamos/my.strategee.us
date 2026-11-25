import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsEnum,
    IsDateString,
    IsOptional,
    Length,
    Matches,
    IsDate,
    IsNumber,
    IsUUID,
} from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';
import { Gender } from '../enums/gender.enum';
import { ContractType } from '../../contracts/enums/contract-type.enum';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
    @ApiProperty({
        example: 'Juan',
        description: 'Nombre del empleado',
    })
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
    firstName: string;

    @ApiProperty({
        example: 'Pérez García',
        description: 'Apellido del empleado',
    })
    @IsString({ message: 'El apellido debe ser un texto' })
    @IsNotEmpty({ message: 'El apellido es requerido' })
    @Length(1, 100, {
        message: 'El apellido debe tener entre 1 y 100 caracteres',
    })
    lastName: string;

    @ApiProperty({
        example: '1234567890',
        description: 'Número de documento único',
    })
    @IsString({ message: 'El número de documento debe ser un texto' })
    @IsNotEmpty({ message: 'El número de documento es requerido' })
    @Length(5, 50, {
        message: 'El número de documento debe tener entre 5 y 50 caracteres',
    })
    documentNumber: string;

    @ApiProperty({
        example: DocumentType.CC,
        description: 'Tipo de documento',
        enum: DocumentType,
    })
    @IsEnum(DocumentType, { message: 'El tipo de documento no es válido' })
    @IsNotEmpty({ message: 'El tipo de documento es requerido' })
    documentType: DocumentType;

    @ApiProperty({
        example: '1990-01-15',
        description: 'Fecha de nacimiento (formato: YYYY-MM-DD)',
    })
    @IsDateString({}, { message: 'La fecha de nacimiento debe ser válida en formato YYYY-MM-DD' })
    @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
    birthDate: string;

    @ApiProperty({
        example: Gender.MALE,
        description: 'Género del empleado',
        enum: Gender,
        required: false,
    })
    @IsOptional()
    @IsEnum(Gender, { message: 'El género no es válido' })
    gender?: Gender;

    @ApiProperty({
        example: 'Calle 123 #45-67, Bogotá',
        description: 'Dirección de residencia',
    })
    @IsString({ message: 'La dirección debe ser un texto' })
    @IsOptional()
    address?: string;

    @ApiProperty({
        example: '+57 300 123 4567',
        description: 'Teléfono personal',
    })
    @IsString({ message: 'El teléfono debe ser un texto' })
    @IsNotEmpty({ message: 'El teléfono es requerido' })
    @Length(7, 20, {
        message: 'El teléfono debe tener entre 7 y 20 caracteres',
    })
    personalPhone: string;

    @ApiProperty({
        example: '2024-02-01',
        description: 'Fecha de ingreso (formato: YYYY-MM-DD)',
        required: false,
    })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de ingreso debe ser válida en formato YYYY-MM-DD' })
    hireDate?: string;

    @ApiProperty({
        example: ContractType.INDEFINITE_TERM,
        description: 'Tipo de contrato',
        enum: ContractType,
        required: false,
    })
    @IsOptional()
    @IsEnum(ContractType, { message: 'El tipo de contrato no es válido' })
    contractType?: ContractType;

    @ApiProperty({ description: 'ID de la empresa', required: false, nullable: true })
    @IsOptional()
    @IsUUID('all', { message: 'La empresa no es válida' })
    companyId?: string | null;

    @ApiProperty({ description: 'ID del puesto', required: false, nullable: true })
    @IsOptional()
    @IsUUID('all', { message: 'El puesto no es válido' })
    positionId?: string | null;

    @ApiProperty({ description: 'ID del departamento/área', required: false, nullable: true })
    @IsOptional()
    @IsUUID('all', { message: 'El departamento/área no es válido' })
    departmentId?: string | null;

    @ApiProperty({
        example: 90,
        description: 'Ido limit',
        required: false,
        default: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'El ido limit debe ser un número' })
    idoLimit?: number;

    @ApiProperty({
        example: 'juan.perez@personal.com',
        description: 'Correo electrónico personal',
    })
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico personal válido' })
    @IsNotEmpty({ message: 'El correo electrónico personal es requerido' })
    personalEmail: string;

    @ApiProperty({
        example: 'juan.perez@company.com',
        description: 'Correo electrónico corporativo',
        required: false,
    })
    @IsOptional()
    corporateEmail?: string;

    @ApiProperty({
        example: 'https://example.com/photos/employee.jpg',
        description: 'URL de la foto del empleado',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'La URL de la foto debe ser un texto' })
    photoUrl?: string;
}
