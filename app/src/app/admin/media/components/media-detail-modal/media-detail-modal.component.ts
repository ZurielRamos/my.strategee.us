import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSpinner,
    IonImg,
    IonChip
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
    closeOutline, 
    saveOutline, 
    trashOutline, 
    downloadOutline,
    documentOutline,
    videocamOutline,
    musicalNoteOutline
} from 'ionicons/icons';
import { MediaService } from '../../services/media.service';
import { Attachment, AttachmentType } from '../../models/attachment.model';

@Component({
    selector: 'app-media-detail-modal',
    templateUrl: './media-detail-modal.component.html',
    styleUrls: ['./media-detail-modal.component.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
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
        IonItem,
        IonLabel,
        IonInput,
        IonTextarea,
        IonSpinner,
        IonImg,
        IonChip
    ]
})
export class MediaDetailModalComponent implements OnInit {
    @Input() attachment!: Attachment;

    detailForm!: FormGroup;
    isSaving = false;
    AttachmentType = AttachmentType;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private mediaService: MediaService
    ) {
        addIcons({ 
            closeOutline, 
            saveOutline, 
            trashOutline, 
            downloadOutline,
            documentOutline,
            videocamOutline,
            musicalNoteOutline
        });
    }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.detailForm = this.fb.group({
            title: [this.attachment.title || ''],
            alt: [this.attachment.alt || ''],
            description: [this.attachment.description || '']
        });
    }

    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'image-outline';
        if (mimeType.startsWith('video/')) return 'videocam-outline';
        if (mimeType.startsWith('audio/')) return 'musical-note-outline';
        return 'document-outline';
    }

    getImageUrl(): string {
        return this.attachment.variants?.medium || this.attachment.url;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async save() {
        if (this.detailForm.invalid) return;

        this.isSaving = true;
        const formValue = this.detailForm.value;

        this.mediaService.update(this.attachment.id, formValue).subscribe({
            next: (updated) => {
                this.isSaving = false;
                this.modalCtrl.dismiss(updated, 'updated');
            },
            error: (error) => {
                console.error('Error updating attachment:', error);
                this.isSaving = false;
            }
        });
    }

    async confirmDelete() {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar "${this.attachment.title || this.attachment.name}"? Esta acción no se puede deshacer.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.deleteAttachment();
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteAttachment() {
        this.mediaService.delete(this.attachment.id).subscribe({
            next: () => {
                this.modalCtrl.dismiss(this.attachment.id, 'deleted');
            },
            error: (error) => {
                console.error('Error deleting attachment:', error);
            }
        });
    }

    downloadFile() {
        // Si es una imagen y tiene variants, descargar la original
        if (this.attachment.type === AttachmentType.IMAGE && this.attachment.variants?.original) {
            window.open(this.attachment.variants.original, '_blank');
        } else {
            window.open(this.attachment.url, '_blank');
        }
    }
}
