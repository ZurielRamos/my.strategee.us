import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../../shared/components/textarea-input/textarea-input.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { Area } from '../../models/area.model';
import { AreasService } from '../../services/areas.service';

@Component({
    selector: 'app-area-modal',
    templateUrl: './area-modal.component.html',
    styleUrls: ['./area-modal.component.scss'],
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
export class AreaModalComponent implements OnInit {
    @Input() area?: Area;
    @Input() mode: 'create' | 'edit' = 'create';

    areaForm!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private areasService: AreasService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.areaForm = this.fb.group({
            name: [this.area?.name || '', [Validators.required]],
            costCenterCode: [this.area?.costCenterCode || ''],
            description: [this.area?.description || '']
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Área' : 'Nueva Área';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.areaForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const operation = this.mode === 'edit' && this.area?.id
                ? this.areasService.update(this.area.id, this.areaForm.value)
                : this.areasService.create(this.areaForm.value);
            
            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Cambios guardados correctamente'
                        : 'Área creada correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.message || 'Error al guardar el área'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
