import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { Inventory } from '../../models/inventory.model';
import { TypeInventory } from '../../models/type-inventory.model';
import { Supplier } from '../../models/supplier.model';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-inventory-modal',
    templateUrl: './inventory-modal.component.html',
    styleUrls: ['./inventory-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        TextareaInputComponent,
        DateInputComponent,
        FormSelectComponent
    ]
})
export class InventoryModalComponent implements OnInit {
    @Input() inventory?: Inventory;
    @Input() mode: 'create' | 'edit' = 'create';

    form!: FormGroup;
    isSubmitting = false;

    typeOptions: SelectOption[] = [];
    supplierOptions: SelectOption[] = [];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private inventoryAdminService: InventoryAdminService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
        this.loadTypeInventories();
        this.loadSuppliers();
    }

    initForm() {
        this.form = this.fb.group({
            name: [this.inventory?.name ?? '', [Validators.required, Validators.maxLength(200)]],
            typeInventoryId: [this.inventory?.typeInventoryId ?? '', [Validators.required]],
            value: [this.inventory?.value ?? null, [Validators.required, Validators.min(0.01)]],
            supplierId: [this.inventory?.supplierId ?? ''],
            purchaseDate: [this.inventory?.purchaseDate ?? ''],
            observations: [this.inventory?.observations ?? '', [Validators.maxLength(500)]]
        });
    }

    loadTypeInventories() {
        this.inventoryAdminService.getTypeInventories(1, 100).subscribe({
            next: (response) => {
                this.typeOptions = response.data
                    .filter((type: TypeInventory) => type.isActive)
                    .map((type: TypeInventory) => ({
                        value: type.id,
                        label: type.name
                    }));
            },
            error: () => {
                this.toastService.error('Error al cargar tipos de inventario');
            }
        });
    }

    loadSuppliers() {
        this.inventoryAdminService.getSuppliers(1, 100).subscribe({
            next: (response) => {
                this.supplierOptions = response.data
                    .filter((supplier: Supplier) => supplier.isActive)
                    .map((supplier: Supplier) => ({
                        value: supplier.id,
                        label: supplier.name
                    }));
            },
            error: () => {
                this.toastService.error('Error al cargar proveedores');
            }
        });
    }

    get title(): string {
        return this.mode === 'create' ? 'Nuevo Activo' : 'Editar Activo';
    }

    get subtitle(): string {
        return this.mode === 'create'
            ? 'Complete los campos para crear el activo'
            : 'Modifique los campos que desea actualizar';
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    onConfirm() {
        if (!this.form.valid || this.isSubmitting) return;

        this.isSubmitting = true;
        const formValue = this.form.value;

        const payload: Partial<Inventory> = {
            name: formValue.name.trim(),
            typeInventoryId: formValue.typeInventoryId,
            value: Number(formValue.value),
            supplierId: formValue.supplierId || null,
            purchaseDate: formValue.purchaseDate || null,
            observations: formValue.observations?.trim() || null
        };

        const operation = this.mode === 'edit' && this.inventory
            ? this.inventoryAdminService.updateInventory(this.inventory.id, payload)
            : this.inventoryAdminService.createInventory(payload);

        operation.subscribe({
            next: (result) => {
                const message = this.mode === 'edit'
                    ? 'Activo actualizado correctamente'
                    : 'Activo creado correctamente';
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
