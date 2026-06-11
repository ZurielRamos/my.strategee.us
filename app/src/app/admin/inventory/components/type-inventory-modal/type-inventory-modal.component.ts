import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { TypeInventory } from '../../models/type-inventory.model';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-type-inventory-modal',
    templateUrl: './type-inventory-modal.component.html',
    styleUrls: ['./type-inventory-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent
    ]
})
export class TypeInventoryModalComponent implements OnInit {
    @Input() typeInventory?: TypeInventory;
    @Input() mode: 'create' | 'edit' = 'create';

    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private inventoryAdminService: InventoryAdminService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.form = this.fb.group({
            name: [this.typeInventory?.name ?? '', [Validators.required, Validators.maxLength(100)]],
            denomination: [this.typeInventory?.denomination ?? '', [Validators.maxLength(255)]]
        });
    }

    get title(): string {
        return this.mode === 'create' ? 'Nuevo Tipo de Inventario' : 'Editar Tipo de Inventario';
    }

    get subtitle(): string {
        return this.mode === 'create'
            ? 'Complete los campos para crear el tipo de inventario'
            : 'Modifique los campos que desea actualizar';
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    onConfirm() {
        if (!this.form.valid || this.isSubmitting) return;

        this.isSubmitting = true;
        const formValue = this.form.value;

        const payload: Partial<TypeInventory> = {
            name: formValue.name.trim(),
            denomination: formValue.denomination?.trim() || null
        };

        const operation = this.mode === 'edit' && this.typeInventory
            ? this.inventoryAdminService.updateTypeInventory(this.typeInventory.id, payload)
            : this.inventoryAdminService.createTypeInventory(payload);

        operation.subscribe({
            next: (result) => {
                const message = this.mode === 'edit'
                    ? 'Tipo de inventario actualizado correctamente'
                    : 'Tipo de inventario creado correctamente';
                this.toastService.success(message);
                this.modalCtrl.dismiss(result, 'save');
            },
            error: (error) => {
                let errorMessage = 'Error al procesar la solicitud';
                if (error.error?.message) {
                    errorMessage = Array.isArray(error.error.message)
                        ? error.error.message.join(', ')
                        : error.error.message;
                }
                this.toastService.error(errorMessage);
                this.isSubmitting = false;
            }
        });
    }
}
