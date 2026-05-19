import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertParafiscalesDto {
    @ApiPropertyOptional({ description: 'Entidad Promotora de Salud (EPS)', example: 'Sura EPS' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    eps?: string | null;

    @ApiPropertyOptional({ description: 'Administradora de Riesgos Laborales (ARL)', example: 'Sura ARL' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    arl?: string | null;

    @ApiPropertyOptional({ description: 'Fondo de Pensión', example: 'Porvenir' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    fondoPension?: string | null;

    @ApiPropertyOptional({ description: 'Caja de Compensación Familiar', example: 'Compensar' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    cajaCompensacion?: string | null;
}
