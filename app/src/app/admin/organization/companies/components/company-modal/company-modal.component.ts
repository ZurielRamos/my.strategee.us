import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    IonButton,
    IonIcon,
    IonImg
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, trashOutline } from 'ionicons/icons';
import { Company } from '../../models/company.model';
import { AttachmentType } from '../../../../media/models/attachment.model';
import { AttachmentSelectorModalComponent } from 'src/app/shared/components/attachment-selector-modal/attachment-selector-modal.component';
import { BaseModalComponent } from 'src/app/shared/components/base-modal/base-modal.component';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { ToastService } from 'src/app/shared/services/toast.service';
import { CompaniesService } from '../../services/companies.service';

@Component({
    selector: 'app-company-modal',
    templateUrl: './company-modal.component.html',
    styleUrls: ['./company-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        IonButton,
        IonIcon,
        IonImg
    ]
})
export class CompanyModalComponent implements OnInit {
    @Input() company?: Company;
    @Input() mode: 'create' | 'edit' = 'create';

    companyForm!: FormGroup;
    isSubmitting = false;
    logoPreviewUrl?: string;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private toastService: ToastService,
        private companiesService: CompaniesService
    ) {
        addIcons({ imageOutline, trashOutline });
    }

    ngOnInit() {
        this.initForm();
        if (this.company?.logoUrl) {
            this.logoPreviewUrl = this.company.logoUrl;
        }
    }

    initForm() {
        this.companyForm = this.fb.group({
            name: [this.company?.name || '', [Validators.required]],
            legalName: [this.company?.legalName || '', [Validators.required]],
            nit: [this.company?.nit || '', [Validators.required]],
            address: [this.company?.address || '', [Validators.required]],
            logoId: [null]
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Empresa' : 'Nueva Empresa';
    }

    async openAttachmentSelector() {
        const modal = await this.modalCtrl.create({
            component: AttachmentSelectorModalComponent,
            componentProps: {
                filterType: AttachmentType.IMAGE,
                title: 'Seleccionar Logo',
                uploadButtonText: 'Subir Logo'
            },
            cssClass: 'attachment-selector-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'selected' && data) {
            this.logoPreviewUrl = data.variants?.small || data.url;
            this.companyForm.patchValue({ logoId: data.id });
        }
    }

    removeLogo() {
        this.logoPreviewUrl = undefined;
        this.companyForm.patchValue({ logoId: null });
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.companyForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const operation = this.mode === 'edit' && this.company?.id
                ? this.companiesService.update(this.company.id, this.companyForm.value)
                : this.companiesService.create(this.companyForm.value);
            
            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Cambios guardados correctamente'
                        : 'Empresa creada correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.message || 'Error al guardar los datos'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
