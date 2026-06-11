import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { Supplier } from '../../models/supplier.model';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-supplier-modal',
    templateUrl: './supplier-modal.component.html',
    styleUrls: ['./supplier-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        TextareaInputComponent
    ]
})
export class SupplierModalComponent implements OnInit {
    @Input() supplier?: Supplier;
    @Input() mode: 'create' | 'edit' = 'create';

    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private inventoryService: InventoryAdminService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.form = this.fb.group({
            name: [this.supplier?.name || '', [Validators.required, Validators.maxLength(150)]],
            phone: [this.supplier?.phone || '', [Validators.required, Validators.maxLength(20)]],
            email: [this.supplier?.email || '', [Validators.required, Validators.email, Validators.maxLength(100)]],
            contactPerson: [this.supplier?.contactPerson || '', [Validators.required, Validators.maxLength(150)]],
            address: [this.supplier?.address || '', [Validators.maxLength(255)]],
            observations: [this.supplier?.observations || '', [Validators.maxLength(500)]]
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Proveedor' : 'Nuevo Proveedor';
    }

    // Error getters for template
    getError(field: string): string | null {
        const control = this.form.get(field);
        if (!control || !control.touched || !control.errors) return null;

        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un email válido';
        if (control.errors['maxlength']) {
            const max = control.errors['maxlength'].requiredLength;
            return `Máximo ${max} caracteres`;
        }
        return null;
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        // Mark all fields as touched to show validation errors
        this.form.markAllAsTouched();

        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            const formData = { ...this.form.value };

            // Clean optional empty fields
            if (!formData.address) formData.address = null;
            if (!formData.observations) formData.observations = null;

            const operation = this.mode === 'edit' && this.supplier
                ? this.inventoryService.updateSupplier(this.supplier.id, formData)
                : this.inventoryService.createSupplier(formData);

            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Proveedor actualizado correctamente'
                        : 'Proveedor creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    let errorMessage = 'Error al procesar la solicitud';
                    if (error.error?.message) {
                        errorMessage = Array.isArray(error.error.message)
                            ? error.error.message.join(', ')
                            : error.error.message;
                    }
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }
}
