import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyResponseDto {
    @ApiProperty({ description: 'UUID de la empresa' })
    id: string;

    @ApiProperty({ description: 'Nombre comercial de la empresa' })
    name: string;

    @ApiProperty({ description: 'Razón social de la empresa' })
    legalName: string;

    @ApiProperty({ description: 'NIT de la empresa' })
    nit: string;

    @ApiProperty({ description: 'Dirección de la empresa' })
    address: string;

    @ApiPropertyOptional({ description: 'URL small del logo de la empresa' })
    logoUrl?: string;

    @ApiProperty({ description: 'Fecha de creación' })
    createdAt: Date;

    @ApiProperty({ description: 'Fecha de actualización' })
    updatedAt: Date;
}
