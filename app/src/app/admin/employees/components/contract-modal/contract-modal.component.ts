import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonItem, IonLabel, IonInput, IonNote } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { ContractType, PayrollGroup, ContractStatus, SalaryType } from '../../models/contract.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GlobalParametersService } from '../../../finance/global-parameters/services/global-parameters.service';
import { GlobalParameter } from '../../../finance/global-parameters/models/global-parameter.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-contract-modal',
    templateUrl: './contract-modal.component.html',
    styleUrls: ['./contract-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonInput,
        IonNote,
        BaseModalComponent,
        FormSelectComponent,
        DateInputComponent,
        TextareaInputComponent,
        AlertBoxComponent
    ]
})
export class ContractModalComponent implements OnInit {
    @Input() employeeId!: string;
    @Input() employeeName!: string;
    @Input() employeeDocumentNumber?: string;

    contractForm!: FormGroup;
    isSubmitting = false;
    
    companies: any[] = [];
    positions: any[] = [];
    schedules: any[] = [];
    locations: any[] = [];
    departments: any[] = [];
    globalParameters: GlobalParameter[] = [];
    
    isLoadingData = false;

    contractTypes = Object.values(ContractType);
    payrollGroups = Object.values(PayrollGroup);
    contractStatuses = [
        { value: ContractStatus.ACTIVE, label: 'Activo' },
        { value: ContractStatus.DRAFT, label: 'Borrador' }
    ];
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
    }

    ngOnInit() {
        this.initForm();
        this.loadData();
        this.setupFormListeners();
        this.loadContractNumberSuggestion();
    }

    initForm() {
        this.contractForm = this.fb.group({
            companyId: ['', [Validators.required]],
            contractNumber: [''],
            type: ['', [Validators.required]],
            payrollGroup: ['', [Validators.required]],
            startDate: ['', [Validators.required]],
            endDate: [''],
            status: [ContractStatus.ACTIVE, [Validators.required]],
            // Memorando inicial
            positionId: ['', [Validators.required]],
            scheduleId: [''],
            locationId: [''],
            departmentId: [''],
            salaryType: ['', [Validators.required]],
            salaryAmount: [null],
            parameterKey: [''],
            reason: ['Ingreso inicial', [Validators.required]]
        });
    }

    setupFormListeners() {
        // Listener para salaryType
        this.contractForm.get('salaryType')?.valueChanges.subscribe(salaryType => {
            if (salaryType === SalaryType.FIXED) {
                this.contractForm.get('salaryAmount')?.setValidators([Validators.required, Validators.min(0)]);
                this.contractForm.get('parameterKey')?.clearValidators();
            } else if (salaryType === SalaryType.PARAMETER) {
                this.contractForm.get('salaryAmount')?.clearValidators();
                this.contractForm.get('parameterKey')?.setValidators([Validators.required]);
            }
            this.contractForm.get('salaryAmount')?.updateValueAndValidity();
            this.contractForm.get('parameterKey')?.updateValueAndValidity();
        });

        // Listener para tipo de contrato
        this.contractForm.get('type')?.valueChanges.subscribe(contractType => {
            const endDateControl = this.contractForm.get('endDate');
            
            if (contractType === ContractType.INDEFINITE_TERM) {
                // Si es término indefinido, limpiar y deshabilitar fecha de fin
                endDateControl?.setValue('');
                endDateControl?.disable();
            } else {
                // Para otros tipos, habilitar fecha de fin
                endDateControl?.enable();
            }
        });
    }

    loadContractNumberSuggestion() {
        if (!this.employeeDocumentNumber) {
            console.warn('No document number provided for contract number suggestion');
            return;
        }

        const apiUrl = environment.apiUrl;
        // Obtener todos los contratos del empleado para contar
        this.http.get<any[]>(`${apiUrl}/contracts/employee/${this.employeeId}/all`).subscribe({
            next: (contracts) => {
                const contractCount = contracts.length + 1;
                const suggestedNumber = `${this.employeeDocumentNumber}-${contractCount}`;
                this.contractForm.patchValue({ contractNumber: suggestedNumber });
                console.log('Contract number suggestion:', suggestedNumber);
            },
            error: (error) => {
                console.error('Error loading contracts for number suggestion:', error);
                // Si hay error, usar 1 como valor por defecto
                const suggestedNumber = `${this.employeeDocumentNumber}-1`;
                this.contractForm.patchValue({ contractNumber: suggestedNumber });
            }
        });
    }

    loadData() {
        this.isLoadingData = true;
        const apiUrl = environment.apiUrl;

        // Cargar empresas
        this.http.get<any[]>(`${apiUrl}/companies`).subscribe({
            next: (data) => this.companies = data,
            error: (error) => console.error('Error loading companies:', error)
        });

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
                console.log('Departments loaded:', this.departments);
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
        return this.contractForm.get('salaryType')?.value === SalaryType.FIXED;
    }

    get isParameterSalary(): boolean {
        return this.contractForm.get('salaryType')?.value === SalaryType.PARAMETER;
    }

    get isIndefiniteTerm(): boolean {
        return this.contractForm.get('type')?.value === ContractType.INDEFINITE_TERM;
    }

    // Getters for select options
    get companyOptions(): SelectOption[] {
        return this.companies.map(c => ({
            value: c.id,
            label: c.name
        }));
    }

    get positionOptions(): SelectOption[] {
        return this.positions.map(p => ({
            value: p.id,
            label: p.name
        }));
    }

    get scheduleOptions(): SelectOption[] {
        return this.schedules.map(s => ({
            value: s.id,
            label: s.name
        }));
    }

    get locationOptions(): SelectOption[] {
        return this.locations.map(l => ({
            value: l.id,
            label: l.name
        }));
    }

    get departmentOptions(): SelectOption[] {
        return this.departments.map(d => ({
            value: d.id,
            label: d.name
        }));
    }

    get contractTypeOptions(): SelectOption[] {
        return this.contractTypes.map(type => ({
            value: type,
            label: type
        }));
    }

    get payrollGroupOptions(): SelectOption[] {
        return this.payrollGroups.map(group => ({
            value: group,
            label: group
        }));
    }

    get contractStatusOptions(): SelectOption[] {
        return this.contractStatuses.map(status => ({
            value: status.value,
            label: status.label
        }));
    }

    get salaryTypeOptions(): SelectOption[] {
        return this.salaryTypes.map(type => ({
            value: type.value,
            label: type.label
        }));
    }

    get parameterOptions(): SelectOption[] {
        return this.globalParameters.map(param => ({
            value: param.key,
            label: this.getParameterLabel(param)
        }));
    }

    getParameterLabel(param: GlobalParameter): string {
        return `${param.key} - ${param.value.toLocaleString('es-CO')}`;
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.contractForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.contractForm.getRawValue();
            
            // Si es término indefinido, asegurar que endDate sea undefined
            const endDate = formValue.type === ContractType.INDEFINITE_TERM ? undefined : (formValue.endDate || undefined);
            
            const data = {
                employeeId: this.employeeId,
                companyId: formValue.companyId,
                contractNumber: formValue.contractNumber || undefined,
                type: formValue.type,
                payrollGroup: formValue.payrollGroup,
                startDate: formValue.startDate,
                endDate: endDate,
                status: formValue.status,
                initialMemorandum: {
                    positionId: formValue.positionId,
                    scheduleId: formValue.scheduleId || undefined,
                    locationId: formValue.locationId || undefined,
                    departmentId: formValue.departmentId || undefined,
                    salaryType: formValue.salaryType,
                    salaryAmount: formValue.salaryType === SalaryType.FIXED ? Number(formValue.salaryAmount) : undefined,
                    parameterKey: formValue.salaryType === SalaryType.PARAMETER ? formValue.parameterKey : undefined,
                    startDate: formValue.startDate,
                    endDate: endDate,
                    reason: formValue.reason
                }
            };

            const apiUrl = environment.apiUrl;
            this.http.post(`${apiUrl}/contracts`, data).subscribe({
                next: async (response) => {
                    await this.toastService.success('Contrato creado correctamente');
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al crear el contrato'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
