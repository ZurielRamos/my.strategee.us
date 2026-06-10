import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateBahamasConfigDto {
    @ApiProperty({ description: 'ID del dispositivo WhatsApp', example: 'uuid-device-id' })
    @IsString()
    @IsOptional()
    whatsappDeviceId?: string;

    @ApiProperty({ description: 'Hora inicio mañana (HH:mm)', example: '07:00' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'morningStart debe tener formato HH:mm' })
    morningStart?: string;

    @ApiProperty({ description: 'Hora fin mañana (HH:mm)', example: '09:00' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'morningEnd debe tener formato HH:mm' })
    morningEnd?: string;

    @ApiProperty({ description: 'Hora entrega mañana (HH:mm)', example: '10:00' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'morningDelivery debe tener formato HH:mm' })
    morningDelivery?: string;

    @ApiProperty({ description: 'Hora inicio tarde (HH:mm)', example: '12:00' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'afternoonStart debe tener formato HH:mm' })
    afternoonStart?: string;

    @ApiProperty({ description: 'Hora fin tarde (HH:mm)', example: '14:00' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'afternoonEnd debe tener formato HH:mm' })
    afternoonEnd?: string;

    @ApiProperty({ description: 'Hora entrega tarde (HH:mm)', example: '15:00' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'afternoonDelivery debe tener formato HH:mm' })
    afternoonDelivery?: string;
}
