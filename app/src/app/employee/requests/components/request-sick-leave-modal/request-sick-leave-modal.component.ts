import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, IonButton, IonProgressBar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentAttachOutline, closeCircleOutline, calendarOutline } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';
import { MediaService } from '../../../../admin/media/services/media.service';
import { Attachment } from '../../../../admin/media/models/attachment.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-request-sick-leave-modal',
    templateUrl: './request-sick-leave-modal.component.html',
    styleUrls: ['./request-sick-leave-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent,
        IonIcon,
        IonButton,
        IonProgressBar
    ]
})
export class RequestSickLeaveModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    
    // Upload state
    isUploading = false;
    uploadProgress = 0;
    uploadedFileUrl: string | null = null;
    uploadedFileName: string | null = null;

    // Date constraints
    minDate: Date;
    maxDate: Date;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private mediaService: MediaService,
        private toastService: ToastService
    ) {
        addIcons({ cloudUploadOutline, documentAttachOutline, closeCircleOutline, calendarOutline });

        // Configurar fechas permitidas
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);
        
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 6); // Hasta 6 meses adelante
    }

    ngOnInit() {
        this.form = this.fb.group({
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            attachmentUrl: [''] // Opcional
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formValue = this.form.value;
            
            // Validar que la fecha de fin sea posterior a la de inicio
            const startDate = new Date(formValue.startDate);
            const endDate = new Date(formValue.endDate);
            
            if (endDate < startDate) {
                await this.toastService.error('La fecha de fin debe ser posterior a la fecha de inicio');
                this.isSubmitting = false;
                return;
            }

            const requestDto: any = {
                type: RequestType.SICK_LEAVE,
                details: {
                    startDate: formValue.startDate,
                    endDate: formValue.endDate
                }
            };

            // Agregar attachmentUrl solo si se proporcionó
            if (formValue.attachmentUrl && formValue.attachmentUrl.trim()) {
                requestDto.details.attachmentUrl = formValue.attachmentUrl.trim();
            }

            this.requestsService.createRequest(requestDto).subscribe({
                next: async (response) => {
                    await this.toastService.success('Solicitud de incapacidad enviada correctamente');
                    this.modalCtrl.dismiss({
                        success: true,
                        request: response,
                        refreshNeeded: true
                    }, 'save');
                },
                error: async (error) => {
                    console.error('Error creating request:', error);
                    const errorMessage = error.error?.message || error.message || 'Error al enviar la solicitud';
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }

    getDaysCount(): number {
        const startDateValue = this.form.get('startDate')?.value;
        const endDateValue = this.form.get('endDate')?.value;
        
        if (!startDateValue || !endDateValue) return 0;
        
        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
        
        return diffDays;
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

        this.mediaService.upload(file, { folder: 'requests', title: 'Comprobante Incapacidad' }).subscribe({
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
