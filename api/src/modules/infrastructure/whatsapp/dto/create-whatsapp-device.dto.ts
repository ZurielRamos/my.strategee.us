import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWhatsappDeviceDto {
    @ApiProperty({ description: 'Nombre del dispositivo' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Nombre de la instancia en Evolution API' })
    @IsString()
    @IsNotEmpty()
    instanceName: string;
}
