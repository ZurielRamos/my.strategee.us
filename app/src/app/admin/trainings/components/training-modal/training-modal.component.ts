import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ModalController, IonItem, IonLabel, IonToggle, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, informationCircleOutline } from 'ionicons/icons';
import { Training, AssignmentMode } from '../../models/training.model';
import { TrainingsAdminService } from '../../services/trainings-admin.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { ToastService } from '../../../../shared/services/toast.service';

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const startsAt = group.get('startsAt')?.value;
    const endsAt = group.get('endsAt')?.value;
    if (!startsAt || !endsAt) return null;
    if (new Date(endsAt) <= new Date(startsAt)) return { dateRange: true };
    return null;
}

@Component({
    selector: 'app-training-modal',
    templateUrl: './training-modal.component.html',
    styleUrls: ['./training-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        TextareaInputComponent,
        DateInputComponent,
        IonItem,
        IonLabel,
        IonToggle,
        IonIcon
    ]
})
export class TrainingModalComponent implements OnInit {
    @Input() training?: Training;
    @Input() mode: 'create' | 'edit' = 'create';

    form!: FormGroup;
    isSubmitting = false;

    selectedAssignmentMode: AssignmentMode = 'all';

    readonly assignmentModeOptions: { value: AssignmentMode; label: string; description: string }[] = [
        { value: 'all', label: 'Todos los empleados', description: 'Se asigna automáticamente a todos los empleados activos' },
        { value: 'all_with_exclusions', label: 'Todos con exclusiones', description: 'Todos los empleados activos excepto los que selecciones' },
        { value: 'selected', label: 'Solo seleccionados', description: 'Solo los empleados que elijas explícitamente' }
    ];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private trainingsAdminService: TrainingsAdminService,
        private toastService: ToastService
    ) {
        addIcons({ checkmarkOutline, informationCircleOutline });
    }

    ngOnInit() {
        this.initForm();
        if (this.training) {
            this.selectedAssignmentMode = (this.training.assignmentMode as AssignmentMode) ?? 'all';
        }
    }

    initForm() {
        this.form = this.fb.group(
            {
                title: [this.training?.title ?? '', [Validators.required, Validators.maxLength(200)]],
                description: [this.training?.description ?? ''],
                startsAt: [this.formatDateForInput(this.training?.startsAt)],
                endsAt: [this.formatDateForInput(this.training?.endsAt)],
                isMandatory: [this.training?.isMandatory ?? false],
                status: [this.training?.status ?? 'draft']
            },
            { validators: dateRangeValidator }
        );
    }

    private formatDateForInput(date: string | null | undefined): string {
        if (!date) return '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        return date.split('T')[0];
    }

    setAssignmentMode(mode: AssignmentMode) {
        this.selectedAssignmentMode = mode;
    }

    get title(): string {
        return this.mode === 'create' ? 'Nueva Capacitación' : 'Editar Capacitación';
    }

    get subtitle(): string {
        return this.mode === 'create'
            ? 'Complete los campos para crear la capacitación'
            : 'Modifique los campos que desea actualizar';
    }

    get hasDateRangeError(): boolean {
        return !!(this.form.hasError('dateRange') && this.form.get('startsAt')?.value && this.form.get('endsAt')?.value);
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    async onConfirm() {
        if (!this.form.valid || this.isSubmitting) return;

        this.isSubmitting = true;
        const formValue = this.form.value;

        const payload: any = {
            title: formValue.title,
            description: formValue.description || undefined,
            startsAt: formValue.startsAt ? new Date(formValue.startsAt + 'T00:00:00').toISOString() : undefined,
            endsAt: formValue.endsAt ? new Date(formValue.endsAt + 'T23:59:59').toISOString() : undefined,
            isMandatory: formValue.isMandatory,
            assignmentMode: this.selectedAssignmentMode,
            ...(this.mode === 'edit' && { status: formValue.status })
        };

        const operation = this.mode === 'edit' && this.training
            ? this.trainingsAdminService.update(this.training.id, payload)
            : this.trainingsAdminService.create(payload);

        operation.subscribe({
            next: async (result) => {
                const message = this.mode === 'edit' ? 'Capacitación actualizada correctamente' : 'Capacitación creada correctamente';
                await this.toastService.success(message);
                this.modalCtrl.dismiss(result, 'save');
            },
            error: async (error) => {
                let errorMessage = 'Error al procesar la solicitud';
                if (error.error?.message) {
                    errorMessage = Array.isArray(error.error.message) ? error.error.message.join(', ') : error.error.message;
                }
                await this.toastService.error(errorMessage);
                this.isSubmitting = false;
            }
        });
    }
}
