import { Injectable } from '@angular/core';
import { ToastService } from '../../../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  constructor(private toastService: ToastService) {}

  async copy(text: string, successMessage = 'Copiado al portapapeles'): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      await this.toastService.success(successMessage);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      await this.toastService.error('Error al copiar al portapapeles');
      return false;
    }
  }

  async copyUsername(username: string): Promise<boolean> {
    return this.copy(username, 'Usuario copiado');
  }

  async copyPassword(password: string): Promise<boolean> {
    return this.copy(password, 'Contraseña copiada');
  }
}
