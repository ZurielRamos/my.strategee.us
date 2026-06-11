import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AdditionalElement } from '../../models';
import { InventoryAdminService } from '../../services/inventory-admin.service';

@Component({
    selector: 'app-additional-element-modal',
    templateUrl: './additional-element-modal.component.html',
    styleUrls: ['./additional-element-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent
    ]
})
export class AdditionalElementModalComponent implements OnInit {
    @Input() element?: AdditionalElement;
    @Input() mode: 'create' | 'edit' = 'create';

    elementForm!: FormGroup;
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
        this.elementForm = this.fb.group({
            name: [this.element?.name || '', [Validators.required, Validators.maxLength(100)]]
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Elemento Adicional' : 'Nuevo Elemento Adicional';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.elementForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const operation = this.mode === 'edit' && this.element?.id
                ? this.inventoryService.updateAdditionalElement(this.element.id, this.elementForm.value)
                : this.inventoryService.createAdditionalElement(this.elementForm.value);

            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Elemento actualizado correctamente'
                        : 'Elemento creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al guardar el elemento'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
