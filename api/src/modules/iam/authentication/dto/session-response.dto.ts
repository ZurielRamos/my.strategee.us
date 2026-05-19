import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class SessionResponseDto {
    @ApiProperty({ description: 'ID de la sesión' })
    id: string;

    @ApiProperty({ description: 'Nombre del dispositivo', example: 'Chrome on macOS' })
    deviceName: string;

    @ApiProperty({ description: 'Tipo de dispositivo', example: 'desktop' })
    deviceType: string;

    @ApiProperty({ description: 'Dirección IP', example: '192.168.1.1' })
    ipAddress: string;

    @ApiProperty({ description: 'Última vez usado' })
    lastUsedAt: Date;

    @ApiProperty({ description: 'Fecha de creación' })
    createdAt: Date;

    @ApiProperty({ description: 'Si es la sesión actual' })
    isCurrent: boolean;

    @Exclude()
    userId: string;

    @Exclude()
    refreshToken: string;

    @Exclude()
    userAgent: string;

    @Exclude()
    expiresAt: Date;
}