import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonImg,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, cloudUploadOutline, checkmarkCircle, imageOutline } from 'ionicons/icons';
import { MediaService } from '../../../admin/media/services/media.service';
import { Attachment, AttachmentType, AttachmentFolder } from '../../../admin/media/models/attachment.model';
import { MediaUploadModalComponent } from '../../../admin/media/components/media-upload-modal/media-upload-modal.component';

@Component({
    selector: 'app-attachment-selector-modal',
    templateUrl: './attachment-selector-modal.component.html',
    styleUrls: ['./attachment-selector-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        FormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonSpinner,
        IonCard,
        IonCardContent,
        IonImg,
        IonSearchbar,
        IonSelect,
        IonSelectOption,
        IonItem,
        IonLabel,
    ]
})
export class AttachmentSelectorModalComponent implements OnInit {
    @Input() selectedAttachmentId?: string;
    @Input() filterType?: AttachmentType;
    @Input() title: string = 'Seleccionar Recurso';
    @Input() allowUpload: boolean = true;
    @Input() uploadButtonText: string = 'Subir Nuevo';

    attachments: Attachment[] = [];
    isLoading = false;
    searchTitle = '';
    selectedFolder?: AttachmentFolder;
    selectedAttachment?: Attachment;

    AttachmentFolder = AttachmentFolder;

    constructor(
        private mediaService: MediaService,
        private modalCtrl: ModalController
    ) {
        addIcons({ closeOutline, cloudUploadOutline, checkmarkCircle, imageOutline });
    }

    ngOnInit() {
        this.loadAttachments();
    }

    loadAttachments() {
        this.isLoading = true;
        this.mediaService.getAll({
            type: this.filterType,
            folder: this.selectedFolder,
            searchTitle: this.searchTitle || undefined,
            sortByDate: 'DESC',
            page: 1,
            limit: 50
        }).subscribe({
            next: (response) => {
                this.attachments = response.data;
                if (this.selectedAttachmentId) {
                    this.selectedAttachment = this.attachments.find(a => a.id === this.selectedAttachmentId);
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading attachments:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange() {
        this.loadAttachments();
    }

    onFilterChange() {
        this.loadAttachments();
    }

    selectAttachment(attachment: Attachment) {
        this.selectedAttachment = attachment;
    }

    async openUploadModal() {
        const modal = await this.modalCtrl.create({
            component: MediaUploadModalComponent,
            cssClass: 'media-upload-modal media-upload-overlay',
            backdropDismiss: true,
            presentingElement: await this.modalCtrl.getTop()
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadAttachments();
        }
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    confirm() {
        if (this.selectedAttachment) {
            this.modalCtrl.dismiss(this.selectedAttachment, 'selected');
        }
    }

    getImageUrl(attachment: Attachment): string {
        return attachment.variants?.medium || attachment.url;
    }

    getTypeLabel(): string {
        if (!this.filterType) return 'recursos';
        
        const labels: Record<AttachmentType, string> = {
            [AttachmentType.IMAGE]: 'imágenes',
            [AttachmentType.DOCUMENT]: 'documentos',
            [AttachmentType.VIDEO]: 'videos',
            [AttachmentType.OTHER]: 'archivos'
        };
        
        return labels[this.filterType] || 'recursos';
    }
}
