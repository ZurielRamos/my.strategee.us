import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonIcon, ModalController, AlertController, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentAttachOutline, closeCircleOutline } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { MediaService } from '../../../../admin/media/services/media.service';
import { Attachment } from '../../../../admin/media/models/attachment.model';
import { RequestType } from '../../models/request.model';
import { SystemSettingsService } from '../../../../shared/services/system-settings.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

export enum AccumulationReason {
    SATURDAY_WORK = 'TRABAJO_SABADO',
    SUNDAY_WORK = 'TRABAJO_DOMINGO',
    HOLIDAY_WORK = 'TRABAJO_FESTIVO',
    VOTING_CERTIFICATE = 'CERTIFICADO_VOTACION'
}

@Component({
    selector: 'app-request-compensated-accumulation-modal',
    templateUrl: './request-compensated-accumulation-modal.component.html',
    styleUrls: ['./request-compensated-accumulation-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        TextareaInputComponent,
        FormSelectComponent,
        AlertBoxComponent,
        IonButton,
        IonIcon
    ]
})
export class RequestCompensatedAccumulationModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    minDate: Date;
    maxDate: Date;
    hoursPerDay: number | null = null;
    uploadedFileName: string = '';
    
    reasonOptions: SelectOption[] = [
        { value: AccumulationReason.SATURDAY_WORK, label: 'Trabajo sábado en la tarde más de 4 horas' },
        { value: AccumulationReason.SUNDAY_WORK, label: 'Trabajo domingo más de 4 horas' },
        { value: AccumulationReason.HOLIDAY_WORK, label: 'Trabajo festivo más de 4 horas' },
        { value: AccumulationReason.VOTING_CERTIFICATE, label: 'Certificado de votación' }
    ];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private mediaService: MediaService,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private systemSettingsService: SystemSettingsService,
        private toastService: ToastService
    ) {
        addIcons({ cloudUploadOutline, documentAttachOutline, closeCircleOutline });
        
        // Configurar fechas - permitir fechas pasadas y futuras
        this.minDate = new Date();
        this.minDate.setMonth(this.minDate.getMonth() - 3); // Hasta 3 meses atrás
        
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 1); // Hasta 1 mes adelante
    }

    ngOnInit() {
        this.form = this.fb.group({
            date: ['', Validators.required],
            days: [1, Validators.required],
            reason: [AccumulationReason.SATURDAY_WORK, Validators.required],
            proofUrl: ['', Validators.required],
            comments: ['', Validators.maxLength(500)]
        });

        // Cargar horas por día desde configuración
        this.systemSettingsService.getHoursPerWorkday().subscribe({
            next: (hours) => {
                this.hoursPerDay = hours;
            },
            error: (error) => {
                console.error('Error loading hours per day:', error);
            }
        });
    }

    get daysOptions(): SelectOption[] {
        const options = [0.5, 1, 2, 3];
        return options.map(option => ({
            value: option,
            label: `${option} ${option === 1 ? 'día' : 'días'}${this.hoursPerDay ? ` (${option * this.hoursPerDay} horas)` : ''}`
        }));
    }

    get calculatedHours(): number {
        const days = this.form.get('days')?.value || 0;
        return this.hoursPerDay ? days * this.hoursPerDay : 0;
    }

    async uploadProof() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        
        input.onchange = async (event: any) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validar tipo
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                await this.toastService.error('Solo se permiten archivos PDF o imágenes (JPG, PNG)');
                return;
            }

            // Validar tamaño (máximo 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                await this.toastService.error('El archivo no debe superar los 5MB');
                return;
            }

            const loading = await this.loadingCtrl.create({
                message: 'Subiendo comprobante...',
                spinner: 'crescent'
            });
            await loading.present();

            this.mediaService.upload(file, { folder: 'requests', title: 'Comprobante Acumulación' }).subscribe({
                next: async (attachment: Attachment) => {
                    await loading.dismiss();
                    this.form.patchValue({ proofUrl: attachment.url });
                    this.uploadedFileName = file.name;
                    await this.toastService.success('Comprobante subido correctamente');
                },
                error: async (error) => {
                    await loading.dismiss();
                    console.error('Error uploading file:', error);
                    await this.toastService.error('No se pudo subir el archivo. Por favor intenta nuevamente.');
                }
            });
        };

        input.click();
    }

    removeProof() {
        this.form.patchValue({ proofUrl: '' });
        this.uploadedFileName = '';
    }

    onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.form.value;
            
            const requestDto = {
                type: RequestType.COMPENSATED_TIME_ACCUMULATION,
                details: {
                    date: formValue.date,
                    days: formValue.days,
                    reason: formValue.reason,
                    proofUrl: formValue.proofUrl,
                    comments: formValue.comments?.trim() || '',
                    calculatedHours: this.calculatedHours
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
