import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export enum PlatformType {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS'
}

export interface PushNotificationPayload {
  notification: {
    title: string;
    body: string;
  };
  data: {
    notificationId: string;
    requestId?: string;
    type: string;
  };
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
  private firebaseApp: FirebaseApp | null = null;

  constructor(
    private http: HttpClient,
    private platform: Platform
  ) {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase for web platform
   * For Capacitor (mobile), we use the native push notification plugin
   */
  private initializeFirebase(): void {
    if (this.platform.is('capacitor')) {
      // Use Capacitor Push Notifications for mobile
      return;
    }

    // Initialize Firebase for web
    if (environment.firebase) {
      this.firebaseApp = initializeApp(environment.firebase);
      this.messaging = getMessaging(this.firebaseApp);
    }
  }

  /**
   * Request permission for push notifications
   * Detects platform and uses appropriate API
   * @returns Promise<boolean> indicating if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      return this.requestCapacitorPermission();
    } else {
      return this.requestWebPermission();
    }
  }

  /**
   * Request permission using Capacitor Push Notifications plugin
   * @returns Promise<boolean> indicating if permission was granted
   */
  private async requestCapacitorPermission(): Promise<boolean> {
    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting Capacitor permissions:', error);
      return false;
    }
  }

  /**
   * Request permission using Web Notification API
   * @returns Promise<boolean> indicating if permission was granted
   */
  private async requestWebPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.error('This browser does not support notifications');
        return false;
      }
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting web permissions:', error);
      return false;
    }
  }

  /**
   * Register device and obtain FCM token
   * @returns Promise<string | null> the device token or null if registration failed
   */
  async registerDevice(): Promise<string | null> {
    if (this.platform.is('capacitor')) {
      return this.registerCapacitorDevice();
    } else {
      return this.registerWebDevice();
    }
  }

  /**
   * Register device using Capacitor Push Notifications plugin
   * @returns Promise<string | null> the device token or null if registration failed
   */
  private async registerCapacitorDevice(): Promise<string | null> {
    try {
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
    } catch (error) {
      console.error('Error registering Capacitor device:', error);
      return null;
    }
  }

  /**
   * Register device using Firebase Messaging for web
   * @returns Promise<string | null> the device token or null if registration failed
   */
  private async registerWebDevice(): Promise<string | null> {
    try {
      if (!this.messaging) {
        console.error('Firebase messaging not initialized');
        return null;
      }

      if (!environment.firebase?.vapidKey) {
        console.error('VAPID key not configured');
        return null;
      }

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

  /**
   * Enable push notifications
   * Requests permissions, registers device, sends token to backend, and sets up listeners
   * @returns Promise<boolean> indicating if push notifications were successfully enabled
   */
  async enablePushNotifications(): Promise<boolean> {
    try {
      // Step 1: Request permissions
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        return false;
      }

      // Step 2: Register device and get token
      const token = await this.registerDevice();
      
      if (!token) {
        return false;
      }

      // Step 3: Get platform type
      const platformType = this.getPlatform();
      
      // Step 4: Send token to backend
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, {
          fcmToken: token,
          platform: platformType
        })
      );

      // Step 5: Setup notification listeners
      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    }
  }

  /**
   * Disable push notifications
   * Sends deactivation request to backend and clears current token
   */
  async disablePushNotifications(): Promise<void> {
    try {
      if (!this.currentToken) {
        return;
      }

      await firstValueFrom(
        this.http.post(`${this.apiUrl}/deactivate`, {
          fcmToken: this.currentToken
        })
      );

      this.currentToken = null;
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      throw error;
    }
  }

  /**
   * Setup notification listeners based on platform
   */
  private setupNotificationListeners(): void {
    if (this.platform.is('capacitor')) {
      this.setupCapacitorListeners();
    } else {
      this.setupWebListeners();
    }
  }

  /**
   * Setup listeners for Capacitor Push Notifications
   */
  private setupCapacitorListeners(): void {
    // Notification received while app is in foreground
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received:', notification);
        // Could show in-app notification here
      }
    );

    // Notification tapped by user
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        const data = notification.notification.data;
        this.handleNotificationTap(data);
      }
    );
  }

  /**
   * Setup listeners for Firebase Messaging (web)
   */
  private setupWebListeners(): void {
    if (!this.messaging) {
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      // Could show in-app notification here
    });
  }

  /**
   * Handle notification tap event
   * Navigates to the appropriate content based on notification data
   */
  private handleNotificationTap(data: any): void {
    if (data.requestId) {
      // Navigate to the request detail page
      window.location.href = `/employee/requests/${data.requestId}`;
    }
  }

  /**
   * Send a test notification to verify push notifications are working
   */
  async sendTestNotification(): Promise<void> {
    try {
      if (!this.currentToken) {
        throw new Error('No token available');
      }

      await firstValueFrom(
        this.http.post(`${this.apiUrl}/test`, {
          fcmToken: this.currentToken
        })
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get current push notification status
   */
  async getStatus(): Promise<PushSettingsResponse> {
    try {
      if (!this.currentToken) {
        return {
          enabled: false,
          platform: this.getPlatform(),
          permissionStatus: 'default'
        };
      }

      return await firstValueFrom(
        this.http.get<PushSettingsResponse>(`${this.apiUrl}/status`, {
          params: { fcmToken: this.currentToken }
        })
      );
    } catch (error) {
      console.error('Error getting status:', error);
      return {
        enabled: false,
        platform: this.getPlatform(),
        permissionStatus: 'default'
      };
    }
  }

  /**
   * Get current platform type
   */
  private getPlatform(): PlatformType {
    if (this.platform.is('android')) {
      return PlatformType.ANDROID;
    } else if (this.platform.is('ios')) {
      return PlatformType.IOS;
    } else {
      return PlatformType.WEB;
    }
  }

  /**
   * Deactivate all tokens on logout
   */
  async onLogout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/logout`, {})
      );
      this.currentToken = null;
    } catch (error) {
      console.error('Error on logout:', error);
      throw error;
    }
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }
}
