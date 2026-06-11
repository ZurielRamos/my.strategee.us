import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { Software } from '../../models';
import { InventoryAdminService } from '../../services/inventory-admin.service';

@Component({
    selector: 'app-software-modal',
    templateUrl: './software-modal.component.html',
    styleUrls: ['./software-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent
    ]
})
export class SoftwareModalComponent implements OnInit {
    @Input() software?: Software;
    @Input() mode: 'create' | 'edit' = 'create';

    softwareForm!: FormGroup;
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
        this.softwareForm = this.fb.group({
            name: [this.software?.name || '', [Validators.required, Validators.maxLength(150)]]
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Software' : 'Nuevo Software';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.softwareForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const operation = this.mode === 'edit' && this.software?.id
                ? this.inventoryService.updateSoftware(this.software.id, this.softwareForm.value)
                : this.inventoryService.createSoftware(this.softwareForm.value);

            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Software actualizado correctamente'
                        : 'Software creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al guardar el software'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
