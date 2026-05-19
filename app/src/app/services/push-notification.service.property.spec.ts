import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Platform } from '@ionic/angular';
import { PushNotificationService, PlatformType } from './push-notification.service';
import * as fc from 'fast-check';

/**
 * Feature: firebase-push-notifications
 * Property 1: Solicitud de Permisos por Plataforma
 * 
 * Para cualquier plataforma (WEB, ANDROID, IOS), cuando un empleado habilita las notificaciones push,
 * el sistema debe solicitar permisos de dispositivo utilizando la API nativa correspondiente a esa plataforma.
 * 
 * Valida: Requisitos 1.2
 */
describe('PushNotificationService - Property-Based Tests', () => {
  let service: PushNotificationService;
  let platformSpy: jasmine.SpyObj<Platform>;

  beforeEach(() => {
    platformSpy = jasmine.createSpyObj('Platform', ['is']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PushNotificationService,
        { provide: Platform, useValue: platformSpy }
      ]
    });

    service = TestBed.inject(PushNotificationService);
  });

  describe('Property 1: Solicitud de Permisos por Plataforma', () => {
    it('should request permissions using platform-specific API for any platform', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('WEB', 'ANDROID', 'IOS'),
          async (platform: string) => {
            // Setup platform detection
            if (platform === 'WEB') {
              platformSpy.is.and.callFake((p: string) => p !== 'capacitor');
              
              // Mock Web Notification API
              const originalNotification = (window as any).Notification;
              let permissionRequested = false;
              (window as any).Notification = {
                requestPermission: jasmine.createSpy('requestPermission').and.callFake(() => {
                  permissionRequested = true;
                  return Promise.resolve('granted');
                })
              };

              const result = await service.requestPermission();

              // Verify permission was requested using web API
              expect(permissionRequested).toBe(true);
              expect(result).toBe(true);

              // Restore
              (window as any).Notification = originalNotification;
            } else {
              // For Capacitor platforms (ANDROID/IOS)
              platformSpy.is.and.callFake((p: string) => p === 'capacitor');

              // Mock Capacitor PushNotifications API
              const PushNotifications = (await import('@capacitor/push-notifications')).PushNotifications;
              spyOn(PushNotifications, 'requestPermissions').and.returnValue(
                Promise.resolve({ receive: 'granted' })
              );

              const result = await service.requestPermission();

              // Verify permission was requested using Capacitor API
              expect(PushNotifications.requestPermissions).toHaveBeenCalled();
              expect(result).toBe(true);
            }
          }
        ),
        { numRuns: 10 } // Reduced runs for faster execution
      );
    });

    it('should handle permission denial for any platform', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('WEB', 'ANDROID', 'IOS'),
          fc.constantFrom('denied', 'default'),
          async (platform: string, permissionStatus: string) => {
            // Setup platform detection
            if (platform === 'WEB') {
              platformSpy.is.and.callFake((p: string) => p !== 'capacitor');
              
              // Mock Web Notification API with denied permission
              const originalNotification = (window as any).Notification;
              (window as any).Notification = {
                requestPermission: jasmine.createSpy('requestPermission').and.returnValue(
                  Promise.resolve(permissionStatus)
                )
              };

              const result = await service.requestPermission();

              // Verify permission denial is handled correctly
              expect(result).toBe(false);

              // Restore
              (window as any).Notification = originalNotification;
            } else {
              // For Capacitor platforms (ANDROID/IOS)
              platformSpy.is.and.callFake((p: string) => p === 'capacitor');

              // Mock Capacitor PushNotifications API with denied permission
              const PushNotifications = (await import('@capacitor/push-notifications')).PushNotifications;
              spyOn(PushNotifications, 'requestPermissions').and.returnValue(
                Promise.resolve({ receive: permissionStatus as any })
              );

              const result = await service.requestPermission();

              // Verify permission denial is handled correctly
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 10 } // Reduced runs for faster execution
      );
    });
  });

  describe('Property: Platform Detection', () => {
    it('should correctly identify platform type for any platform configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            isAndroid: fc.boolean(),
            isIOS: fc.boolean(),
            isCapacitor: fc.boolean()
          }),
          async (platformConfig) => {
            // Setup platform detection based on configuration
            platformSpy.is.and.callFake((p: string) => {
              if (p === 'android') return platformConfig.isAndroid;
              if (p === 'ios') return platformConfig.isIOS;
              if (p === 'capacitor') return platformConfig.isCapacitor;
              return false;
            });

            const detectedPlatform = (service as any).getPlatform();

            // Verify platform detection logic
            if (platformConfig.isAndroid) {
              expect(detectedPlatform).toBe(PlatformType.ANDROID);
            } else if (platformConfig.isIOS) {
              expect(detectedPlatform).toBe(PlatformType.IOS);
            } else {
              expect(detectedPlatform).toBe(PlatformType.WEB);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: firebase-push-notifications
   * Property 12: Extracción de Datos de Navegación
   * 
   * Para cualquier notificación push que contenga un request_id, el sistema debe poder extraer
   * correctamente ese identificador del payload de datos para navegación.
   * 
   * Valida: Requisitos 6.2, 6.3
   */
  describe('Property 12: Extracción de Datos de Navegación', () => {
    it('should correctly extract requestId from notification payload for any valid requestId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            requestId: fc.oneof(
              fc.integer({ min: 1, max: 999999 }).map(String),
              fc.uuid(),
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
            ),
            notificationId: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom('REQUEST_STATUS_CHANGE', 'TEST', 'GENERAL')
          }),
          async (payload) => {
            // Mock window.location.href to capture navigation
            const originalLocation = window.location;
            let capturedHref = '';
            delete (window as any).location;
            (window as any).location = {
              ...originalLocation,
              href: ''
            };
            Object.defineProperty(window.location, 'href', {
              set: (value: string) => {
                capturedHref = value;
              },
              get: () => capturedHref
            });

            // Create notification data with requestId
            const notificationData = {
              requestId: payload.requestId,
              notificationId: payload.notificationId,
              type: payload.type
            };

            // Call handleNotificationTap
            (service as any).handleNotificationTap(notificationData);

            // Verify requestId was correctly extracted and used for navigation
            expect(capturedHref).toBe(`/requests/${payload.requestId}`);
            expect(capturedHref).toContain(payload.requestId);

            // Restore window.location
            (window as any).location = originalLocation;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle notification data without requestId gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            notificationId: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom('REQUEST_STATUS_CHANGE', 'TEST', 'GENERAL')
          }),
          async (payload) => {
            // Mock window.location.href to capture navigation
            const originalLocation = window.location;
            let capturedHref = '';
            delete (window as any).location;
            (window as any).location = {
              ...originalLocation,
              href: ''
            };
            Object.defineProperty(window.location, 'href', {
              set: (value: string) => {
                capturedHref = value;
              },
              get: () => capturedHref
            });

            // Create notification data WITHOUT requestId
            const notificationData = {
              notificationId: payload.notificationId,
              type: payload.type
            };

            // Call handleNotificationTap
            (service as any).handleNotificationTap(notificationData);

            // Verify no navigation occurred when requestId is missing
            expect(capturedHref).toBe('');

            // Restore window.location
            (window as any).location = originalLocation;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty or null requestId values correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', null, undefined, 0, false),
          async (invalidRequestId) => {
            // Mock window.location.href to capture navigation
            const originalLocation = window.location;
            let capturedHref = '';
            delete (window as any).location;
            (window as any).location = {
              ...originalLocation,
              href: ''
            };
            Object.defineProperty(window.location, 'href', {
              set: (value: string) => {
                capturedHref = value;
              },
              get: () => capturedHref
            });

            // Create notification data with invalid requestId
            const notificationData = {
              requestId: invalidRequestId,
              notificationId: 'test-123',
              type: 'TEST'
            };

            // Call handleNotificationTap
            (service as any).handleNotificationTap(notificationData);

            // Verify no navigation occurred for invalid requestId
            expect(capturedHref).toBe('');

            // Restore window.location
            (window as any).location = originalLocation;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
