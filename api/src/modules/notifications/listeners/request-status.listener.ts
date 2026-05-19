import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { RequestStatusChangedEvent } from '../interfaces/request-status-changed-event.interface';
import { NotificationType } from '../enums/notification-type.enum';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { RequestStatus } from '@modules/operations/requests/enums/request-status.enum';

@Injectable()
export class RequestStatusListener {
    constructor(private readonly notificationsService: NotificationsService) {}

    @OnEvent('request.status.changed')
    async handleRequestStatusChange(event: RequestStatusChangedEvent): Promise<void> {
        const { request, previousStatus, newStatus } = event;

        const message = this.buildNotificationMessage(
            request.type,
            previousStatus,
            newStatus
        );

        await this.notificationsService.createNotification({
            type: NotificationType.REQUEST_STATUS_CHANGE,
            message,
            metadata: {
                requestType: request.type,
                previousStatus,
                newStatus,
                requestId: request.id,
                details: request.details,
                reviewerComment: request.reviewerComment,
                createdAt: request.createdAt,
            },
            employeeId: request.employeeId,
            requestId: request.id,
        });
    }

    /**
     * Construye un mensaje descriptivo de notificación basado en el tipo de solicitud y cambio de estado
     * @param requestType - Tipo de solicitud
     * @param previousStatus - Estado anterior
     * @param newStatus - Nuevo estado
     * @returns Mensaje descriptivo para la notificación
     */
    private buildNotificationMessage(
        requestType: RequestType,
        previousStatus: RequestStatus,
        newStatus: RequestStatus
    ): string {
        // Mapeo de tipos de solicitud a nombres legibles en español
        const requestTypeNames: Record<RequestType, string> = {
            [RequestType.VACATION]: 'vacaciones',
            [RequestType.DOCUMENT]: 'documento',
            [RequestType.MEETING]: 'reunión',
            [RequestType.BENEFIT]: 'beneficio',
            [RequestType.BIRTHDAY]: 'cumpleaños',
            [RequestType.ORDINARY_PERMISSION]: 'permiso ordinario',
            [RequestType.SICK_LEAVE]: 'incapacidad médica',
            [RequestType.MEDICAL_APPOINTMENT]: 'cita médica',
            [RequestType.COMPENSATED_TIME_ACCUMULATION]: 'acumulación de tiempo compensado',
            [RequestType.COMPENSATED_TIME_USAGE]: 'uso de tiempo compensado',
            [RequestType.ENERGYZE_DAY_ACCUMULATION]: 'acumulación de día Energyze',
            [RequestType.ENERGYZE_DAY_USAGE]: 'uso de día Energyze',
            [RequestType.GIFTED_DAY_USAGE]: 'días obsequiados por servicios',
        };

        const requestName = requestTypeNames[requestType] || 'solicitud';

        // Generar mensaje según el nuevo estado
        switch (newStatus) {
            case RequestStatus.APPROVED:
                return `Tu solicitud de ${requestName} ha sido aprobada.`;
            
            case RequestStatus.REJECTED:
                return `Tu solicitud de ${requestName} ha sido rechazada.`;
            
            case RequestStatus.CANCELLED:
                return `Tu solicitud de ${requestName} ha sido cancelada.`;
            
            default:
                return `El estado de tu solicitud de ${requestName} ha cambiado.`;
        }
    }
}
