import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfilePhotoDto {
    @ApiProperty({
        description: 'ID del attachment que será la foto de perfil',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    profilePhotoId?: string | null;
}
