import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { VisibilitySelectorComponent } from '../visibility-selector/visibility-selector.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { PasswordVaultService } from '../../services/password-vault.service';
import { Credential } from '../../models/credential.model';
import { VisibilityLevel } from '../../models/visibility.model';

@Component({
  selector: 'app-credential-form-modal',
  templateUrl: './credential-form-modal.component.html',
  styleUrls: ['./credential-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseModalComponent,
    TextInputComponent,
    TextareaInputComponent,
    VisibilitySelectorComponent
  ]
})
export class CredentialFormModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() credential?: Credential;
  @Input() preselectedVaultId?: string;

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
      vaultId: [''],
      url: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      title: ['', Validators.maxLength(200)],
      logoId: [''],
      notes: [''],
      directLoginUrl: [''],
      visibilityLevel: [VisibilityLevel.PRIVATE, Validators.required],
      companyIds: [[]],
      areaIds: [[]],
      positionIds: [[]],
      employeeIds: [[]]
    });

    if (this.mode === 'edit' && this.credential) {
      this.form.patchValue({
        vaultId: this.credential.vaultId,
        url: this.credential.url,
        username: this.credential.username,
        password: this.credential.password,
        title: this.credential.title || '',
        logoId: this.credential.logoId || '',
        notes: this.credential.notes || '',
        directLoginUrl: this.credential.directLoginUrl || '',
        visibilityLevel: this.credential.visibilityLevel,
        employeeIds: this.credential.visibilityEmployees?.map(ve => ve.employee.id) ?? []
      });
    }
  }

  get title(): string {
    return this.mode === 'create' ? 'Crear Credencial' : 'Editar Credencial';
  }

  async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formValue = this.form.value;
        
        // Clean up empty optional fields
        const dto = {
          ...formValue,
          vaultId: this.mode === 'create' ? this.preselectedVaultId : formValue.vaultId,
          title: formValue.title || undefined,
          logoId: formValue.logoId || undefined,
          notes: formValue.notes || undefined,
          directLoginUrl: formValue.directLoginUrl || undefined,
          companyIds: formValue.companyIds?.length > 0 ? formValue.companyIds : undefined,
          areaIds: formValue.areaIds?.length > 0 ? formValue.areaIds : undefined,
          positionIds: formValue.positionIds?.length > 0 ? formValue.positionIds : undefined,
          employeeIds: formValue.employeeIds?.length > 0 ? formValue.employeeIds : undefined
        };

        if (this.mode === 'create') {
          await firstValueFrom(this.vaultService.createCredential(dto));
          await this.toastService.success('Credencial creada exitosamente');
        } else if (this.credential) {
          await firstValueFrom(this.vaultService.updateCredential(this.credential.id, dto));
          await this.toastService.success('Credencial actualizada exitosamente');
        }
        
        this.modalCtrl.dismiss(null, 'save');
      } catch (error: any) {
        await this.toastService.error(
          error.message || 'Error al guardar la credencial'
        );
        this.isSubmitting = false;
      }
    }
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }
}
