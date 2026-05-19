import { Controller, Get, Patch, Body, Query, UseGuards, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { PaginatedResult } from '@common/interfaces/pagination.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener notificaciones del empleado actual' })
    @ApiResponse({
        status: 200,
        description: 'Lista de notificaciones obtenida exitosamente',
        type: NotificationResponseDto,
        isArray: true,
    })
    async getNotifications(
        @ActiveUser('employeeId') employeeId: string,
        @Query(new ValidationPipe({ transform: true })) query: GetNotificationsQueryDto
    ): Promise<PaginatedResult<NotificationResponseDto>> {
        return this.notificationsService.findAllForEmployee(employeeId, query);
    }

    @Get('unread-count')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener el conteo de notificaciones no leídas' })
    @ApiResponse({
        status: 200,
        description: 'Conteo de notificaciones no leídas obtenido exitosamente',
        type: UnreadCountResponseDto,
    })
    async getUnreadCount(
        @ActiveUser('employeeId') employeeId: string
    ): Promise<UnreadCountResponseDto> {
        const count = await this.notificationsService.getUnreadCount(employeeId);
        return { count };
    }

    @Patch('mark-as-read')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Marcar notificaciones como leídas' })
    @ApiResponse({
        status: 204,
        description: 'Notificaciones marcadas como leídas exitosamente',
    })
    @ApiResponse({
        status: 403,
        description: 'No tienes permiso para marcar estas notificaciones como leídas',
    })
    @ApiResponse({
        status: 404,
        description: 'Una o más notificaciones no fueron encontradas',
    })
    async markAsRead(
        @ActiveUser('employeeId') employeeId: string,
        @Body() dto: MarkAsReadDto
    ): Promise<void> {
        await this.notificationsService.markAsRead(employeeId, dto.notificationIds);
    }
}
