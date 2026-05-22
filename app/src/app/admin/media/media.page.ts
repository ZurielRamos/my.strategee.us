import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonImg,
    IonChip,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonFab,
    IonFabButton
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
    addOutline, 
    createOutline, 
    trashOutline, 
    eyeOutline, 
    cloudUploadOutline,
    imageOutline,
    documentOutline,
    videocamOutline,
    musicalNoteOutline,
    searchOutline,
    filterOutline,
    folderOutline,
    swapVerticalOutline,
    closeCircleOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { MediaService } from './services/media.service';
import { Attachment, AttachmentType, AttachmentFolder } from './models/attachment.model';
import { MediaUploadModalComponent } from './components/media-upload-modal/media-upload-modal.component';
import { MediaDetailModalComponent } from './components/media-detail-modal/media-detail-modal.component';

@Component({
    selector: 'app-media',
    templateUrl: './media.page.html',
    styleUrls: ['./media.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonCard,
        IonCardContent,
        IonSpinner,
        IonImg,
        IonChip,
        IonLabel,
        IonSelect,
        IonSelectOption,
        IonItem,
        IonFab,
        IonFabButton,
        PageHeaderComponent,
        PageTitleComponent
    ]
})
export class MediaPage implements OnInit {
    mediaFiles: Attachment[] = [];
    isLoading = false;
    selectedType?: AttachmentType;
    selectedFolder?: AttachmentFolder;
    searchTitle = '';
    sortByDate: 'ASC' | 'DESC' = 'DESC';
    currentPage = 1;
    totalPages = 1;
    total = 0;
    searchTimeout: any;

    AttachmentType = AttachmentType;
    AttachmentFolder = AttachmentFolder;

    constructor(
        private mediaService: MediaService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {
        addIcons({ 
            addOutline, 
            createOutline, 
            trashOutline, 
            eyeOutline, 
            cloudUploadOutline,
            imageOutline,
            documentOutline,
            videocamOutline,
            musicalNoteOutline,
            searchOutline,
            filterOutline,
            folderOutline,
            swapVerticalOutline,
            closeCircleOutline
        });
    }

    ngOnInit() {
        this.loadMedia();
    }

    loadMedia() {
        this.isLoading = true;
        this.mediaService.getAll({
            type: this.selectedType,
            folder: this.selectedFolder,
            searchTitle: this.searchTitle || undefined,
            sortByDate: this.sortByDate,
            page: this.currentPage,
            limit: 20
        }).subscribe({
            next: (response) => {
                this.mediaFiles = response.data;
                this.total = response.total;
                this.totalPages = response.totalPages;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading media:', error);
                this.isLoading = false;
            }
        });
    }

    onFilterChange() {
        this.currentPage = 1;
        this.loadMedia();
    }

    onSearchChange() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadMedia();
        }, 500);
    }

    onHeaderSearchChange(searchValue: string) {
        this.searchTitle = searchValue;
        this.onSearchChange();
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedType || this.selectedFolder || this.searchTitle || this.sortByDate !== 'DESC');
    }

    clearFilters() {
        this.selectedType = undefined;
        this.selectedFolder = undefined;
        this.searchTitle = '';
        this.sortByDate = 'DESC';
        this.currentPage = 1;
        this.loadMedia();
    }

    async openUploadModal() {
        const modal = await this.modalCtrl.create({
            component: MediaUploadModalComponent,
            cssClass: 'media-upload-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadMedia();
        }
    }

    async openDetailModal(attachment: Attachment) {
        const modal = await this.modalCtrl.create({
            component: MediaDetailModalComponent,
            cssClass: 'media-detail-modal',
            componentProps: {
                attachment: attachment
            },
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'updated' || role === 'deleted') {
            this.loadMedia();
        }
    }

    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'image-outline';
        if (mimeType.startsWith('video/')) return 'videocam-outline';
        if (mimeType.startsWith('audio/')) return 'musical-note-outline';
        return 'document-outline';
    }

    getImageUrl(attachment: Attachment): string {
        return attachment.variants?.medium || attachment.url;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
