import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectGoogleWorkspaceDto {
    @ApiProperty({
        description: 'Código de autorización de Google (serverAuthCode en Android, code de Google Identity Services en web)',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: "redirect_uri usado al obtener el código: '' en Android/iOS, 'postmessage' en web",
        required: false,
        enum: ['', 'postmessage'],
    })
    @IsOptional()
    @IsIn(['', 'postmessage'])
    redirectUri?: '' | 'postmessage';
}
