import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, calendarOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { ShiftSelectorComponent, ShiftOption } from '../../../../shared/components/shift-selector/shift-selector.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';

enum DayShift {
    MORNING = 'MANANA',
    AFTERNOON = 'TARDE'
}

@Component({
    selector: 'app-request-birthday-modal',
    templateUrl: './request-birthday-modal.component.html',
    styleUrls: ['./request-birthday-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        ShiftSelectorComponent,
        AlertBoxComponent,
        IonIcon
    ]
})
export class RequestBirthdayModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    
    minDate: Date;
    maxDate: Date;
    
    shiftOptions: ShiftOption[] = [
        { value: DayShift.MORNING, label: 'Mañana', icon: 'time-outline' },
        { value: DayShift.AFTERNOON, label: 'Tarde', icon: 'time-outline' }
    ];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private toastService: ToastService
    ) {
        addIcons({ timeOutline, calendarOutline });
        
        // Configurar rango de fechas permitido
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.minDate = today;
        
        // Permitir seleccionar hasta 2 meses adelante
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 2);
    }

    ngOnInit() {
        this.form = this.fb.group({
            date: ['', [Validators.required]],
            shift: ['', [Validators.required]]
        });
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.form.value;
            
            const requestDto = {
                type: RequestType.BIRTHDAY,
                details: {
                    date: formValue.date.split('T')[0], // Solo YYYY-MM-DD
                    shift: formValue.shift,
                    amount: 0.5 // Siempre medio día
                }
            };

            this.requestsService.createRequest(requestDto).subscribe({
                next: async (response) => {
                    await this.toastService.success('Solicitud enviada correctamente');
                    this.modalCtrl.dismiss({
                        success: true,
                        request: response,
                        refreshNeeded: true
                    }, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || error.message || 'Error al enviar la solicitud'
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
