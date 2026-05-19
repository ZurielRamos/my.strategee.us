import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonItem, IonLabel, IonCheckbox, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TimeInputComponent } from '../../../../shared/components/time-input/time-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-request-ordinary-permission-modal',
    templateUrl: './request-ordinary-permission-modal.component.html',
    styleUrls: ['./request-ordinary-permission-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        TimeInputComponent,
        TextareaInputComponent,
        AlertBoxComponent,
        IonItem,
        IonLabel,
        IonCheckbox,
        IonIcon
    ]
})
export class RequestOrdinaryPermissionModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    minDate: Date;
    maxDate: Date;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private toastService: ToastService
    ) {
        addIcons({ timeOutline });

        // Configurar fechas mínima y máxima
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);
        
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 3);
    }

    ngOnInit() {
        this.form = this.fb.group({
            isUpToDate: [false, Validators.requiredTrue],
            date: ['', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            reason: ['', [Validators.required, Validators.maxLength(500)]],
            makeupProposal: ['', [Validators.required, Validators.maxLength(500)]]
        });
    }

    getDuration(): string {
        const startTime = this.form.get('startTime')?.value;
        const endTime = this.form.get('endTime')?.value;
        
        if (!startTime || !endTime) return '';
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) return '';
        
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        if (hours === 0) {
            return `${minutes} minutos`;
        } else if (minutes === 0) {
            return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
            return `${hours}h ${minutes}m`;
        }
    }

    onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.form.value;
            
            // Combinar fecha con horas
            const selectedDate = new Date(formValue.date);
            const [startHours, startMinutes] = formValue.startTime.split(':').map(Number);
            const [endHours, endMinutes] = formValue.endTime.split(':').map(Number);
            
            const exitDateTime = new Date(selectedDate);
            exitDateTime.setHours(startHours, startMinutes, 0, 0);
            
            const returnDateTime = new Date(selectedDate);
            returnDateTime.setHours(endHours, endMinutes, 0, 0);
            
            // Validar que la hora de salida sea anterior a la de regreso
            if (exitDateTime >= returnDateTime) {
                this.toastService.error('La hora de inicio debe ser anterior a la hora de fin');
                this.isSubmitting = false;
                return;
            }

            // Calcular duración en horas
            const durationMs = returnDateTime.getTime() - exitDateTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            
            // Validar duración mínima (al menos 30 minutos)
            if (durationHours < 0.5) {
                this.toastService.error('El permiso debe ser de al menos 30 minutos');
                this.isSubmitting = false;
                return;
            }

            const requestDto = {
                type: RequestType.ORDINARY_PERMISSION,
                details: {
                    isUpToDate: formValue.isUpToDate,
                    exitDateTime: exitDateTime.toISOString(),
                    returnDateTime: returnDateTime.toISOString(),
                    reason: formValue.reason.trim(),
                    makeupProposal: formValue.makeupProposal.trim()
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
                    console.error('Error creating request:', error);
                    
                    const errorMessage = error.error?.message 
                        || error.message 
                        || 'Error al procesar la solicitud. Por favor intenta nuevamente.';
                    
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}
