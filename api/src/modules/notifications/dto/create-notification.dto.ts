import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Tipo de notificación' })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Metadatos adicionales de la notificación' })
  @IsObject()
  @IsNotEmpty()
  metadata: Record<string, any>;

  @ApiProperty({ description: 'ID del empleado destinatario' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({ description: 'ID de la solicitud relacionada' })
  @IsInt()
  @IsOptional()
  requestId?: number;
}
