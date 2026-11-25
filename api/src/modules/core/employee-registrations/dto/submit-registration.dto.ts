import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    Equals,
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@modules/core/employees/enums/document-type.enum';
import { Gender } from '@modules/core/employees/enums/gender.enum';
import { ContractType } from '@modules/core/contracts/enums/contract-type.enum';
import { CreateEmergencyContactDto } from '@modules/core/employees/dto/create-emergency-contact.dto';
import { UpsertParafiscalesDto } from '@modules/core/parafiscales/dto/upsert-parafiscales.dto';

export class SubmitRegistrationDto {
    // --- Información personal
    @ApiProperty() @IsString() @IsNotEmpty() @Length(1, 100)
    firstName: string;

    @ApiProperty() @IsString() @IsNotEmpty() @Length(1, 100)
    lastName: string;

    @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType)
    documentType: DocumentType;

    @ApiProperty() @IsString() @IsNotEmpty() @Length(5, 50)
    documentNumber: string;

    @ApiProperty({ example: '1990-01-15' }) @IsDateString()
    birthDate: string;

    @ApiProperty({ enum: Gender }) @IsEnum(Gender)
    gender: Gender;

    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255)
    address: string;

    @ApiProperty() @IsString() @IsNotEmpty() @Length(7, 20)
    personalPhone: string;

    @ApiProperty() @IsEmail() @MaxLength(100)
    personalEmail: string;

    @ApiProperty() @IsEmail() @MaxLength(100)
    corporateEmail: string;

    // --- Información laboral
    @ApiProperty({ example: '2024-02-01' }) @IsDateString()
    hireDate: string;

    @ApiProperty({ enum: ContractType }) @IsEnum(ContractType)
    contractType: ContractType;

    @ApiProperty() @IsUUID('all')
    companyId: string;

    @ApiProperty() @IsUUID('all')
    positionId: string;

    @ApiProperty() @IsUUID('all')
    departmentId: string;

    // --- Contactos de emergencia
    @ApiProperty({ type: [CreateEmergencyContactDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(5)
    @ValidateNested({ each: true })
    @Type(() => CreateEmergencyContactDto)
    emergencyContacts: CreateEmergencyContactDto[];

    // --- Parafiscales
    @ApiProperty({ type: UpsertParafiscalesDto })
    @ValidateNested()
    @Type(() => UpsertParafiscalesDto)
    parafiscales: UpsertParafiscalesDto;

    // --- Consentimientos (todos obligatorios)
    @ApiProperty() @Equals(true, { message: 'Debes aceptar los Términos y Condiciones de Uso' })
    acceptTerms: boolean;

    @ApiProperty() @Equals(true, { message: 'Debes autorizar el tratamiento de tus datos personales' })
    acceptDataPolicy: boolean;

    @ApiProperty() @Equals(true, { message: 'Debes confirmar la veracidad de la información y la autorización de tus contactos' })
    confirmThirdParty: boolean;

    @ApiProperty({ example: '1.0' }) @IsString() @IsNotEmpty() @MaxLength(20)
    termsVersion: string;

    /** Campo trampa anti-bots: debe llegar vacío. */
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website?: string;
}
