import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonLabel,
  IonItem,
  IonToggle,
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { PushNotificationService } from '../../../../services/push-notification.service';

@Component({
  selector: 'app-push-settings',
  templateUrl: './push-settings.component.html',
  styleUrls: ['./push-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonLabel,
    IonItem,
    IonToggle,
    IonIcon
  ]
})
export class PushSettingsComponent implements OnInit {
  pushEnabled = false;
  loading = false;
  lastNotificationAt: Date | null = null;

  constructor(
    private pushService: PushNotificationService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ notificationsOutline });
  }

  async ngOnInit() {
    await this.loadStatus();
  }

  async loadStatus() {
    try {
      const status = await this.pushService.getStatus();
      this.pushEnabled = status.enabled;
      this.lastNotificationAt = status.lastNotificationAt ?? null;
    } catch (error) {
      console.error('Error loading push status:', error);
    }
  }

  async togglePushNotifications(event: any) {
    const enabled = event.detail.checked;
    this.loading = true;

    try {
      if (enabled) {
        const success = await this.pushService.enablePushNotifications();
        
        if (success) {
          this.pushEnabled = true;
          await this.showToast('Notificaciones push activadas', 'success');
        } else {
          this.pushEnabled = false;
          event.target.checked = false;
          await this.showPermissionDeniedAlert();
        }
      } else {
        await this.pushService.disablePushNotifications();
        this.pushEnabled = false;
        await this.showToast('Notificaciones push desactivadas', 'warning');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      this.pushEnabled = false;
      event.target.checked = false;
      await this.showToast('Error al cambiar configuración', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async sendTestNotification() {
    this.loading = true;

    try {
      await this.pushService.sendTestNotification();
      await this.showToast('Notificación de prueba enviada', 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      await this.showToast('Error al enviar notificación de prueba', 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async showPermissionDeniedAlert() {
    const alert = await this.alertController.create({
      header: 'Permiso Denegado',
      message: 'Para recibir notificaciones push, debes habilitar los permisos en la configuración de tu dispositivo.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Abrir Configuración',
          handler: () => {
            // Abrir configuración del dispositivo
            // Implementación específica por plataforma
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });

    await toast.present();
  }
}
