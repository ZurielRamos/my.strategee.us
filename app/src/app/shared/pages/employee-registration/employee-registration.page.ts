import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonButton, IonIcon, IonSpinner, IonCheckbox } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    checkmarkCircleOutline,
    alertCircleOutline,
    addOutline,
    trashOutline,
    arrowBackOutline,
    arrowForwardOutline,
    checkmarkOutline,
} from 'ionicons/icons';
import { environment } from 'src/environments/environment';
import { TextInputComponent } from '../../components/text-input/text-input.component';
import { TextareaInputComponent } from '../../components/textarea-input/textarea-input.component';
import { DateInputComponent } from '../../components/date-input/date-input.component';
import { PhoneInputComponent } from '../../components/phone-input/phone-input.component';
import { FormSelectComponent, SelectOption } from '../../components/form-select/form-select.component';
import { LEGAL_VERSION } from '../../legal/legal-content';
import { GENDER_OPTIONS } from '../../../admin/employees/helpers/gender.helper';

type PageState = 'loading' | 'invalid' | 'form' | 'success';

interface NamedOption { id: string; name: string; }

@Component({
    selector: 'app-employee-registration',
    templateUrl: './employee-registration.page.html',
    styleUrls: ['./employee-registration.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonCheckbox,
        TextInputComponent,
        TextareaInputComponent,
        DateInputComponent,
        PhoneInputComponent,
        FormSelectComponent,
    ],
})
export class EmployeeRegistrationPage implements OnInit {
    readonly steps = ['Personal', 'Laboral', 'Emergencia', 'Parafiscales', 'Términos'];
    readonly legalVersion = LEGAL_VERSION;
    readonly maxContacts = 3;

    state: PageState = 'loading';
    currentStep = 0;
    isSubmitting = false;
    errorMessage = '';

    companies: NamedOption[] = [];
    positions: NamedOption[] = [];
    departments: NamedOption[] = [];
    contractTypes: string[] = [];

