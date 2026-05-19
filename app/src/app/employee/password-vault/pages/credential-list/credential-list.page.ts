import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonContent, 
  IonSearchbar, 
  IonFab, 
  IonFabButton, 
  IonIcon, 
  IonButton, 
  IonSpinner, 
  IonSelect, 
  IonSelectOption 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, filterOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { CredentialListItem } from '../../models/credential.model';
import { Vault } from '../../models/vault.model';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../../../shared/components/page-title/page-title.component';
import { CredentialCardComponent } from '../../components/credential-card/credential-card.component';
import { CredentialFormModalComponent } from '../../components/credential-form-modal/credential-form-modal.component';
// TODO: Import this component when it is implemented (Task 8)
// import { CredentialDetailModalComponent } from '../../components/credential-detail-modal/credential-detail-modal.component';

@Component({
  selector: 'app-credential-list',
  templateUrl: './credential-list.page.html',
  styleUrls: ['./credential-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSearchbar,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButton,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    PageHeaderComponent,
    PageTitleComponent,
    CredentialCardComponent
  ]
})
export class CredentialListPage implements OnInit {
  credentials: CredentialListItem[] = [];
  vaults: Vault[] = [];
  loading = false;
  searchTerm = '';
  selectedVaultId?: string;
  currentEmployeeId?: string;

  constructor(
    private vaultService: PasswordVaultService,
    private modalService: ModalService,
    private toastService: ToastService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ addOutline, filterOutline });
  }

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentEmployeeId = currentUser?.employeeId || undefined;
    
    // Subscribe to query params to handle vault filter
    this.route.queryParams.subscribe(params => {
      this.selectedVaultId = params['vaultId'];
      this.loadCredentials();
    });

    await this.loadVaults();
  }

  async loadVaults() {
    try {
      this.vaults = await firstValueFrom(this.vaultService.getVaults());
      // Sort alphabetically by name
      this.vaults.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error loading vaults:', error);
    }
  }

  async loadCredentials() {
    this.loading = true;
    try {
      this.credentials = await firstValueFrom(
        this.vaultService.getCredentials({
          vaultId: this.selectedVaultId,
          search: this.searchTerm || undefined
        })
      );
      // Sort by creation date descending (most recent first)
      this.credentials.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error loading credentials:', error);
      await this.toastService.error('Error al cargar las credenciales');
    } finally {
      this.loading = false;
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.loadCredentials();
  }

  onVaultFilterChange(event: any) {
    this.selectedVaultId = event.detail.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vaultId: this.selectedVaultId || null },
      queryParamsHandling: 'merge'
    });
  }

  async openCreateModal() {
    const result = await this.modalService.open(
      CredentialFormModalComponent,
      { mode: 'create', vaults: this.vaults }
    );
    
    if (result.role === 'save') {
      await this.loadCredentials();
    }
  }

  async openDetailModal(credential: CredentialListItem) {
    // TODO: Implement when CredentialDetailModalComponent is created (Task 8)
    await this.toastService.info('Funcionalidad de detalle de credencial próximamente disponible');
    // const result = await this.modalService.open(
    //   CredentialDetailModalComponent,
    //   { credentialId: credential.id }
    // );
    // if (result.role === 'refresh') {
    //   await this.loadCredentials();
    // }
  }

  isOwner(credential: CredentialListItem): boolean {
    return credential.ownerId === this.currentEmployeeId;
  }

  getSelectedVaultName(): string {
    if (!this.selectedVaultId) {
      return 'Todos los vaults';
    }
    const vault = this.vaults.find(v => v.id === this.selectedVaultId);
    return vault ? vault.name : 'Todos los vaults';
  }
}
