import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, IonProgressBar, IonButton, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, documentAttachOutline, cloudUploadOutline } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TimeInputComponent } from '../../../../shared/components/time-input/time-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { MediaService } from '../../../../admin/media/services/media.service';
import { Attachment } from '../../../../admin/media/models/attachment.model';

@Component({
    selector: 'app-request-medical-appointment-modal',
    templateUrl: './request-medical-appointment-modal.component.html',
    styleUrls: ['./request-medical-appointment-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        TimeInputComponent,
        AlertBoxComponent,
        IonIcon,
        IonProgressBar,
        IonButton
    ]
})
export class RequestMedicalAppointmentModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    minDate: Date;
    maxDate: Date;
    
    // Upload state
    isUploading = false;
    uploadProgress = 0;
    uploadedFileUrl: string | null = null;
    uploadedFileName: string | null = null;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private toastService: ToastService,
        private mediaService: MediaService
    ) {
        addIcons({ timeOutline, documentAttachOutline, cloudUploadOutline });

        // Configurar fechas permitidas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.minDate = today;
        
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 3);
    }

    ngOnInit() {
        this.form = this.fb.group({
            date: ['', [Validators.required]],
            exitTime: ['', [Validators.required]],
            returnTime: ['', [Validators.required]],
            attachmentUrl: [''] // Opcional
        });
    }

    getDuration(): string {
        const exitTime = this.form.get('exitTime')?.value;
        const returnTime = this.form.get('returnTime')?.value;
        
        if (!exitTime || !returnTime) return '';
        
        const [exitHour, exitMin] = exitTime.split(':').map(Number);
        const [returnHour, returnMin] = returnTime.split(':').map(Number);
        
        const exitMinutes = exitHour * 60 + exitMin;
        const returnMinutes = returnHour * 60 + returnMin;
        
        if (exitMinutes >= returnMinutes) return '';
        
        const durationMinutes = returnMinutes - exitMinutes;
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

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.form.value;
            
            // Combinar fecha con horas
            const selectedDate = new Date(formValue.date);
            const [exitHours, exitMinutes] = formValue.exitTime.split(':').map(Number);
            const [returnHours, returnMinutes] = formValue.returnTime.split(':').map(Number);
            
            const exitDateTime = new Date(selectedDate);
            exitDateTime.setHours(exitHours, exitMinutes, 0, 0);
            
            const returnDateTime = new Date(selectedDate);
            returnDateTime.setHours(returnHours, returnMinutes, 0, 0);
            
            // Validar que la hora de salida sea anterior a la de regreso
            if (exitDateTime >= returnDateTime) {
                await this.toastService.error('La hora de salida debe ser anterior a la hora de regreso');
                this.isSubmitting = false;
                return;
            }

            // Calcular duración en horas
            const durationMs = returnDateTime.getTime() - exitDateTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            
            // Validar duración mínima (al menos 30 minutos)
            if (durationHours < 0.5) {
                await this.toastService.error('La cita debe ser de al menos 30 minutos');
                this.isSubmitting = false;
                return;
            }

            const requestDto: any = {
                type: RequestType.MEDICAL_APPOINTMENT,
                details: {
                    exitDateTime: exitDateTime.toISOString(),
                    returnDateTime: returnDateTime.toISOString()
                }
            };

            // Agregar attachmentUrl solo si se proporcionó
            if (formValue.attachmentUrl && formValue.attachmentUrl.trim()) {
                requestDto.details.attachmentUrl = formValue.attachmentUrl.trim();
            }

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
                    
                    let errorMessage = 'Error al procesar la solicitud';
                    if (error.error?.message) {
                        errorMessage = error.error.message;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.uploadFile(file);
        }
    }

    async uploadFile(file: File) {
        // Validar tipo de archivo
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            await this.toastService.error('Solo se permiten archivos PDF o imágenes (JPG, PNG)');
            return;
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            await this.toastService.error('El archivo no debe superar los 5MB');
            return;
        }

        this.isUploading = true;
        this.uploadProgress = 0;

        this.mediaService.upload(file, { folder: 'requests', title: 'Comprobante Cita Médica' }).subscribe({
            next: (response: Attachment) => {
                this.uploadedFileUrl = response.url;
                this.uploadedFileName = file.name;
                this.form.patchValue({ attachmentUrl: response.url });
                this.isUploading = false;
                this.uploadProgress = 100;
            },
            error: async (error: any) => {
                console.error('Error uploading file:', error);
                await this.toastService.error('Error al subir el archivo. Por favor intenta nuevamente');
                this.isUploading = false;
                this.uploadProgress = 0;
            }
        });
    }

    removeUploadedFile() {
        this.uploadedFileUrl = null;
        this.uploadedFileName = null;
        this.uploadProgress = 0;
        this.form.patchValue({ attachmentUrl: '' });
    }

    triggerFileInput() {
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }
}
