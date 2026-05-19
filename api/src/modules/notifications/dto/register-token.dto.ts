import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '../enums/platform.enum';

export class RegisterTokenDto {
    @ApiProperty({
        description: 'Token FCM del dispositivo',
        example: 'dGhpcyBpcyBhIHRlc3QgdG9rZW4...',
    })
    @IsString()
    @IsNotEmpty()
    fcmToken: string;

    @ApiProperty({
        description: 'Plataforma del dispositivo',
        enum: Platform,
        example: Platform.WEB,
    })
    @IsEnum(Platform)
    platform: Platform;
}
