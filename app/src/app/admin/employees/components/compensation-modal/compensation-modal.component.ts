import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonItem, IonLabel, IonInput, IonToggle } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { CompensationFrequency, COMPENSATION_FREQUENCY_LABELS, CompensationCondition, COMPENSATION_CONDITION_LABELS } from '../../models/compensation.model';
import { GlobalParametersService } from '../../../finance/global-parameters/services/global-parameters.service';
import { GlobalParameter } from '../../../finance/global-parameters/models/global-parameter.model';
import { CompensationService } from '../../services/compensation.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { EmployeesService } from '../../services/employees.service';

@Component({
    selector: 'app-compensation-modal',
    templateUrl: './compensation-modal.component.html',
    styleUrls: ['./compensation-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonInput,
        IonToggle,
        BaseModalComponent,
        FormSelectComponent,
        DateInputComponent,
        TextInputComponent,
        AlertBoxComponent
    ]
})
export class CompensationModalComponent implements OnInit {
    @Input() employeeId?: string;
    @Input() compensation?: any; // Para modo edición

    compensationForm!: FormGroup;
    isSubmitting = false;
    isEditMode = false;
    
    employees: any[] = [];
    globalParameters: GlobalParameter[] = [];
    isLoadingData = false;

    frequencies = Object.values(CompensationFrequency).map(freq => ({
        value: freq,
        label: COMPENSATION_FREQUENCY_LABELS[freq]
    }));

