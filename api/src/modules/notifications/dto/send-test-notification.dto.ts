import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTestNotificationDto {
    @ApiProperty({
        description: 'Token FCM del dispositivo donde enviar la notificación de prueba',
        example: 'dGhpcyBpcyBhIHRlc3QgdG9rZW4...',
    })
    @IsString()
    @IsNotEmpty()
    fcmToken: string;
}
