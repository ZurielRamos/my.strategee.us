import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { Maintenance } from '../../models';

@Component({
    selector: 'app-maintenance-modal',
    templateUrl: './maintenance-modal.component.html',
    styleUrls: ['./maintenance-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        TextareaInputComponent
    ]
})
export class MaintenanceModalComponent implements OnInit {
    @Input() inventoryId!: string;
    @Input() maintenance?: Maintenance;
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
            maintenanceDate: [this.maintenance?.maintenanceDate || '', [Validators.required]],
            observations: [this.maintenance?.observations || '', [Validators.required, Validators.maxLength(500)]]
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const dto = {
                inventoryId: this.inventoryId,
                maintenanceDate: this.form.value.maintenanceDate,
                observations: this.form.value.observations
            };

            const operation = this.mode === 'edit' && this.maintenance?.id
                ? this.inventoryService.updateMaintenance(this.maintenance.id, dto)
                : this.inventoryService.createMaintenance(dto);

            operation.subscribe({
                next: async () => {
                    const message = this.mode === 'edit'
                        ? 'Mantenimiento actualizado correctamente'
                        : 'Mantenimiento creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(null, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al guardar el mantenimiento'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
