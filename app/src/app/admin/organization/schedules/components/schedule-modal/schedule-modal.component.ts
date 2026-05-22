import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonChip,
    IonLabel,
    IonItem,
    IonInput,
    IonTextarea,
    IonCheckbox,
    IonSpinner
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, trashOutline, createOutline } from 'ionicons/icons';
import { Schedule, DayOfWeek, ScheduleDay } from '../../models/schedule.model';

@Component({
    selector: 'app-schedule-modal',
    templateUrl: './schedule-modal.component.html',
    styleUrls: ['./schedule-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonChip,
        IonLabel,
        IonItem,
        IonInput,
        IonTextarea,
        IonCheckbox,
        IonSpinner
    ]
})
export class ScheduleModalComponent implements OnInit {
    @Input() schedule?: Schedule;
    @Input() mode: 'create' | 'edit' | 'view' = 'view';

    form!: FormGroup;
    isSubmitting = false;
    daysOfWeek = Object.values(DayOfWeek);

    constructor(
        private modalCtrl: ModalController,
        private fb: FormBuilder
    ) {
        addIcons({ closeOutline, trashOutline, createOutline });
    }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.form = this.fb.group({
            name: [this.schedule?.name || '', Validators.required],
            description: [this.schedule?.description || ''],
            dailySchedules: this.fb.array([])
        });

        // Initialize daily schedules
        if (this.schedule?.dailySchedules) {
            this.schedule.dailySchedules.forEach(day => {
                this.dailySchedulesArray.push(this.createDayFormGroup(day));
            });
        } else {
            // Create default schedule for all days
            this.daysOfWeek.forEach(day => {
                this.dailySchedulesArray.push(this.createDayFormGroup({
                    day,
                    isWorkDay: day !== DayOfWeek.SATURDAY && day !== DayOfWeek.SUNDAY,
                    entryTime: '08:00',
                    exitTime: '17:00'
                }));
            });
        }

        if (this.mode === 'view') {
            this.form.disable();
        }
    }

    createDayFormGroup(day?: Partial<ScheduleDay>): FormGroup {
        return this.fb.group({
            day: [day?.day || DayOfWeek.MONDAY],
            isWorkDay: [day?.isWorkDay ?? true],
            entryTime: [day?.entryTime || ''],
            exitTime: [day?.exitTime || ''],
            morningBreakStart: [day?.morningBreakStart || ''],
            morningBreakEnd: [day?.morningBreakEnd || ''],
            lunchStart: [day?.lunchStart || ''],
            lunchEnd: [day?.lunchEnd || ''],
            afternoonBreakStart: [day?.afternoonBreakStart || ''],
            afternoonBreakEnd: [day?.afternoonBreakEnd || '']
        });
    }

    get dailySchedulesArray(): FormArray {
        return this.form.get('dailySchedules') as FormArray;
    }

    getDayFormGroup(index: number): FormGroup {
        return this.dailySchedulesArray.at(index) as FormGroup;
    }

    onWorkDayChange(index: number, isWorkDay: boolean) {
        const dayGroup = this.getDayFormGroup(index);
        if (!isWorkDay) {
            // Clear all times when marking as non-work day
            dayGroup.patchValue({
                entryTime: '',
                exitTime: '',
                morningBreakStart: '',
                morningBreakEnd: '',
                lunchStart: '',
                lunchEnd: '',
                afternoonBreakStart: '',
                afternoonBreakEnd: ''
            });
        }
    }

    get title(): string {
        if (this.mode === 'create') return 'Crear Horario';
        if (this.mode === 'edit') return 'Editar Horario';
        return 'Detalles de Horario';
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    onEdit() {
        this.mode = 'edit';
        this.form.enable();
    }

    onDelete() {
        this.modalCtrl.dismiss(this.schedule, 'delete');
    }

    onToggleActive() {
        this.modalCtrl.dismiss(this.schedule, 'toggleActive');
    }

    async save() {
        if (this.form.invalid) {
            Object.keys(this.form.controls).forEach(key => {
                this.form.get(key)?.markAsTouched();
            });
            return;
        }

        this.isSubmitting = true;

        const formValue = this.form.value;
        const scheduleData = {
            ...formValue,
            dailySchedules: formValue.dailySchedules.map((day: any) => ({
                ...day,
                entryTime: day.isWorkDay && day.entryTime ? day.entryTime : null,
                exitTime: day.isWorkDay && day.exitTime ? day.exitTime : null,
                morningBreakStart: day.isWorkDay && day.morningBreakStart ? day.morningBreakStart : null,
                morningBreakEnd: day.isWorkDay && day.morningBreakEnd ? day.morningBreakEnd : null,
                lunchStart: day.isWorkDay && day.lunchStart ? day.lunchStart : null,
                lunchEnd: day.isWorkDay && day.lunchEnd ? day.lunchEnd : null,
                afternoonBreakStart: day.isWorkDay && day.afternoonBreakStart ? day.afternoonBreakStart : null,
                afternoonBreakEnd: day.isWorkDay && day.afternoonBreakEnd ? day.afternoonBreakEnd : null
            }))
        };

        this.modalCtrl.dismiss(scheduleData, this.mode === 'create' ? 'create' : 'save');
    }
}
