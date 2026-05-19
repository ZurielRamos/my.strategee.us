import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeSettingsDto {
    @ApiPropertyOptional({ description: 'Notificaciones por correo personal', default: false })
    @IsOptional()
    @IsBoolean()
    personalEmailNotification?: boolean;

    @ApiPropertyOptional({ description: 'Notificaciones por correo corporativo', default: false })
    @IsOptional()
    @IsBoolean()
    corporativeEmailNotification?: boolean;
}
