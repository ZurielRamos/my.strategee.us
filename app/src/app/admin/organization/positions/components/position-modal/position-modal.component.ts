import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Position } from '../../models/position.model';
import { Area } from '../../../areas/models/area.model';
import { AreasService } from '../../../areas/services/areas.service';
import { PositionsService } from '../../services/positions.service';
import { BaseModalComponent } from '../../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../../shared/components/form-select/form-select.component';
import { TextInputComponent } from '../../../../../shared/components/text-input/text-input.component';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
    selector: 'app-position-modal',
    templateUrl: './position-modal.component.html',
    styleUrls: ['./position-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        TextInputComponent
    ]
})
export class PositionModalComponent implements OnInit {
    @Input() position?: Position;
    @Input() mode: 'create' | 'edit' = 'create';

    positionForm!: FormGroup;
    isSubmitting = false;
    departments: Area[] = [];

    riskLevels = [
        { value: 'I', label: 'Clase I - Riesgo Mínimo' },
        { value: 'II', label: 'Clase II - Riesgo Bajo' },
        { value: 'III', label: 'Clase III - Riesgo Medio' },
        { value: 'IV', label: 'Clase IV - Riesgo Alto' },
        { value: 'V', label: 'Clase V - Riesgo Máximo' }
    ];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private areasService: AreasService,
        private positionsService: PositionsService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
        this.loadDepartments();
    }

    initForm() {
        const departmentId = this.position?.departmentId || this.position?.department?.id || '';
        
        this.positionForm = this.fb.group({
            name: [this.position?.name || '', [Validators.required]],
            riskLevel: [this.position?.riskLevel || '', [Validators.required]],
            departmentId: [departmentId, [Validators.required]]
        });
    }

    loadDepartments() {
        this.areasService.getAll().subscribe({
            next: (data) => {
                this.departments = data;
            },
            error: (error) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    get title(): string {
        return this.mode === 'create' ? 'Nuevo Cargo' : 'Editar Cargo';
    }

    get departmentOptions(): SelectOption[] {
        return this.departments.map(d => ({
            value: d.id,
            label: d.name
        }));
    }

    get riskLevelOptions(): SelectOption[] {
        return this.riskLevels;
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.positionForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const operation = this.mode === 'edit' && this.position?.id
                ? this.positionsService.update(this.position.id, this.positionForm.value)
                : this.positionsService.create(this.positionForm.value);
            
            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Cambios guardados correctamente'
                        : 'Cargo creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al guardar el cargo'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
