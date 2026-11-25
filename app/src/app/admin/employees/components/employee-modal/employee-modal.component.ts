import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModalController } from '@ionic/angular/standalone';
import { Employee } from '../../models/employee.model';
import { ContractType } from '../../models/contract.model';
import { GENDER_OPTIONS } from '../../helpers/gender.helper';
import { EmployeesService } from '../../services/employees.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-employee-modal',
    templateUrl: './employee-modal.component.html',
    styleUrls: ['./employee-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        TextInputComponent,
        TextareaInputComponent,
        DateInputComponent,
        PhoneInputComponent
    ]
})
export class EmployeeModalComponent implements OnInit {
    @Input() employee?: Employee;
    @Input() mode: 'create' | 'edit' | 'view' = 'create';

    form!: FormGroup;
    isSubmitting = false;
    companies: any[] = [];
    positions: any[] = [];
    departments: any[] = [];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private employeesService: EmployeesService,
        private toastService: ToastService,
        private http: HttpClient
    ) {}

    ngOnInit() {
        this.initForm();
        this.loadOrganizationData();
    }

    private loadOrganizationData() {
        const apiUrl = environment.apiUrl;
        this.http.get<any[]>(`${apiUrl}/companies`).subscribe({
            next: (data) => this.companies = data,
            error: (error) => console.error('Error loading companies:', error)
        });
        this.http.get<any[]>(`${apiUrl}/positions`).subscribe({
            next: (data) => this.positions = data,
            error: (error) => console.error('Error loading positions:', error)
        });
        this.http.get<any[]>(`${apiUrl}/departments`).subscribe({
            next: (data) => this.departments = data,
            error: (error) => console.error('Error loading departments:', error)
        });
    }

    initForm() {
        this.form = this.fb.group({
            firstName: [this.employee?.firstName || '', [Validators.required]],
            lastName: [this.employee?.lastName || '', [Validators.required]],
            documentType: [this.employee?.documentType || 'CC', [Validators.required]],
            documentNumber: [this.employee?.documentNumber || '', [Validators.required]],
            birthDate: [this.formatDateForInput(this.employee?.birthDate), [Validators.required]],
            gender: [this.employee?.gender || '', [Validators.required]],
            address: [this.employee?.address || '', [Validators.required]],
            personalPhone: [this.employee?.personalPhone || '', [Validators.required]],
            personalEmail: [this.employee?.personalEmail || '', [Validators.required, Validators.email]],
            corporateEmail: [this.employee?.corporateEmail || '', [Validators.email]],
            hireDate: [this.formatDateForInput(this.employee?.hireDate ?? undefined), this.mode === 'create' ? [Validators.required] : []],
            contractType: [this.employee?.contractType || '', this.mode === 'create' ? [Validators.required] : []],
            companyId: [this.employee?.companyId || ''],
            positionId: [this.employee?.positionId || ''],
            departmentId: [this.employee?.departmentId || ''],
            idoLimit: [
                this.employee?.idoLimit ?? 90,
                [Validators.required, Validators.min(0), Validators.max(99), Validators.pattern('^[0-9]{1,2}$')]
            ]
        });

        if (this.mode === 'view') {
            this.form.disable();
        }
    }

    /**
     * Formatea una fecha para el input type="date" (YYYY-MM-DD)
     * Maneja correctamente las fechas sin problemas de zona horaria
     */
    private formatDateForInput(date: string | Date | undefined): string {
        if (!date) return '';
        
        // Si la fecha viene como string en formato YYYY-MM-DD, devolverla directamente
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        
        // Si viene como string ISO o Date, parsear correctamente
        const dateStr = typeof date === 'string' ? date : date.toISOString();
        
        // Extraer solo la parte de la fecha (YYYY-MM-DD) sin conversión de zona horaria
        return dateStr.split('T')[0];
    }

    // Getter para opciones de tipo de documento
    get documentTypeOptions(): SelectOption[] {
        return [
            { value: 'CC', label: 'Cédula de Ciudadanía' },
            { value: 'CE', label: 'Cédula de Extranjería' },
            { value: 'PA', label: 'Pasaporte' },
            { value: 'TI', label: 'Tarjeta de Identidad' },
            { value: 'PPT', label: 'Permiso por Protección Temporal' },
            { value: 'PEP', label: 'Permiso Especial de Permanencia' }
        ];
    }

    // Getter para opciones de tipo de contrato
    get contractTypeOptions(): SelectOption[] {
        return Object.values(ContractType).map(type => ({ value: type, label: type }));
    }

    get companyOptions(): SelectOption[] {
        return this.companies.map(c => ({ value: c.id, label: c.name }));
    }

    get positionOptions(): SelectOption[] {
        return this.positions.map(p => ({ value: p.id, label: p.name }));
    }

    get departmentOptions(): SelectOption[] {
        return this.departments.map(d => ({ value: d.id, label: d.name }));
    }

    // Getter para opciones de género
    get genderOptions(): SelectOption[] {
        return GENDER_OPTIONS.map(g => ({
            value: g.value,
            label: g.label
        }));
    }

    get title(): string {
        if (this.mode === 'create') return 'Nuevo Empleado';
        if (this.mode === 'edit') return 'Editar Empleado';
        return 'Detalles del Empleado';
    }

    get subtitle(): string {
        if (this.mode === 'view') return 'Información del empleado';
        return 'Complete los campos requeridos';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            const formData = { ...this.form.value };
            // Los campos opcionales vacíos se envían como null para poder limpiarlos
            for (const key of ['hireDate', 'contractType', 'companyId', 'positionId', 'departmentId']) {
                if (!formData[key]) formData[key] = null;
            }

            const operation = this.mode === 'edit' && this.employee
                ? this.employeesService.update(this.employee.id, formData)
                : this.employeesService.create(formData);

            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Cambios guardados correctamente'
                        : 'Empleado creado correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    let errorMessage = 'Error al procesar la solicitud';
                    if (error.error?.message) {
                        errorMessage = Array.isArray(error.error.message)
                            ? error.error.message.join(', ')
                            : error.error.message;
                    }
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }
}
