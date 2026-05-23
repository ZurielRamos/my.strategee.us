import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleSignInDto {
    @ApiProperty({
        description: 'ID Token obtenido de Firebase Authentication con Google',
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    })
    @IsString()
    @IsNotEmpty()
    idToken: string;
}
