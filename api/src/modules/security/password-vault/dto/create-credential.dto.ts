import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUrl,
  IsEnum,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VisibilityLevel } from '../enums/visibility-level.enum';

export class CreateCredentialDto {
  @ApiProperty({
    example: 'Mi Credencial',
    description: 'Título de la credencial',
    maxLength: 200,
  })
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  @MaxLength(200, { message: 'El título debe tener máximo 200 caracteres' })
  title: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'URL del servicio',
    required: false,
  })
  @IsString({ message: 'El URL debe ser un texto' })
  @IsUrl({ require_protocol: true, require_valid_protocol: true, protocols: ['http', 'https'], require_tld: false }, { message: 'El URL debe tener un formato válido' })
  @IsOptional()
  url?: string;

  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Nombre de usuario',
    required: false,
  })
  @IsString({ message: 'El nombre de usuario debe ser un texto' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  username?: string;

  @ApiProperty({
    example: 'P@ssw0rd123',
    description: 'Contraseña',
    required: false,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: 'https://example.com/login',
    description: 'URL de login directo',
    required: false,
  })
  @IsString({ message: 'El URL de login directo debe ser un texto' })
  @IsUrl({ require_protocol: true, require_valid_protocol: true, protocols: ['http', 'https'], require_tld: false }, { message: 'El URL de login directo debe tener un formato válido' })
  @IsOptional()
  directLoginUrl?: string;

  @ApiProperty({
    example: 'Notas adicionales sobre esta credencial',
    description: 'Notas adicionales',
    required: false,
  })
  @IsString({ message: 'Las notas deben ser un texto' })
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del logo (attachment)',
    required: false,
  })
  @IsUUID('4', { message: 'El logoId debe ser un UUID válido' })
  @IsOptional()
  logoId?: string;

  @ApiProperty({
    example: VisibilityLevel.PRIVATE,
    description: 'Nivel de visibilidad de la credencial. Si no se especifica, hereda la del vault.',
    enum: VisibilityLevel,
    required: false,
    default: VisibilityLevel.PRIVATE,
  })
  @IsEnum(VisibilityLevel, { message: 'El nivel de visibilidad debe ser un valor válido' })
  @IsOptional()
  visibilityLevel?: VisibilityLevel;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del vault',
  })
  @IsUUID('4', { message: 'El vaultId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El vaultId es requerido' })
  vaultId: string;

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'IDs de empresas con acceso',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Los companyIds deben ser un array' })
  @IsUUID('4', { each: true, message: 'Cada companyId debe ser un UUID válido' })
  @IsOptional()
  companyIds?: string[];

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'IDs de áreas con acceso',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Los areaIds deben ser un array' })
  @IsUUID('4', { each: true, message: 'Cada areaId debe ser un UUID válido' })
  @IsOptional()
  areaIds?: string[];

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'IDs de puestos con acceso',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Los positionIds deben ser un array' })
  @IsUUID('4', { each: true, message: 'Cada positionId debe ser un UUID válido' })
  @IsOptional()
  positionIds?: string[];

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'IDs de empleados con acceso',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Los employeeIds deben ser un array' })
  @IsUUID('4', { each: true, message: 'Cada employeeId debe ser un UUID válido' })
  @IsOptional()
  employeeIds?: string[];
}
