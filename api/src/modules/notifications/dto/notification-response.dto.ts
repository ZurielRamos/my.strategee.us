import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID de la notificación' })
  id: number;

  @ApiProperty({ enum: NotificationType, description: 'Tipo de notificación' })
  type: NotificationType;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  message: string;

  @ApiProperty({ description: 'Metadatos adicionales de la notificación' })
  metadata: Record<string, any>;

  @ApiProperty({ enum: NotificationStatus, description: 'Estado de la notificación' })
  status: NotificationStatus;

  @ApiPropertyOptional({ description: 'ID de la solicitud relacionada' })
  requestId?: number;

  @ApiPropertyOptional({ description: 'Fecha en que se marcó como leída' })
  readAt?: Date;

  @ApiProperty({ description: 'Fecha de creación de la notificación' })
  createdAt: Date;
}
