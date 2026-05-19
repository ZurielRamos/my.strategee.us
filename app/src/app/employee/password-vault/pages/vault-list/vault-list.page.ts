import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonFab, IonFabButton, IonIcon, IonButton, IonSpinner, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { Vault } from '../../models/vault.model';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../../../shared/components/page-title/page-title.component';
import { VaultCardComponent } from '../../components/vault-card/vault-card.component';
import { VaultFormModalComponent } from '../../components/vault-form-modal/vault-form-modal.component';

@Component({
  selector: 'app-vault-list',
  templateUrl: './vault-list.page.html',
  styleUrls: ['./vault-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButton,
    IonSpinner,
    PageHeaderComponent,
    PageTitleComponent,
    VaultCardComponent
  ]
})
export class VaultListPage implements OnInit {
  vaults: Vault[] = [];
  loading = false;
  currentEmployeeId?: string;

  constructor(
    private vaultService: PasswordVaultService,
    private modalService: ModalService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ addOutline });
  }

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentEmployeeId = currentUser?.employeeId || undefined;
    await this.loadVaults();
  }

  async loadVaults() {
    this.loading = true;
    try {
      this.vaults = await firstValueFrom(this.vaultService.getVaults());
      // Sort alphabetically by name
      this.vaults.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error loading vaults:', error);
      await this.toastService.error('Error al cargar los vaults');
    } finally {
      this.loading = false;
    }
  }

  async openCreateModal() {
    const result = await this.modalService.open(
      VaultFormModalComponent,
      { mode: 'create' }
    );

    if (result.role === 'save') {
      await this.loadVaults();
    }
  }

  async openEditModal(vault: Vault) {
    const result = await this.modalService.open(
      VaultFormModalComponent,
      { mode: 'edit', vault }
    );

    if (result.role === 'save') {
      await this.loadVaults();
    }
  }

  async deleteVault(vault: Vault) {
    const alert = await this.alertController.create({
      header: 'Eliminar Vault',
      message: `¿Estás seguro de que deseas eliminar el vault "${vault.name}"? Solo se pueden eliminar vaults vacíos.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.vaultService.deleteVault(vault.id));
              await this.toastService.success('Vault eliminado exitosamente');
              await this.loadVaults();
            } catch (error: any) {
              if (error.status === 409) {
                await this.toastService.error('El vault debe estar vacío para eliminarlo');
              } else {
                await this.toastService.error('Error al eliminar el vault');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  navigateToCredentials(vaultId?: string) {
    if (vaultId) {
      this.router.navigate(['/employee/password-vault/credentials'], {
        queryParams: { vaultId }
      });
    } else {
      this.router.navigate(['/employee/password-vault/credentials']);
    }
  }

  isOwner(vault: Vault): boolean {
    return vault.ownerId === this.currentEmployeeId;
  }
}
