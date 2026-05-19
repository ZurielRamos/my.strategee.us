import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as fc from 'fast-check';
import { PushSettingsController } from './push-settings.controller';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationService } from './push-notification.service';
import { Platform } from './enums/platform.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';

/**
 * Feature: firebase-push-notifications
 * Property 23: Validación de Autenticación
 * 
 * Para cualquier solicitud de registro o actualización de Device_Token,
 * el sistema debe validar que el empleado esté autenticado antes de
 * procesar la solicitud.
 * 
 * Valida: Requisitos 11.3
 */
describe('PushSettingsController - Property 23: Authentication Validation', () => {
    let app: INestApplication;
    let deviceTokenService: DeviceTokenService;
    let pushNotificationService: PushNotificationService;

    // Arbitraries
    const fcmTokenArbitrary = () =>
        fc.string({ minLength: 100, maxLength: 200 });
    const platformArbitrary = () =>
        fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS);

    beforeEach(async () => {
        const mockDeviceTokenService = {
            registerToken: jest.fn(),
            updateToken: jest.fn(),
            deactivateToken: jest.fn(),
            getTokenStatus: jest.fn(),
            deactivateAllTokensForEmployee: jest.fn(),
        };

        const mockPushNotificationService = {
            sendTestNotification: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PushSettingsController],
            providers: [
                {
                    provide: DeviceTokenService,
                    useValue: mockDeviceTokenService,
                },
                {
                    provide: PushNotificationService,
                    useValue: mockPushNotificationService,
                },
            ],
        })
            .overrideGuard(AccessTokenGuard)
            .useValue({ canActivate: jest.fn(() => false) }) // Simular no autenticado
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        app = module.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();

        deviceTokenService = module.get<DeviceTokenService>(DeviceTokenService);
        pushNotificationService = module.get<PushNotificationService>(
            PushNotificationService,
        );
    });

    afterEach(async () => {
        await app.close();
    });

    it('should reject unauthenticated requests to POST /push-settings/register', async () => {
        await fc.assert(
            fc.asyncProperty(
                fcmTokenArbitrary(),
                platformArbitrary(),
                async (fcmToken, platform) => {
                    const response = await request(app.getHttpServer())
                        .post('/push-settings/register')
                        .send({ fcmToken, platform });

                    // Debe retornar 401 o 403 (no autenticado)
                    expect([401, 403]).toContain(response.status);
                    // No debe llamar al servicio
                    expect(deviceTokenService.registerToken).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should reject unauthenticated requests to PUT /push-settings/update', async () => {
        await fc.assert(
            fc.asyncProperty(
                fcmTokenArbitrary(),
                fcmTokenArbitrary(),
                async (oldToken, newToken) => {
                    const response = await request(app.getHttpServer())
                        .put('/push-settings/update')
                        .send({ oldToken, newToken });

                    // Debe retornar 401 o 403 (no autenticado)
                    expect([401, 403]).toContain(response.status);
                    // No debe llamar al servicio
                    expect(deviceTokenService.updateToken).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should reject unauthenticated requests to POST /push-settings/deactivate', async () => {
        await fc.assert(
            fc.asyncProperty(fcmTokenArbitrary(), async (fcmToken) => {
                const response = await request(app.getHttpServer())
                    .post('/push-settings/deactivate')
                    .send({ fcmToken });

                // Debe retornar 401 o 403 (no autenticado)
                expect([401, 403]).toContain(response.status);
                // No debe llamar al servicio
                expect(deviceTokenService.deactivateToken).not.toHaveBeenCalled();
            }),
            { numRuns: 100 },
        );
    });

    it('should reject unauthenticated requests to GET /push-settings/status', async () => {
        await fc.assert(
            fc.asyncProperty(fcmTokenArbitrary(), async (fcmToken) => {
                const response = await request(app.getHttpServer())
                    .get('/push-settings/status')
                    .query({ fcmToken });

                // Debe retornar 401 o 403 (no autenticado)
                expect([401, 403]).toContain(response.status);
                // No debe llamar al servicio
                expect(deviceTokenService.getTokenStatus).not.toHaveBeenCalled();
            }),
            { numRuns: 100 },
        );
    });

    it('should reject unauthenticated requests to POST /push-settings/test', async () => {
        await fc.assert(
            fc.asyncProperty(fcmTokenArbitrary(), async (fcmToken) => {
                const response = await request(app.getHttpServer())
                    .post('/push-settings/test')
                    .send({ fcmToken });

                // Debe retornar 401 o 403 (no autenticado)
                expect([401, 403]).toContain(response.status);
                // No debe llamar al servicio
                expect(
                    pushNotificationService.sendTestNotification,
                ).not.toHaveBeenCalled();
            }),
            { numRuns: 100 },
        );
    });

    it('should reject unauthenticated requests to POST /push-settings/logout', async () => {
        await fc.assert(
            fc.asyncProperty(fc.constant(null), async () => {
                const response = await request(app.getHttpServer())
                    .post('/push-settings/logout')
                    .send({});

                // Debe retornar 401 o 403 (no autenticado)
                expect([401, 403]).toContain(response.status);
                // No debe llamar al servicio
                expect(
                    deviceTokenService.deactivateAllTokensForEmployee,
                ).not.toHaveBeenCalled();
            }),
            { numRuns: 100 },
        );
    });
});
