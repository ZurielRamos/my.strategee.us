import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTokenDto {
    @ApiProperty({
        description: 'Token FCM antiguo',
        example: 'dGhpcyBpcyBhIHRlc3QgdG9rZW4...',
    })
    @IsString()
    @IsNotEmpty()
    oldToken: string;

    @ApiProperty({
        description: 'Token FCM nuevo',
        example: 'bmV3IHRva2VuIGhlcmU...',
    })
    @IsString()
    @IsNotEmpty()
    newToken: string;
}
