import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAsReadDto {
  @ApiProperty({ description: 'IDs de las notificaciones a marcar como leídas', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  notificationIds: number[];
}
