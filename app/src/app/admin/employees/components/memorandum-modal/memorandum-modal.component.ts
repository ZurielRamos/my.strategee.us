import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonIcon
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { SalaryType } from '../../models/contract.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GlobalParametersService } from '../../../finance/global-parameters/services/global-parameters.service';
import { GlobalParameter } from '../../../finance/global-parameters/models/global-parameter.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { ToastService } from '../../../../shared/services/toast.service';

import { NumericOnlyDirective } from '../../../../shared/directives/numeric-only.directive';

@Component({
    selector: 'app-memorandum-modal',
    templateUrl: './memorandum-modal.component.html',
    styleUrls: ['./memorandum-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        NumericOnlyDirective,
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        AlertBoxComponent,
        FormSelectComponent,
        DateInputComponent,
        TextareaInputComponent,
        IonItem,
        IonLabel,
        IonInput,
        IonNote,
        IonIcon
    ]
})
export class MemorandumModalComponent implements OnInit {
    @Input() contractId!: string;
    @Input() employeeName!: string;
    @Input() contractType!: string;

    memorandumForm!: FormGroup;
    isSubmitting = false;
    
    positions: any[] = [];
    schedules: any[] = [];
    locations: any[] = [];
    departments: any[] = [];
    globalParameters: GlobalParameter[] = [];
    
    isLoadingData = false;
    minStartDate: Date;

    salaryTypes = [
        { value: SalaryType.FIXED, label: 'Salario Fijo' },
        { value: SalaryType.PARAMETER, label: 'Vinculado a Parámetro' }
    ];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private http: HttpClient,
        private globalParametersService: GlobalParametersService,
        private toastService: ToastService
    ) {
        addIcons({ informationCircleOutline });
        
        // Configurar fecha mínima (hoy)
        this.minStartDate = new Date();
        this.minStartDate.setHours(0, 0, 0, 0);
    }

    ngOnInit() {
        this.initForm();
        this.loadData();
        this.setupFormListeners();
    }

    initForm() {
        this.memorandumForm = this.fb.group({
            positionId: ['', [Validators.required]],
            scheduleId: [''],
            locationId: [''],
            departmentId: [''],
            salaryType: ['', [Validators.required]],
            salaryAmount: [null],
            parameterKey: [''],
            startDate: ['', [Validators.required]],
            endDate: [''],
            reason: ['', [Validators.required]]
        });
    }

    setupFormListeners() {
        // Listener para salaryType
        this.memorandumForm.get('salaryType')?.valueChanges.subscribe(salaryType => {
            if (salaryType === SalaryType.FIXED) {
                this.memorandumForm.get('salaryAmount')?.setValidators([Validators.required, Validators.min(0)]);
                this.memorandumForm.get('parameterKey')?.clearValidators();
            } else if (salaryType === SalaryType.PARAMETER) {
                this.memorandumForm.get('salaryAmount')?.clearValidators();
                this.memorandumForm.get('parameterKey')?.setValidators([Validators.required]);
            }
            this.memorandumForm.get('salaryAmount')?.updateValueAndValidity();
            this.memorandumForm.get('parameterKey')?.updateValueAndValidity();
        });
    }

    loadData() {
        this.isLoadingData = true;
        const apiUrl = environment.apiUrl;

        // Cargar cargos
        this.http.get<any[]>(`${apiUrl}/positions`).subscribe({
            next: (data) => this.positions = data,
            error: (error) => console.error('Error loading positions:', error)
        });

        // Cargar horarios
        this.http.get<any[]>(`${apiUrl}/schedules`).subscribe({
            next: (data) => this.schedules = data,
            error: (error) => console.error('Error loading schedules:', error)
        });

        // Cargar ubicaciones
        this.http.get<any[]>(`${apiUrl}/locations`).subscribe({
            next: (data) => this.locations = data,
            error: (error) => console.error('Error loading locations:', error)
        });

        // Cargar departamentos/áreas
        this.http.get<any[]>(`${apiUrl}/departments`).subscribe({
            next: (data) => {
                this.departments = data;
            },
            error: (error) => console.error('Error loading departments:', error)
        });

        // Cargar parámetros globales
        this.globalParametersService.getAll().subscribe({
            next: (parameters) => {
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

    get isFixedSalary(): boolean {
        return this.memorandumForm.get('salaryType')?.value === SalaryType.FIXED;
    }

    get isParameterSalary(): boolean {
        return this.memorandumForm.get('salaryType')?.value === SalaryType.PARAMETER;
    }

    get isIndefiniteTerm(): boolean {
        return this.contractType === 'Término Indefinido';
    }

    getParameterLabel(param: GlobalParameter): string {
        return `${param.key} - ${param.value.toLocaleString('es-CO')}`;
    }

    get positionOptions(): SelectOption[] {
        return this.positions.map(p => ({ value: p.id, label: p.name }));
    }

    get departmentOptions(): SelectOption[] {
        return this.departments.map(d => ({ value: d.id, label: d.name }));
    }

    get scheduleOptions(): SelectOption[] {
        return this.schedules.map(s => ({ value: s.id, label: s.name }));
    }

    get locationOptions(): SelectOption[] {
        return this.locations.map(l => ({ value: l.id, label: l.name }));
    }

    get salaryTypeOptions(): SelectOption[] {
        return this.salaryTypes;
    }

    get parameterOptions(): SelectOption[] {
        return this.globalParameters.map(p => ({
            value: p.key,
            label: this.getParameterLabel(p)
        }));
    }

    async onConfirm() {
        if (this.memorandumForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            const formValue = this.memorandumForm.value;
            
            const data = {
                positionId: formValue.positionId,
                scheduleId: formValue.scheduleId || undefined,
                locationId: formValue.locationId || undefined,
                departmentId: formValue.departmentId || undefined,
                salaryType: formValue.salaryType,
                salaryAmount: formValue.salaryType === SalaryType.FIXED ? Number(formValue.salaryAmount) : undefined,
                parameterKey: formValue.salaryType === SalaryType.PARAMETER ? formValue.parameterKey : undefined,
                startDate: formValue.startDate,
                endDate: formValue.endDate || undefined,
                reason: formValue.reason
            };

            const apiUrl = environment.apiUrl;
            this.http.post(`${apiUrl}/contracts/${this.contractId}/memorandums`, data).subscribe({
                next: async (response) => {
                    await this.toastService.success('Memorando creado correctamente');
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al crear el memorando'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}
