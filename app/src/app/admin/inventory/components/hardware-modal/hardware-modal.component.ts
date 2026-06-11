import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { Hardware } from '../../models';
import { InventoryAdminService } from '../../services/inventory-admin.service';

@Component({
    selector: 'app-hardware-modal',
    templateUrl: './hardware-modal.component.html',
    styleUrls: ['./hardware-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent
    ]
})
export class HardwareModalComponent implements OnInit {
    @Input() hardware?: Hardware;
    @Input() mode: 'create' | 'edit' = 'create';

    hardwareForm!: FormGroup;
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
        this.hardwareForm = this.fb.group({
            name: [this.hardware?.name || '', [Validators.required, Validators.maxLength(100)]]
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Hardware' : 'Nuevo Hardware';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.hardwareForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const operation = this.mode === 'edit' && this.hardware?.id
                ? this.inventoryService.updateHardware(this.hardware.id, this.hardwareForm.value)
                : this.inventoryService.createHardware(this.hardwareForm.value);

            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Hardware actualizado correctamente'
                        : 'Hardware creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al guardar el hardware'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
