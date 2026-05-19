import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../shared/services/toast.service';

export enum PlatformType {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export interface PushSettingsResponse {
  enabled: boolean;
  platform: PlatformType;
  lastNotificationAt?: Date;
  permissionStatus: 'granted' | 'denied' | 'default';
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private apiUrl = `${environment.apiUrl}/push-settings`;
  private currentToken: string | null = null;
  private messaging: Messaging | null = null;
  private readonly STORAGE_KEY_TOKEN = 'push_notification_token';
  private readonly STORAGE_KEY_ENABLED = 'push_notification_enabled';

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private toastService: ToastService,
    private router: Router
  ) {
    this.initializeFirebase();
    this.loadStoredToken();
  }

  private async loadStoredToken(): Promise<void> {
    try {
      const result = await Preferences.get({ key: this.STORAGE_KEY_TOKEN });
      if (result.value) {
        this.currentToken = result.value;
        console.log('Loaded stored token:', this.currentToken);
      }
    } catch (error) {
      console.error('Error loading stored token:', error);
    }
  }

  private async saveToken(token: string): Promise<void> {
    try {
      await Preferences.set({ 
        key: this.STORAGE_KEY_TOKEN, 
        value: token 
      });
      await Preferences.set({ 
        key: this.STORAGE_KEY_ENABLED, 
        value: 'true' 
      });
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private async clearToken(): Promise<void> {
    try {
      await Preferences.remove({ key: this.STORAGE_KEY_TOKEN });
      await Preferences.set({ 
        key: this.STORAGE_KEY_ENABLED, 
        value: 'false' 
      });
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  private async isEnabled(): Promise<boolean> {
    try {
      const result = await Preferences.get({ key: this.STORAGE_KEY_ENABLED });
      return result.value === 'true';
    } catch (error) {
      console.error('Error checking enabled status:', error);
      return false;
    }
  }

  private initializeFirebase(): void {
    if (this.platform.is('capacitor')) {
      // Usar Capacitor Push Notifications para móvil
      return;
    }

    // Inicializar Firebase para web
    const app = initializeApp(environment.firebase);
    this.messaging = getMessaging(app);
  }

  async requestPermission(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      return this.requestCapacitorPermission();
    } else {
      return this.requestWebPermission();
    }
  }

  private async requestCapacitorPermission(): Promise<boolean> {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  }

  private async requestWebPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') {
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async registerDevice(): Promise<string | null> {
    if (this.platform.is('capacitor')) {
      return this.registerCapacitorDevice();
    } else {
      return this.registerWebDevice();
    }
  }

  private async registerCapacitorDevice(): Promise<string | null> {
    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token: Token) => {
        this.currentToken = token.value;
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration:', error);
        resolve(null);
      });
    });
  }

  private async registerWebDevice(): Promise<string | null> {
    if (!this.messaging) {
      console.error('Firebase messaging not initialized');
      return null;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey
      });
      this.currentToken = token;
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async enablePushNotifications(): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      return false;
    }

    const token = await this.registerDevice();
    
    if (!token) {
      return false;
    }

    const platformType = this.getPlatform();
    
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/register`, {
        fcmToken: token,
        platform: platformType
      }));

      // Guardar token en almacenamiento local
      await this.saveToken(token);

      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('Error registering token with backend:', error);
      return false;
    }
  }

  async disablePushNotifications(): Promise<void> {
    if (!this.currentToken) {
      return;
    }

    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/deactivate`, {
        fcmToken: this.currentToken
      }));

      // Limpiar token del almacenamiento local
      await this.clearToken();
      this.currentToken = null;
    } catch (error) {
      console.error('Error deactivating token:', error);
      throw error;
    }
  }

  private setupNotificationListeners(): void {
    if (this.platform.is('capacitor')) {
      this.setupCapacitorListeners();
    } else {
      this.setupWebListeners();
    }
  }

  private setupCapacitorListeners(): void {
    // Notificación recibida
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received:', notification);
        // Mostrar notificación in-app si la app está abierta
      }
    );

    // Notificación tocada
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        const data = notification.notification.data;
        this.handleNotificationTap(data);
      }
    );
  }

  private setupWebListeners(): void {
    if (!this.messaging) {
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      
      // Mostrar notificación in-app cuando la app está abierta
      const title = payload.notification?.title || 'Nueva Notificación';
      const body = payload.notification?.body || '';
      const message = body ? `${title}: ${body}` : title;
      
      this.toastService.show(message);
    });
  }

  private handleNotificationTap(data: any): void {
    if (data.requestId) {
      // Navegar a la solicitud usando Angular Router
      // Nota: Actualmente navega a la lista de solicitudes ya que no existe una ruta de detalle
      // Cuando se implemente la ruta /employee/requests/:id, actualizar a:
      // this.router.navigate(['/employee/requests', data.requestId]);
      this.router.navigate(['/employee/requests']);
    }
  }

  async sendTestNotification(): Promise<void> {
    if (!this.currentToken) {
      throw new Error('No token available');
    }

    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/test`, {
        fcmToken: this.currentToken
      }));
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  async getStatus(): Promise<PushSettingsResponse> {
    // Primero verificar el estado local
    const enabled = await this.isEnabled();
    
    if (!enabled || !this.currentToken) {
      return { 
        enabled: false,
        platform: this.getPlatform(),
        permissionStatus: 'default'
      };
    }

    try {
      const status = await firstValueFrom(this.http.get<PushSettingsResponse>(`${this.apiUrl}/status`, {
        params: { fcmToken: this.currentToken }
      }));
      
      // Actualizar el estado local si el backend dice que está deshabilitado
      if (!status.enabled) {
        await this.clearToken();
      }
      
      return status;
    } catch (error) {
      console.error('Error getting status:', error);
      // Si hay error, confiar en el estado local
      return { 
        enabled: enabled,
        platform: this.getPlatform(),
        permissionStatus: 'granted'
      };
    }
  }

  private getPlatform(): PlatformType {
    if (this.platform.is('android')) {
      return PlatformType.ANDROID;
    } else if (this.platform.is('ios')) {
      return PlatformType.IOS;
    } else {
      return PlatformType.WEB;
    }
  }

  async onLogout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/logout`, {}));
      // Limpiar token del almacenamiento local
      await this.clearToken();
      this.currentToken = null;
    } catch (error) {
      console.error('Error during logout:', error);
      // No lanzar error para no bloquear el logout
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }
}