    conditions = Object.values(CompensationCondition).map(cond => ({
        value: cond,
        label: COMPENSATION_CONDITION_LABELS[cond]
    }));

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private globalParametersService: GlobalParametersService,
        private compensationService: CompensationService,
        private toastService: ToastService,
        private employeesService: EmployeesService
    ) {}

    ngOnInit() {
        this.isEditMode = !!this.compensation;
        this.initForm();
        this.setupFormListeners();
        this.loadData();
        
        // Si es modo edición, cargar los datos de la compensación
        if (this.isEditMode && this.compensation) {
            this.loadCompensationData();
        }
    }

    initForm() {
        this.compensationForm = this.fb.group({
            employeeId: [this.employeeId || '', [Validators.required]],
            concept: ['', [Validators.required]],
            isLinkedGlobalParameter: [false],
            condition: [CompensationCondition.NONE],
            frequency: ['', [Validators.required]],
            amount: [null],
            linkedGlobalParameter: [''],
            startDate: ['', [Validators.required]],
            endDate: [''],
            paymentDate: [''],
            paymentDay: [null],
            secondPaymentDay: [null]
        });
    }

    loadData() {
        this.isLoadingData = true;

        // Solo cargar empleados si no viene pre-seleccionado
        if (!this.employeeId) {
            this.employeesService.getAll(1, 1000).subscribe({
                next: (response) => {
                    this.employees = response.data;
                },
                error: (error) => console.error('Error loading employees:', error)
            });
        }

        // Cargar parámetros globales
        this.globalParametersService.getAll().subscribe({
            next: (parameters) => {
                // Agrupar por key y obtener solo el más reciente de cada uno
                const parameterMap = new Map<string, GlobalParameter>();
                parameters.forEach(param => {
                    const existing = parameterMap.get(param.key);
                    if (!existing || new Date(param.validFrom) > new Date(existing.validFrom)) {
                        parameterMap.set(param.key, param);
                    }
                });
                this.globalParameters = Array.from(parameterMap.values());
                this.isLoadingData = false;
            },
            error: (error) => {
                console.error('Error loading global parameters:', error);
                this.isLoadingData = false;
            }
        });
    }

    setupFormListeners() {
        // Listener para isLinkedGlobalParameter
        this.compensationForm.get('isLinkedGlobalParameter')?.valueChanges.subscribe(isLinked => {
            if (isLinked) {
                this.compensationForm.get('amount')?.clearValidators();
                this.compensationForm.get('linkedGlobalParameter')?.setValidators([Validators.required]);
            } else {
                this.compensationForm.get('amount')?.setValidators([Validators.required, Validators.min(0)]);
                this.compensationForm.get('linkedGlobalParameter')?.clearValidators();
            }
            this.compensationForm.get('amount')?.updateValueAndValidity();
            this.compensationForm.get('linkedGlobalParameter')?.updateValueAndValidity();
        });

        // Listener para frequency
        this.compensationForm.get('frequency')?.valueChanges.subscribe(frequency => {
            this.compensationForm.get('paymentDate')?.clearValidators();
            this.compensationForm.get('paymentDay')?.clearValidators();
            this.compensationForm.get('secondPaymentDay')?.clearValidators();
            this.compensationForm.get('startDate')?.clearValidators();

            if (frequency === CompensationFrequency.ONE_TIME) {
                this.compensationForm.get('paymentDate')?.setValidators([Validators.required]);
                // Para pago único, startDate no es requerido porque se copiará de paymentDate
            } else {
                this.compensationForm.get('startDate')?.setValidators([Validators.required]);
                if (frequency === CompensationFrequency.RECURRING_MONTHLY) {
                    this.compensationForm.get('paymentDay')?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
                } else if (frequency === CompensationFrequency.RECURRING_BIWEEKLY) {
                    this.compensationForm.get('paymentDay')?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
                    this.compensationForm.get('secondPaymentDay')?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
                }
            }

            this.compensationForm.get('paymentDate')?.updateValueAndValidity();
            this.compensationForm.get('paymentDay')?.updateValueAndValidity();
            this.compensationForm.get('secondPaymentDay')?.updateValueAndValidity();
            this.compensationForm.get('startDate')?.updateValueAndValidity();
        });

        // Listener para paymentDate - copiar a startDate cuando es pago único
        this.compensationForm.get('paymentDate')?.valueChanges.subscribe(paymentDate => {
            if (this.selectedFrequency === CompensationFrequency.ONE_TIME && paymentDate) {
                this.compensationForm.get('startDate')?.setValue(paymentDate, { emitEvent: false });
            }
        });
    }

    get isLinkedToGlobalParameter(): boolean {
        return this.compensationForm.get('isLinkedGlobalParameter')?.value || false;
    }

    get selectedFrequency(): CompensationFrequency | null {
        return this.compensationForm.get('frequency')?.value || null;
    }

    get showPaymentDate(): boolean {
        return this.selectedFrequency === CompensationFrequency.ONE_TIME;
    }

    get showPaymentDay(): boolean {
        return this.selectedFrequency === CompensationFrequency.RECURRING_MONTHLY || 
               this.selectedFrequency === CompensationFrequency.RECURRING_BIWEEKLY;
    }

    get showSecondPaymentDay(): boolean {
        return this.selectedFrequency === CompensationFrequency.RECURRING_BIWEEKLY;
    }

    // Getters for select options
    get employeeOptions(): SelectOption[] {
        return this.employees.map(e => ({
            value: e.id,
            label: `${e.firstName} ${e.lastName}`
        }));
    }

    get frequencyOptions(): SelectOption[] {
        return this.frequencies;
    }

    get parameterOptions(): SelectOption[] {
        return this.globalParameters.map(param => ({
            value: param.key,
            label: this.getParameterLabel(param)
        }));
    }

    getParameterLabel(param: GlobalParameter): string {
        return `${param.key} - S/ ${param.value}`;
    }

    loadCompensationData() {
        if (!this.compensation) return;

        this.compensationForm.patchValue({
            employeeId: this.compensation.employeeId,
            concept: this.compensation.concept,
            isLinkedGlobalParameter: this.compensation.isLinkedGlobalParameter || false,
            condition: this.compensation.condition || CompensationCondition.NONE,
            frequency: this.compensation.frequency,
            amount: this.compensation.amount,
            linkedGlobalParameter: this.compensation.linkedGlobalParameter,
            startDate: this.compensation.startDate,
            endDate: this.compensation.endDate,
            paymentDate: this.compensation.paymentDate,
            paymentDay: this.compensation.paymentDay,
            secondPaymentDay: this.compensation.secondPaymentDay
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.compensationForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            const formValue = this.compensationForm.value;
            
            // Preparar los datos según lo que requiere el backend
            const data: any = {
                employeeId: formValue.employeeId,
                concept: formValue.concept,
                isLinkedGlobalParameter: formValue.isLinkedGlobalParameter || false,
                condition: formValue.condition || CompensationCondition.NONE,
                frequency: formValue.frequency,
                startDate: formValue.startDate
            };

            // Agregar monto o parámetro global según corresponda
            if (formValue.isLinkedGlobalParameter) {
                data.linkedGlobalParameter = formValue.linkedGlobalParameter;
            } else {
                data.amount = Number(formValue.amount);
            }

            // Agregar fecha de fin si existe
            if (formValue.endDate) {
                data.endDate = formValue.endDate;
            }

            // Agregar campos específicos según la frecuencia
            if (formValue.frequency === CompensationFrequency.ONE_TIME) {
                data.paymentDate = formValue.paymentDate;
            } else if (formValue.frequency === CompensationFrequency.RECURRING_MONTHLY) {
                data.paymentDay = Number(formValue.paymentDay);
            } else if (formValue.frequency === CompensationFrequency.RECURRING_BIWEEKLY) {
                data.paymentDay = Number(formValue.paymentDay);
                data.secondPaymentDay = Number(formValue.secondPaymentDay);
            }

            // Determinar si es creación o edición
            const request$ = this.isEditMode && this.compensation
                ? this.compensationService.update(this.compensation.id, data)
                : this.compensationService.create(data);

            request$.subscribe({
                next: async (response) => {
                    const message = this.isEditMode 
                        ? 'Compensación actualizada correctamente' 
                        : 'Compensación creada correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    const message = this.isEditMode
                        ? 'Error al actualizar la compensación'
                        : 'Error al crear la compensación';
                    await this.toastService.error(
                        error.error?.message || message
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
