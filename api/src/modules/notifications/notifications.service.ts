import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from './entities/notification.entity';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationStatus } from './enums/notification-status.enum';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,
        @InjectRepository(Request)
        private readonly requestsRepository: Repository<Request>,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    /**
     * Crea una nueva notificación en el sistema
     * @param dto - Datos para crear la notificación
     * @returns La notificación creada
     */
    async createNotification(dto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationsRepository.create({
            type: dto.type,
            message: dto.message,
            metadata: dto.metadata,
            employeeId: dto.employeeId,
            requestId: dto.requestId,
        });

        const savedNotification = await this.notificationsRepository.save(notification);

        // Emitir evento para push notifications
        this.eventEmitter.emit('notification.created', {
            notificationId: savedNotification.id,
        });

        return savedNotification;
    }

    /**
     * Consulta notificaciones de un empleado con paginación
     * @param employeeId - ID del empleado
     * @param query - Parámetros de consulta (paginación y filtros)
     * @returns Resultado paginado de notificaciones
     */
    async findAllForEmployee(
        employeeId: string,
        query: GetNotificationsQueryDto
    ): Promise<PaginatedResult<NotificationResponseDto>> {
        const { page = 1, limit = 10, status } = query;

        // Construir query base
        const queryBuilder = this.notificationsRepository
            .createQueryBuilder('notification')
            .where('notification.employeeId = :employeeId', { employeeId });

        // Aplicar filtro de status si se proporciona
        if (status) {
            queryBuilder.andWhere('notification.status = :status', { status });
        }

        // Ordenar por createdAt descendente
        queryBuilder.orderBy('notification.createdAt', 'DESC');

        // Aplicar paginación
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Ejecutar consulta
        const [notifications, total] = await queryBuilder.getManyAndCount();

        // Mapear a DTOs
        const data = notifications.map(notification => ({
            id: notification.id,
            type: notification.type,
            message: notification.message,
            metadata: notification.metadata,
            status: notification.status,
            requestId: notification.requestId,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
        }));

        // Calcular metadata de paginación
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }

    /**
     * Obtiene el conteo de notificaciones no leídas de un empleado
     * @param employeeId - ID del empleado
     * @returns Número de notificaciones con status UNREAD
     */
    async getUnreadCount(employeeId: string): Promise<number> {
        return await this.notificationsRepository.count({
            where: {
                employeeId,
                status: NotificationStatus.UNREAD,
            },
        });
    }

    /**
     * Marca notificaciones como leídas
     * @param employeeId - ID del empleado
     * @param notificationIds - Array de IDs de notificaciones a marcar como leídas
     * @throws ForbiddenException si alguna notificación no pertenece al empleado
     */
    async markAsRead(
        employeeId: string,
        notificationIds: number[]
    ): Promise<void> {
        if (notificationIds.length === 0) {
            return;
        }

        // Obtener todas las notificaciones solicitadas
        const notifications = await this.notificationsRepository.find({
            where: {
                id: In(notificationIds),
            },
        });

        // Validar que todas las notificaciones existen
        if (notifications.length !== notificationIds.length) {
            throw new NotFoundException('Una o más notificaciones no fueron encontradas');
        }

        // Validar que todas las notificaciones pertenecen al empleado (seguridad)
        const invalidNotifications = notifications.filter(
            notification => notification.employeeId !== employeeId
        );

        if (invalidNotifications.length > 0) {
            throw new ForbiddenException('No tienes permiso para marcar estas notificaciones como leídas');
        }

        // Actualizar solo las notificaciones que están UNREAD
        // Preservar readAt original si ya está marcada como leída
        const now = new Date();
        const notificationsToUpdate = notifications
            .filter(notification => notification.status === NotificationStatus.UNREAD)
            .map(notification => ({
                ...notification,
                status: NotificationStatus.READ,
                readAt: now,
            }));

        if (notificationsToUpdate.length > 0) {
            await this.notificationsRepository.save(notificationsToUpdate);
        }
    }

    /**
     * Elimina notificaciones más antiguas que el número de días especificado
     * @param daysToKeep - Número de días de retención
     * @returns Cantidad de notificaciones eliminadas
     */
    async deleteOldNotifications(daysToKeep: number): Promise<number> {
        // Calcular fecha límite basada en días de retención
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        // Eliminar notificaciones más antiguas que la fecha límite
        const result = await this.notificationsRepository
            .createQueryBuilder()
            .delete()
            .from(Notification)
            .where('createdAt < :cutoffDate', { cutoffDate })
            .execute();

        // Retornar cantidad de notificaciones eliminadas
        return result.affected || 0;
    }

}
