import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { AdditionalElement } from '../../models';

@Component({
    selector: 'app-allocation-element-modal',
    templateUrl: './allocation-element-modal.component.html',
    styleUrls: ['./allocation-element-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        IonSelect,
        IonSelectOption
    ]
})
export class AllocationElementModalComponent implements OnInit {
    @Input() allocationId!: string;

    form!: FormGroup;
    isSubmitting = false;

    additionalElements: AdditionalElement[] = [];
    isLoadingOptions = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private inventoryService: InventoryAdminService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
        this.loadElements();
    }

    initForm() {
        this.form = this.fb.group({
            additionalElementId: [null, [Validators.required]],
            value: [null, [Validators.required, Validators.min(0.01)]]
        });
    }

    loadElements() {
        this.isLoadingOptions = true;
        this.inventoryService.getAdditionalElements(1, 100).subscribe({
            next: (response) => {
                this.additionalElements = response.data.filter(e => e.isActive);
                this.isLoadingOptions = false;
            },
            error: () => {
                this.isLoadingOptions = false;
            }
        });
    }

    get isFormValid(): boolean {
        return this.form.valid;
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.isFormValid && !this.isSubmitting) {
            this.isSubmitting = true;

            const dto = {
                additionalElementId: this.form.value.additionalElementId,
                value: this.form.value.value
            };

            this.inventoryService.addAllocationElement(this.allocationId, dto).subscribe({
                next: async () => {
                    await this.toastService.success('Elemento agregado correctamente');
                    this.modalCtrl.dismiss(null, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al agregar el elemento'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
