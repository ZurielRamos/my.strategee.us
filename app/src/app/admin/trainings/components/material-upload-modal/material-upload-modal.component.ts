import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
    IonProgressBar,
    IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentOutline, closeOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TrainingsAdminService } from '../../services/trainings-admin.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-material-upload-modal',
    templateUrl: './material-upload-modal.component.html',
    styleUrls: ['./material-upload-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        IonProgressBar,
        IonIcon
    ]
})
export class MaterialUploadModalComponent implements OnInit {
    @Input() trainingId!: string;

    form!: FormGroup;
    selectedFile: File | null = null;
    isUploading = false;
    uploadProgress = 0;
    previewUrl: string | null = null;
    fileError: string | null = null;

    readonly acceptedTypes = 'application/pdf,video/mp4,video/webm,video/ogg';

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private trainingsAdminService: TrainingsAdminService,
        private toastService: ToastService
    ) {
        addIcons({ cloudUploadOutline, documentOutline, closeOutline });
    }

    ngOnInit() {
        this.form = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(200)]]
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        this.fileError = null;
        this.previewUrl = null;
        this.selectedFile = null;

        if (!file) return;

        const validTypes = ['application/pdf', 'video/mp4', 'video/webm', 'video/ogg'];
        if (!validTypes.includes(file.type)) {
            this.fileError = 'Tipo de archivo no permitido. Solo se aceptan PDF y videos (MP4, WebM, OGG).';
            return;
        }

        this.selectedFile = file;

        if (file.type.startsWith('video/')) {
            this.previewUrl = URL.createObjectURL(file);
        }
    }

    get isVideo(): boolean {
        return !!this.selectedFile?.type.startsWith('video/');
    }

    get isPdf(): boolean {
        return this.selectedFile?.type === 'application/pdf';
    }

    get canSubmit(): boolean {
        return this.form.valid && !!this.selectedFile && !this.isUploading;
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    async onConfirm() {
        if (!this.canSubmit || !this.selectedFile) return;

        this.isUploading = true;
        this.uploadProgress = 0;

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            if (this.uploadProgress < 85) {
                this.uploadProgress += 10;
            }
        }, 300);

        this.trainingsAdminService
            .uploadMaterial(this.trainingId, this.selectedFile, this.form.value.title)
            .subscribe({
                next: async (result) => {
                    clearInterval(progressInterval);
                    this.uploadProgress = 100;
                    await this.toastService.success('Material subido correctamente');
                    this.modalCtrl.dismiss(result, 'save');
                },
                error: async (error) => {
                    clearInterval(progressInterval);
                    this.isUploading = false;
                    this.uploadProgress = 0;
                    console.error('Error uploading material:', error);
                    let errorMessage = 'Error al subir el material';
                    if (error.error?.message) {
                        errorMessage = Array.isArray(error.error.message)
                            ? error.error.message.join(', ')
                            : error.error.message;
                    }
                    await this.toastService.error(errorMessage);
                }
            });
    }
}
