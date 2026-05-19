import { Test, TestingModule } from '@nestjs/testing';
import { RequestStatusListener } from './request-status.listener';
import { NotificationsService } from '../notifications.service';
import { RequestStatusChangedEvent } from '../interfaces/request-status-changed-event.interface';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { RequestStatus } from '@modules/operations/requests/enums/request-status.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { Request } from '@modules/operations/requests/entities/request.entity';

describe('RequestStatusListener', () => {
    let listener: RequestStatusListener;
    let notificationsService: jest.Mocked<NotificationsService>;

    beforeEach(async () => {
        const mockNotificationsService = {
            createNotification: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RequestStatusListener,
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        listener = module.get<RequestStatusListener>(RequestStatusListener);
        notificationsService = module.get(NotificationsService);
    });

    it('should be defined', () => {
        expect(listener).toBeDefined();
    });

    describe('handleRequestStatusChange', () => {
        it('should create notification when status changes to APPROVED', async () => {
            const mockRequest = {
                id: 1,
                type: RequestType.VACATION,
                employeeId: 'emp-123',
            } as Request;

            const event: RequestStatusChangedEvent = {
                request: mockRequest,
                previousStatus: RequestStatus.PENDING,
                newStatus: RequestStatus.APPROVED,
            };

            await listener.handleRequestStatusChange(event);

            expect(notificationsService.createNotification).toHaveBeenCalledWith({
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Tu solicitud de vacaciones ha sido aprobada.',
                metadata: {
                    requestType: RequestType.VACATION,
                    previousStatus: RequestStatus.PENDING,
                    newStatus: RequestStatus.APPROVED,
                    requestId: 1,
                },
                employeeId: 'emp-123',
                requestId: 1,
            });
        });

        it('should create notification when status changes to REJECTED', async () => {
            const mockRequest = {
                id: 2,
                type: RequestType.MEETING,
                employeeId: 'emp-456',
            } as Request;

            const event: RequestStatusChangedEvent = {
                request: mockRequest,
                previousStatus: RequestStatus.PENDING,
                newStatus: RequestStatus.REJECTED,
            };

            await listener.handleRequestStatusChange(event);

            expect(notificationsService.createNotification).toHaveBeenCalledWith({
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Tu solicitud de reunión ha sido rechazada.',
                metadata: {
                    requestType: RequestType.MEETING,
                    previousStatus: RequestStatus.PENDING,
                    newStatus: RequestStatus.REJECTED,
                    requestId: 2,
                },
                employeeId: 'emp-456',
                requestId: 2,
            });
        });

        it('should create notification when status changes to CANCELLED', async () => {
            const mockRequest = {
                id: 3,
                type: RequestType.BENEFIT,
                employeeId: 'emp-789',
            } as Request;

            const event: RequestStatusChangedEvent = {
                request: mockRequest,
                previousStatus: RequestStatus.PENDING,
                newStatus: RequestStatus.CANCELLED,
            };

            await listener.handleRequestStatusChange(event);

            expect(notificationsService.createNotification).toHaveBeenCalledWith({
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Tu solicitud de beneficio ha sido cancelada.',
                metadata: {
                    requestType: RequestType.BENEFIT,
                    previousStatus: RequestStatus.PENDING,
                    newStatus: RequestStatus.CANCELLED,
                    requestId: 3,
                },
                employeeId: 'emp-789',
                requestId: 3,
            });
        });

        it('should include correct metadata for all request types', async () => {
            const mockRequest = {
                id: 4,
                type: RequestType.SICK_LEAVE,
                employeeId: 'emp-999',
            } as Request;

            const event: RequestStatusChangedEvent = {
                request: mockRequest,
                previousStatus: RequestStatus.PENDING,
                newStatus: RequestStatus.APPROVED,
            };

            await listener.handleRequestStatusChange(event);

            const callArgs = notificationsService.createNotification.mock.calls[0][0];
            expect(callArgs.metadata).toEqual({
                requestType: RequestType.SICK_LEAVE,
                previousStatus: RequestStatus.PENDING,
                newStatus: RequestStatus.APPROVED,
                requestId: 4,
            });
        });

        it('should associate notification with correct employee', async () => {
            const mockRequest = {
                id: 5,
                type: RequestType.DOCUMENT,
                employeeId: 'emp-specific-id',
            } as Request;

            const event: RequestStatusChangedEvent = {
                request: mockRequest,
                previousStatus: RequestStatus.PENDING,
                newStatus: RequestStatus.APPROVED,
            };

            await listener.handleRequestStatusChange(event);

            const callArgs = notificationsService.createNotification.mock.calls[0][0];
            expect(callArgs.employeeId).toBe('emp-specific-id');
            expect(callArgs.requestId).toBe(5);
        });

        it('should generate appropriate messages for different request types', async () => {
            const requestTypes = [
                { type: RequestType.VACATION, expectedMessage: 'Tu solicitud de vacaciones ha sido aprobada.' },
                { type: RequestType.DOCUMENT, expectedMessage: 'Tu solicitud de documento ha sido aprobada.' },
                { type: RequestType.MEETING, expectedMessage: 'Tu solicitud de reunión ha sido aprobada.' },
                { type: RequestType.BENEFIT, expectedMessage: 'Tu solicitud de beneficio ha sido aprobada.' },
                { type: RequestType.BIRTHDAY, expectedMessage: 'Tu solicitud de cumpleaños ha sido aprobada.' },
                { type: RequestType.ORDINARY_PERMISSION, expectedMessage: 'Tu solicitud de permiso ordinario ha sido aprobada.' },
                { type: RequestType.SICK_LEAVE, expectedMessage: 'Tu solicitud de incapacidad médica ha sido aprobada.' },
                { type: RequestType.MEDICAL_APPOINTMENT, expectedMessage: 'Tu solicitud de cita médica ha sido aprobada.' },
                { type: RequestType.COMPENSATED_TIME_ACCUMULATION, expectedMessage: 'Tu solicitud de acumulación de tiempo compensado ha sido aprobada.' },
                { type: RequestType.COMPENSATED_TIME_USAGE, expectedMessage: 'Tu solicitud de uso de tiempo compensado ha sido aprobada.' },
                { type: RequestType.ENERGYZE_DAY_ACCUMULATION, expectedMessage: 'Tu solicitud de acumulación de día Energyze ha sido aprobada.' },
                { type: RequestType.ENERGYZE_DAY_USAGE, expectedMessage: 'Tu solicitud de uso de día Energyze ha sido aprobada.' },
            ];

            for (const { type, expectedMessage } of requestTypes) {
                const mockRequest = {
                    id: 1,
                    type,
                    employeeId: 'emp-123',
                } as Request;

                const event: RequestStatusChangedEvent = {
                    request: mockRequest,
                    previousStatus: RequestStatus.PENDING,
                    newStatus: RequestStatus.APPROVED,
                };

                await listener.handleRequestStatusChange(event);

                const callArgs = notificationsService.createNotification.mock.calls[notificationsService.createNotification.mock.calls.length - 1][0];
                expect(callArgs.message).toBe(expectedMessage);
            }
        });
    });
});
