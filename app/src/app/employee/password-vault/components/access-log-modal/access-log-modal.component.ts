import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { IonSpinner } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AccessLog } from '../../models/access-log.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-access-log-modal',
  templateUrl: './access-log-modal.component.html',
  styleUrls: ['./access-log-modal.component.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    CommonModule,
    BaseModalComponent,
    IonSpinner
  ]
})
export class AccessLogModalComponent implements OnInit {
  @Input() credentialId!: string;

  accessLogs: AccessLog[] = [];
  loading = false;

  constructor(
    private passwordVaultService: PasswordVaultService,
    private toastService: ToastService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.loadAccessLogs();
  }

  async loadAccessLogs() {
    this.loading = true;
    try {
      const logs = await firstValueFrom(
        this.passwordVaultService.getAccessLogs(this.credentialId)
      );
      // Sort by date descending (most recent first)
      this.accessLogs = logs.sort((a, b) => 
        new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
      );
    } catch (error: any) {
      console.error('Error loading access logs:', error);
      await this.toastService.error('Error al cargar el historial de accesos');
    } finally {
      this.loading = false;
    }
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

  getEmployeeName(log: AccessLog): string {
    return `${log.employee.firstName} ${log.employee.lastName}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
