import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { PasswordVaultService } from '../../services/password-vault.service';
import { Vault } from '../../models/vault.model';

@Component({
  selector: 'app-vault-form-modal',
  templateUrl: './vault-form-modal.component.html',
  styleUrls: ['./vault-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseModalComponent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea
  ]
})
export class VaultFormModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() vault?: Vault;

  form!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastService: ToastService,
    private vaultService: PasswordVaultService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['']
    });

    if (this.mode === 'edit' && this.vault) {
      this.form.patchValue({
        name: this.vault.name,
        description: this.vault.description || ''
      });
    }
  }

  get title(): string {
    return this.mode === 'create' ? 'Crear Vault' : 'Editar Vault';
  }

  async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        if (this.mode === 'create') {
          await firstValueFrom(this.vaultService.createVault(this.form.value));
          await this.toastService.success('Vault creado exitosamente');
        } else if (this.vault) {
          await firstValueFrom(this.vaultService.updateVault(this.vault.id, this.form.value));
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
