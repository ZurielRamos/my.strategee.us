import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { PasswordVaultService } from '../../services/password-vault.service';
import { Vault } from '../../models/vault.model';
import { VisibilityLevel } from '../../models/visibility.model';
import { VisibilitySelectorComponent } from '../visibility-selector/visibility-selector.component';

@Component({
  selector: 'app-vault-form-modal',
  templateUrl: './vault-form-modal.component.html',
  styleUrls: ['./vault-form-modal.component.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseModalComponent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    VisibilitySelectorComponent
  ]
})
export class VaultFormModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() vault?: Vault;
  @Input() parentId?: string;
  @Input() parentName?: string;

  form!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastService: ToastService,
    private vaultService: PasswordVaultService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      visibilityLevel: [VisibilityLevel.INHERIT],
      companyIds: [[]],
      areaIds: [[]],
      positionIds: [[]],
      employeeIds: [[]]
    });

    if (this.mode === 'edit' && this.vault) {
      // Cargar vault fresco del backend con relaciones de visibilidad completas
      try {
        const freshVault = await firstValueFrom(this.vaultService.getVault(this.vault.id));
        this.vault = freshVault;
      } catch (e) {
        // Si falla, usar los datos que ya tenemos
      }

      this.form.patchValue({
        name: this.vault.name,
        description: this.vault.description || '',
        visibilityLevel: this.vault.visibilityLevel || VisibilityLevel.INHERIT,
        companyIds: this.vault.visibilityCompanies?.map(vc => vc.companyId) || [],
        areaIds: this.vault.visibilityAreas?.map(va => va.areaId) || [],
        positionIds: this.vault.visibilityPositions?.map(vp => vp.positionId) || [],
        employeeIds: this.vault.visibilityEmployees?.map(ve => ve.employeeId) || []
      });
    }
  }

  get title(): string {
    if (this.mode === 'create') {
      return this.parentName ? `Nueva Sub-carpeta en "${this.parentName}"` : 'Crear Vault';
    }
    return 'Editar Vault';
  }

  async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formValue = this.form.value;
        if (this.mode === 'create') {
          const dto = {
            ...formValue,
            ...(this.parentId ? { parentId: this.parentId } : {})
          };
          await firstValueFrom(this.vaultService.createVault(dto));
          await this.toastService.success('Vault creado exitosamente');
        } else if (this.vault) {
          await firstValueFrom(this.vaultService.updateVault(this.vault.id, formValue));
          await this.toastService.success('Vault actualizado exitosamente');
        }
        this.modalCtrl.dismiss(null, 'save');
      } catch (error: any) {
        await this.toastService.error(
          error.message || 'Error al guardar el vault'
        );
        this.isSubmitting = false;
      }
    }
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }
}
