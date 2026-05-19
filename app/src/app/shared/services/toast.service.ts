import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  /**
   * Muestra un toast con el mensaje y tipo especificado
   * Acepta tanto un string como un objeto ToastOptions
   */
  async show(messageOrOptions: string | ToastOptions): Promise<void> {
    // Si es un string, convertirlo a ToastOptions
    const options: ToastOptions = typeof messageOrOptions === 'string'
      ? { message: messageOrOptions }
      : messageOrOptions;

    const {
      message,
      type = 'info',
      duration = 3000,
      position = 'bottom'
    } = options;

    const toast = await this.toastController.create({
      message,
      duration,
      position,
      color: this.getColor(type),
      cssClass: `toast-${type}`,
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  /**
   * Muestra un toast de éxito
   */
  async success(message: string, duration = 3000): Promise<void> {
    await this.show({ message, type: 'success', duration });
  }

  /**
   * Muestra un toast de error
   */
  async error(message: string, duration = 4000): Promise<void> {
    await this.show({ message, type: 'error', duration });
  }

  /**
   * Muestra un toast de advertencia
   */
  async warning(message: string, duration = 3500): Promise<void> {
    await this.show({ message, type: 'warning', duration });
  }

  /**
   * Muestra un toast informativo
   */
  async info(message: string, duration = 3000): Promise<void> {
    await this.show({ message, type: 'info', duration });
  }

  /**
   * Obtiene el color de Ionic según el tipo de toast
   */
  private getColor(type: ToastType): string {
    const colors: Record<ToastType, string> = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'primary'
    };
    return colors[type];
  }
}
