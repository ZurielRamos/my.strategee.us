import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateTokenDto {
    @ApiProperty({
        description: 'Token FCM a desactivar',
        example: 'dGhpcyBpcyBhIHRlc3QgdG9rZW4...',
    })
    @IsString()
    @IsNotEmpty()
    fcmToken: string;
}
