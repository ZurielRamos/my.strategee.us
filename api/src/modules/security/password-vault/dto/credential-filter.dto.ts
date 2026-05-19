import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CredentialFilterDto {
  @ApiPropertyOptional({
    example: 'google',
    description: 'Texto para búsqueda en título, URL o nombre del vault',
  })
  @IsOptional()
  @IsString({ message: 'El texto de búsqueda debe ser un texto' })
  search?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del vault para filtrar credenciales',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El vaultId debe ser un UUID válido' })
  vaultId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Número de página',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser un número positivo' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Cantidad de resultados por página',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser un número positivo' })
  limit?: number = 10;
}
