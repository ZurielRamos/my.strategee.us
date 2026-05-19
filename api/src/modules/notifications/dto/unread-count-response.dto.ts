import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'Número de notificaciones no leídas' })
  count: number;
}
