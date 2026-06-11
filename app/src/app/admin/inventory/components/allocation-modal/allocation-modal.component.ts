import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { InventoryAllocation } from '../../models/inventory-allocation.model';
import { Inventory } from '../../models/inventory.model';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { EmployeesService } from '../../../../admin/employees/services/employees.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-allocation-modal',
    templateUrl: './allocation-modal.component.html',
    styleUrls: ['./allocation-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        IonItem,
        IonLabel,
        IonInput
    ]
})
export class AllocationModalComponent implements OnInit {
    @Input() allocation?: InventoryAllocation;
    @Input() mode: 'create' | 'edit' = 'create';

    form!: FormGroup;
    isSubmitting = false;

    assetOptions: SelectOption[] = [];
    employeeOptions: SelectOption[] = [];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private inventoryAdminService: InventoryAdminService,
        private employeesService: EmployeesService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
        this.loadEmployees();

        if (this.mode === 'create') {
            this.loadAvailableAssets();
        }
    }

    initForm() {
        this.form = this.fb.group({
            inventoryId: [
                { value: this.allocation?.inventoryId ?? '', disabled: this.mode === 'edit' },
                this.mode === 'create' ? [Validators.required] : []
            ],
            employeeId: [this.allocation?.employeeId ?? '', [Validators.required]]
        });
    }

    loadAvailableAssets() {
        this.inventoryAdminService.getInventories(1, 200).subscribe({
            next: (response) => {
                this.assetOptions = response.data
                    .filter((asset: Inventory) => asset.isActive && !asset.allocation)
                    .map((asset: Inventory) => ({
                        value: asset.id,
                        label: asset.name
                    }));
            },
            error: () => {
                this.toastService.error('Error al cargar activos disponibles');
            }
        });
    }

    loadEmployees() {
        this.employeesService.getAll(1, 200, '', undefined, 'ACTIVE').subscribe({
            next: (response) => {
                this.employeeOptions = response.data.map((emp: any) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`
                }));
            },
            error: () => {
                this.toastService.error('Error al cargar empleados');
            }
        });
    }

    get title(): string {
        return this.mode === 'create' ? 'Nueva Asignación' : 'Editar Asignación';
    }

    get subtitle(): string {
        return this.mode === 'create'
            ? 'Seleccione el activo y el empleado para la asignación'
            : 'Modifique el empleado asignado';
    }

    get currentAssetName(): string {
        return this.allocation?.inventory?.name ?? '';
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    onConfirm() {
        if (!this.form.valid || this.isSubmitting) return;

        this.isSubmitting = true;
        const formValue = this.form.getRawValue();

        const payload: Partial<InventoryAllocation> = {
            employeeId: formValue.employeeId
        };

        if (this.mode === 'create') {
            payload.inventoryId = formValue.inventoryId;
        }

        const operation = this.mode === 'edit' && this.allocation
            ? this.inventoryAdminService.updateAllocation(this.allocation.id, payload)
            : this.inventoryAdminService.createAllocation(payload);

        operation.subscribe({
            next: (result) => {
                const message = this.mode === 'edit'
                    ? 'Asignación actualizada correctamente'
                    : 'Asignación creada correctamente';
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
