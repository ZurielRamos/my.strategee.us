import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { Hardware, Software } from '../../models';

@Component({
    selector: 'app-inventory-feature-modal',
    templateUrl: './inventory-feature-modal.component.html',
    styleUrls: ['./inventory-feature-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextareaInputComponent,
        IonSelect,
        IonSelectOption
    ]
})
export class InventoryFeatureModalComponent implements OnInit {
    @Input() inventoryId!: string;

    form!: FormGroup;
    isSubmitting = false;

    featureType: 'hardware' | 'software' = 'hardware';
    hardwares: Hardware[] = [];
    softwares: Software[] = [];
    isLoadingOptions = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private inventoryService: InventoryAdminService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
        this.loadOptions();
    }

    initForm() {
        this.form = this.fb.group({
            featureType: ['hardware', [Validators.required]],
            hardwareId: [null],
            softwareId: [null],
            description: ['', [Validators.maxLength(500)]]
        });
    }

    onFeatureTypeChange(event: any) {
        this.featureType = event.detail.value;
        this.form.patchValue({
            hardwareId: null,
            softwareId: null
        });
    }

    loadOptions() {
        this.isLoadingOptions = true;
        this.inventoryService.getHardwares(1, 100).subscribe({
            next: (response) => {
                this.hardwares = response.data.filter(h => h.isActive);
            }
        });
        this.inventoryService.getSoftwares(1, 100).subscribe({
            next: (response) => {
                this.softwares = response.data.filter(s => s.isActive);
                this.isLoadingOptions = false;
            },
            error: () => {
                this.isLoadingOptions = false;
            }
        });
    }

    get isFormValid(): boolean {
        if (this.featureType === 'hardware') {
            return !!this.form.value.hardwareId;
        }
        return !!this.form.value.softwareId;
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.isFormValid && !this.isSubmitting) {
            this.isSubmitting = true;

            const dto: any = {
                description: this.form.value.description || null
            };

            if (this.featureType === 'hardware') {
                dto.hardwareId = this.form.value.hardwareId;
            } else {
                dto.softwareId = this.form.value.softwareId;
            }

            this.inventoryService.addFeature(this.inventoryId, dto).subscribe({
                next: async () => {
                    await this.toastService.success('Característica agregada correctamente');
                    this.modalCtrl.dismiss(null, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al agregar la característica'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
