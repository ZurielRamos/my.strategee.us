import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BenefitType, BENEFIT_TYPE_LABELS } from '../../models/benefit-allocation.model';
import { BenefitsService } from '../../services/benefits.service';
import { EmployeesService } from '../../services/employees.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-benefit-allocation-modal',
    templateUrl: './benefit-allocation-modal.component.html',
    styleUrls: ['./benefit-allocation-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        TextInputComponent,
        AlertBoxComponent
    ]
})
export class BenefitAllocationModalComponent implements OnInit {
    @Input() employeeId?: string;
    @Input() employeeName?: string;
    @Input() existingBenefits?: string[]; // Array de BenefitType ya asignados
    @Input() benefit?: any; // Beneficio a editar (modo edición)

    benefitForm!: FormGroup;
    isSubmitting = false;
    isEditMode = false;
    
    employees: any[] = [];
    isLoadingData = false;

    benefitTypes = Object.values(BenefitType).map(type => ({
        value: type,
        label: BENEFIT_TYPE_LABELS[type]
    }));

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private benefitsService: BenefitsService,
        private employeesService: EmployeesService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        // Determinar si estamos en modo edición
        this.isEditMode = !!this.benefit;
        
        this.initForm();
        
        // Solo cargar empleados si no se pasó un employeeId
        if (!this.employeeId) {
            this.loadData();
        }
    }

    initForm() {
        this.benefitForm = this.fb.group({
            employeeId: [this.employeeId || '', [Validators.required]],
            benefitType: [
                { value: this.benefit?.benefitType || '', disabled: this.isEditMode },
                [Validators.required]
            ],
            monthlyQuota: [
                this.benefit?.amount || null,
                [Validators.required, Validators.min(0.5), Validators.max(31)]
            ]
        });
    }

    loadData() {
        this.isLoadingData = true;

        // Cargar empleados
        this.employeesService.getAll(1, 1000).subscribe({
            next: (response) => {
                this.employees = response.data;
                this.isLoadingData = false;
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.isLoadingData = false;
            }
        });
    }

    // Getters for select options
    get employeeOptions(): SelectOption[] {
        return this.employees.map(e => ({
            value: e.id,
            label: `${e.firstName} ${e.lastName}`
        }));
    }

    get benefitOptions(): SelectOption[] {
        // Filtrar beneficios:
        // 1. Excluir BIRTHDAY_EXTENSION (se asigna automáticamente)
        // 2. Excluir beneficios ya asignados al empleado
        return this.benefitTypes
            .filter(type => {
                // Excluir cumpleaños
                if (type.value === BenefitType.BIRTHDAY_EXTENSION) {
                    return false;
                }
                
                // Excluir beneficios ya asignados
                if (this.existingBenefits && this.existingBenefits.includes(type.value)) {
                    return false;
                }
                
                return true;
            });
    }

    get isEmployeePreselected(): boolean {
        return !!this.employeeId;
    }

    get modalTitle(): string {
        if (this.isEditMode) {
            return 'Editar Cupo de Beneficio';
        }
        return this.isEmployeePreselected ? 'Asignar Beneficio' : 'Asignar Beneficio a Empleado';
    }

    get modalSubtitle(): string {
        if (this.isEditMode && this.employeeName) {
            return `Modifica el cupo mensual del beneficio para ${this.employeeName}`;
        }
        if (this.isEmployeePreselected && this.employeeName) {
            return `Asigna un cupo mensual de beneficio para ${this.employeeName}`;
        }
        return 'Asigna un cupo mensual de beneficio para un empleado';
    }

    get hasAvailableBenefits(): boolean {
        return this.benefitOptions.length > 0;
    }

    get noAvailableBenefitsMessage(): string {
        if (this.isEmployeePreselected) {
            return 'Este empleado ya tiene todos los beneficios disponibles asignados.';
        }
        return 'No hay beneficios disponibles para asignar.';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.benefitForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const data = {
                employeeId: this.benefitForm.value.employeeId,
                benefitType: this.isEditMode 
                    ? this.benefit.benefitType 
                    : this.benefitForm.value.benefitType,
                amount: Number(this.benefitForm.value.monthlyQuota)
            };

            this.benefitsService.setAllocation(data).subscribe({
                next: async (response) => {
                    const message = this.isEditMode 
                        ? 'Cupo de beneficio actualizado correctamente'
                        : 'Beneficio asignado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    const message = this.isEditMode
                        ? 'Error al actualizar el cupo del beneficio'
                        : 'Error al asignar el beneficio';
                    await this.toastService.error(
                        error.error?.message || message
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