    form!: FormGroup;
    private token = '';

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private http: HttpClient,
    ) {
        addIcons({
            checkmarkCircleOutline,
            alertCircleOutline,
            addOutline,
            trashOutline,
            arrowBackOutline,
            arrowForwardOutline,
            checkmarkOutline,
        });
    }

    ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        this.buildForm();
        this.http.get<any>(`${environment.apiUrl}/public/employee-registration/${encodeURIComponent(this.token)}/options`).subscribe({
            next: (options) => {
                this.companies = options.companies;
                this.positions = options.positions;
                this.departments = options.departments;
                this.contractTypes = options.contractTypes;
                this.state = 'form';
            },
            error: () => (this.state = 'invalid'),
        });
    }

    private buildForm() {
        this.form = this.fb.group({
            personal: this.fb.group({
                firstName: ['', [Validators.required, Validators.maxLength(100)]],
                lastName: ['', [Validators.required, Validators.maxLength(100)]],
                documentType: ['CC', [Validators.required]],
                documentNumber: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
                birthDate: ['', [Validators.required]],
                gender: ['', [Validators.required]],
                address: ['', [Validators.required, Validators.maxLength(255)]],
                personalPhone: ['', [Validators.required]],
                personalEmail: ['', [Validators.required, Validators.email]],
                corporateEmail: ['', [Validators.required, Validators.email]],
            }),
            work: this.fb.group({
                hireDate: ['', [Validators.required]],
                contractType: ['', [Validators.required]],
                companyId: ['', [Validators.required]],
                positionId: ['', [Validators.required]],
                departmentId: ['', [Validators.required]],
            }),
            emergencyContacts: this.fb.array([this.newContact()]),
            parafiscales: this.fb.group({
                eps: [''],
                arl: [''],
                fondoPension: [''],
                cajaCompensacion: [''],
            }),
            consent: this.fb.group({
                acceptTerms: [false, [Validators.requiredTrue]],
                acceptDataPolicy: [false, [Validators.requiredTrue]],
                confirmThirdParty: [false, [Validators.requiredTrue]],
            }),
            // Campo trampa anti-bots (oculto)
            website: [''],
        });
    }

    private newContact(): FormGroup {
        return this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            relationship: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            phone: ['', [Validators.required]],
            email: ['', [Validators.email]],
        });
    }

    get contacts(): FormArray {
        return this.form.get('emergencyContacts') as FormArray;
    }

    contactGroup(i: number): FormGroup {
        return this.contacts.at(i) as FormGroup;
    }

    addContact() {
        if (this.contacts.length < this.maxContacts) {
            this.contacts.push(this.newContact());
        }
    }

    removeContact(i: number) {
        if (this.contacts.length > 1) {
            this.contacts.removeAt(i);
        }
    }

    // ---------------------------------------------------------------- opciones
    get documentTypeOptions(): SelectOption[] {
        return [
            { value: 'CC', label: 'Cédula de Ciudadanía' },
            { value: 'CE', label: 'Cédula de Extranjería' },
            { value: 'PA', label: 'Pasaporte' },
            { value: 'TI', label: 'Tarjeta de Identidad' },
            { value: 'PPT', label: 'Permiso por Protección Temporal' },
            { value: 'PEP', label: 'Permiso Especial de Permanencia' },
        ];
    }
    get genderOptions(): SelectOption[] {
        return GENDER_OPTIONS.map(g => ({ value: g.value, label: g.label }));
    }
    get contractTypeOptions(): SelectOption[] {
        return this.contractTypes.map(t => ({ value: t, label: t }));
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

    // ---------------------------------------------------------------- pasos
    private stepControl(step: number) {
        switch (step) {
            case 0: return this.form.get('personal')!;
            case 1: return this.form.get('work')!;
            case 2: return this.contacts;
            case 3: return this.form.get('parafiscales')!;
            default: return this.form.get('consent')!;
        }
    }

    get isStepValid(): boolean {
        return this.stepControl(this.currentStep).valid;
    }

    get isLastStep(): boolean {
        return this.currentStep === this.steps.length - 1;
    }

    next() {
        if (!this.isStepValid) {
            this.stepControl(this.currentStep).markAllAsTouched();
            return;
        }
        if (!this.isLastStep) {
            this.currentStep++;
            this.scrollTop();
        }
    }

    back() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.errorMessage = '';
            this.scrollTop();
        }
    }

    private scrollTop() {
        (document.querySelector('ion-content.registration-content') as HTMLIonContentElement | null)?.scrollToTop(200);
    }

    // ---------------------------------------------------------------- envío
    submit() {
        if (this.isSubmitting) return;
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            this.errorMessage = 'Revisa los campos obligatorios de todos los pasos.';
            return;
        }
        this.isSubmitting = true;
        this.errorMessage = '';

        const value = this.form.getRawValue();
        const payload = {
            ...value.personal,
            ...value.work,
            emergencyContacts: value.emergencyContacts.map((c: any) => ({
                name: c.name,
                relationship: c.relationship,
                phone: c.phone,
                ...(c.email ? { email: c.email } : {}),
            })),
            parafiscales: {
                eps: value.parafiscales.eps || null,
                arl: value.parafiscales.arl || null,
                fondoPension: value.parafiscales.fondoPension || null,
                cajaCompensacion: value.parafiscales.cajaCompensacion || null,
            },
            ...value.consent,
            termsVersion: LEGAL_VERSION,
            website: value.website || undefined,
        };

        this.http.post(`${environment.apiUrl}/public/employee-registration/${encodeURIComponent(this.token)}`, payload).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.state = 'success';
            },
            error: (error: HttpErrorResponse) => {
                this.isSubmitting = false;
                const message = error.error?.message;
                this.errorMessage = Array.isArray(message)
                    ? message.join(', ')
                    : message || 'No se pudo enviar tu registro. Inténtalo de nuevo.';
            },
        });
    }
}
