import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  copyOutline, 
  createOutline, 
  trashOutline, 
  timeOutline,
  openOutline,
  personOutline,
  personCircleOutline,
  folderOutline
} from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { PasswordDisplayComponent } from '../password-display/password-display.component';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ClipboardService } from '../../services/clipboard.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { Credential } from '../../models/credential.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-credential-detail-modal',
  templateUrl: './credential-detail-modal.component.html',
  styleUrls: ['./credential-detail-modal.component.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    CommonModule,
    BaseModalComponent,
    PasswordDisplayComponent,
    IonButton,
    IonIcon,
    IonSpinner
  ]
})
export class CredentialDetailModalComponent implements OnInit {
  @Input() credentialId!: string;

  credential?: Credential;
  loading = false;
  currentEmployeeId?: string;

  constructor(
    private passwordVaultService: PasswordVaultService,
    private clipboardService: ClipboardService,
    private modalService: ModalService,
    private toastService: ToastService,
    private authService: AuthService,
    private modalCtrl: ModalController
  ) {
    addIcons({ 
      copyOutline, 
      createOutline, 
      trashOutline, 
      timeOutline,
      openOutline,
      personOutline,
      personCircleOutline,
      folderOutline
    });
  }

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentEmployeeId = currentUser?.employeeId || undefined;
    await this.loadCredential();
  }

  async loadCredential() {
    this.loading = true;
    try {
      this.credential = await firstValueFrom(
        this.passwordVaultService.getCredential(this.credentialId)
      );
    } catch (error: any) {
      console.error('Error loading credential:', error);
      
      if (error.status === 403) {
        await this.toastService.error('No tienes permisos para ver esta credencial');
      } else {
        await this.toastService.error('Error al cargar la credencial');
      }
      
      this.modalCtrl.dismiss();
    } finally {
      this.loading = false;
    }
  }

  async copyUsername() {
    if (this.credential?.username) {
      await this.clipboardService.copyUsername(this.credential.username);
    }
  }

  async copyPassword() {
    if (this.credential?.password) {
      await this.clipboardService.copyPassword(this.credential.password);
    }
  }

  isOwner(): boolean {
    return this.credential?.ownerId === this.currentEmployeeId;
  }

  async openEditModal() {
    // Import dynamically to avoid circular dependencies
    const { CredentialFormModalComponent } = await import('../credential-form-modal/credential-form-modal.component');
    
    const result = await this.modalService.open(
      CredentialFormModalComponent,
      { mode: 'edit', credential: this.credential }
    );

    if (result.role === 'save') {
      await this.loadCredential();
    }
  }

  async deleteCredential() {
    if (!this.credential) return;

    // Show confirmation modal
    const confirmed = await this.showDeleteConfirmation();
    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.passwordVaultService.deleteCredential(this.credential.id)
      );
      await this.toastService.success('Credencial eliminada exitosamente');
      this.modalCtrl.dismiss(null, 'refresh');
    } catch (error: any) {
      console.error('Error deleting credential:', error);
      await this.toastService.error('Error al eliminar la credencial');
    }
  }

  async openAccessLogModal() {
    if (!this.credential) return;

    // Import dynamically to avoid circular dependencies
    const { AccessLogModalComponent } = await import('../access-log-modal/access-log-modal.component');
    
    await this.modalService.open(
      AccessLogModalComponent,
      { credentialId: this.credential.id }
    );
  }

  private async showDeleteConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = confirm(
        '¿Estás seguro de que deseas eliminar esta credencial? Esta acción no se puede deshacer.'
      );
      resolve(confirmed);
    });
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

  getDisplayTitle(): string {
    return this.credential?.title || 'Credencial';
  }

  getOwnerName(): string {
    if (!this.credential?.owner) return '';
    return `${this.credential.owner.firstName} ${this.credential.owner.lastName}`;
  }

  getVisibilityEmployees() {
    return this.credential?.visibilityEmployees?.map(ve => ve.employee) ?? [];
  }

  hasValidLogo(): boolean {
    return !!(this.credential?.logo?.url && this.credential.logo.url.trim());
  }
}
