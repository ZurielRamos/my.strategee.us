import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonItem, IonLabel, IonInput, ModalController } from '@ionic/angular/standalone';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

enum DocumentType {
    LABOR_CERTIFICATE = 'CERTIFICADO_LABORAL',
    PAYROLL_PROOF = 'COMPROBANTE_NOMINA'
}

@Component({
    selector: 'app-request-document-modal',
    templateUrl: './request-document-modal.component.html',
    styleUrls: ['./request-document-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        TextareaInputComponent,
        AlertBoxComponent,
        IonItem,
        IonLabel,
        IonInput
    ]
})
export class RequestDocumentModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    
    documentTypes = [
        { value: DocumentType.LABOR_CERTIFICATE, label: 'Certificado Laboral' },
        { value: DocumentType.PAYROLL_PROOF, label: 'Comprobante de Nómina' }
    ];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            documentType: ['', Validators.required],
            addressedTo: [''], // Opcional, por defecto será "A quien pueda interesar"
            notes: [''] // Opcional
        });
    }

    get documentTypeOptions(): SelectOption[] {
        return this.documentTypes.map(type => ({
            value: type.value,
            label: type.label
        }));
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formValue = this.form.value;

            const requestDto = {
                type: RequestType.DOCUMENT,
                details: {
                    documentType: formValue.documentType,
                    addressedTo: formValue.addressedTo?.trim() || 'A quien pueda interesar',
                    notes: formValue.notes?.trim() || undefined
                }
            };

            this.requestsService.createRequest(requestDto).subscribe({
                next: async (response) => {
                    await this.toastService.success('Solicitud de documento enviada correctamente');
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
}
