import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { NotificationStatus } from '../enums/notification-status.enum';

export class GetNotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Filtrar por estado de notificación' })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
