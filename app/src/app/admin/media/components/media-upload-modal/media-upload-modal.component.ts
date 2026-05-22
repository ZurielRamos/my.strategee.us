import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
    IonIcon,
    IonButton,
    IonProgressBar
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, closeOutline } from 'ionicons/icons';
import { MediaService } from '../../services/media.service';
import { AttachmentFolder } from '../../models/attachment.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-media-upload-modal',
    templateUrl: './media-upload-modal.component.html',
    styleUrls: ['./media-upload-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonIcon,
        IonButton,
        IonProgressBar,
        BaseModalComponent,
        TextInputComponent,
        FormSelectComponent
    ]
})
export class MediaUploadModalComponent implements OnInit {
    uploadForm!: FormGroup;
    isSubmitting = false;
    selectedFile: File | null = null;
    filePreview: string | null = null;
    dragOver = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private mediaService: MediaService,
        private toastService: ToastService
    ) {
        addIcons({ cloudUploadOutline, documentOutline, closeOutline });
    }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.uploadForm = this.fb.group({
            title: [''],
            folder: [AttachmentFolder.GENERAL],
            description: [''],
            alt: ['']
        });
    }

    // Getter para formatear opciones del select de tipo de media
    get mediaTypeOptions(): SelectOption[] {
        return [
            { value: AttachmentFolder.GENERAL, label: 'General' },
            { value: AttachmentFolder.EMPLOYEES, label: 'Empleados' },
            { value: AttachmentFolder.CONTRACTS, label: 'Contratos' },
            { value: AttachmentFolder.REQUESTS, label: 'Solicitudes' },
            { value: AttachmentFolder.LOGOS, label: 'Logos' }
        ];
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver = false;

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.handleFile(event.dataTransfer.files[0]);
        }
    }

    handleFile(file: File) {
        this.selectedFile = file;

        // Generate preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.filePreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            this.filePreview = null;
        }
    }

    removeFile() {
        this.selectedFile = null;
        this.filePreview = null;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (!this.selectedFile || this.isSubmitting) return;

        this.isSubmitting = true;
        const metadata = {
            folder: this.uploadForm.value.folder || AttachmentFolder.GENERAL,
            title: this.uploadForm.value.title || undefined,
            description: this.uploadForm.value.description || undefined,
            alt: this.uploadForm.value.alt || undefined
        };

        this.mediaService.upload(this.selectedFile, metadata).subscribe({
            next: async (response) => {
                await this.toastService.success('Archivo subido correctamente');
                this.modalCtrl.dismiss(response, 'save');
            },
            error: async (error) => {
                await this.toastService.error(
                    error.message || 'Error al subir el archivo'
                );
                this.isSubmitting = false;
            }
        });
    }
}
