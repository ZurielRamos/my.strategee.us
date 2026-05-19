import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '../enums/platform.enum';

export class PushSettingsResponseDto {
    @ApiProperty({
        description: 'Indica si las notificaciones push están habilitadas',
        example: true,
    })
    enabled: boolean;

    @ApiProperty({
        description: 'Plataforma del dispositivo',
        enum: Platform,
        example: Platform.WEB,
    })
    platform: Platform;

    @ApiProperty({
        description: 'Fecha de la última notificación enviada',
        example: '2024-01-15T10:30:00Z',
        required: false,
    })
    lastNotificationAt?: Date;

    @ApiProperty({
        description: 'Estado del permiso de notificaciones',
        enum: ['granted', 'denied', 'default'],
        example: 'granted',
    })
    permissionStatus: 'granted' | 'denied' | 'default';
}
