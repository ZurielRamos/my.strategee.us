import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    AlertController,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    arrowBackOutline,
    createOutline,
    trashOutline,
    cloudUploadOutline,
    peopleOutline,
    chevronUpOutline,
    chevronDownOutline,
    documentTextOutline,
    videocamOutline,
    helpCircleOutline,
    addOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TrainingsAdminService } from '../services/trainings-admin.service';
import { Training, TrainingMaterial } from '../models/training.model';
import { TrainingModalComponent } from '../components/training-modal/training-modal.component';
import { MaterialUploadModalComponent } from '../components/material-upload-modal/material-upload-modal.component';
import { ExclusionModalComponent } from '../components/exclusion-modal/exclusion-modal.component';
import { CompletionListComponent } from '../components/completion-list/completion-list.component';
import { QuizEditorComponent } from '../components/quiz-editor/quiz-editor.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-training-detail',
    templateUrl: './training-detail.page.html',
    styleUrls: ['./training-detail.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonBadge,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        PageHeaderComponent,
        CompletionListComponent,
        QuizEditorComponent
    ]
})
export class TrainingDetailPage implements OnInit {
    training: Training | null = null;
    isLoading = false;
    activeSegment: 'materials' | 'tracking' = 'materials';
    expandedQuizMaterialId: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private trainingsAdminService: TrainingsAdminService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private toastService: ToastService
    ) {
        addIcons({
            arrowBackOutline,
            createOutline,
            trashOutline,
            cloudUploadOutline,
            peopleOutline,
            chevronUpOutline,
            chevronDownOutline,
            documentTextOutline,
            videocamOutline,
            helpCircleOutline,
            addOutline
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadTraining(id);
        }
    }

    loadTraining(id: string) {
        this.isLoading = true;
        this.trainingsAdminService.findOne(id).subscribe({
            next: (training) => {
                this.training = training;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading training:', error);
                this.isLoading = false;
                this.toastService.error('Error al cargar la capacitación');
            }
        });
    }

    goBack() {
        this.router.navigate(['/admin/trainings']);
    }

    async openEditModal() {
        if (!this.training) return;

        const modal = await this.modalCtrl.create({
            component: TrainingModalComponent,
            componentProps: {
                mode: 'edit',
                training: this.training
            },
            cssClass: 'training-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role, data } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            this.training = data;
        }
    }

    async confirmDelete() {
        if (!this.training) return;

        const alert = await this.alertCtrl.create({
            header: 'Eliminar Capacitación',
            message: `¿Estás seguro de que deseas eliminar "${this.training.title}"? Esta acción no se puede deshacer.`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => {
                        this.deleteTraining();
                    }
                }
            ]
        });

        await alert.present();
    }

    private deleteTraining() {
        if (!this.training) return;

        this.trainingsAdminService.remove(this.training.id).subscribe({
            next: async () => {
                await this.toastService.success('Capacitación eliminada correctamente');
                this.router.navigate(['/admin/trainings']);
            },
            error: async (error) => {
                console.error('Error deleting training:', error);
                await this.toastService.error('Error al eliminar la capacitación');
            }
        });
    }

    async openUploadModal() {
        if (!this.training) return;

        const modal = await this.modalCtrl.create({
            component: MaterialUploadModalComponent,
            componentProps: {
                trainingId: this.training.id
            },
            cssClass: 'material-upload-modal',
            backdropDismiss: false
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadTraining(this.training.id);
        }
    }

    async openExclusionModal() {
        if (!this.training) return;

        const modal = await this.modalCtrl.create({
            component: ExclusionModalComponent,
            componentProps: {
                trainingId: this.training.id,
                assignmentMode: this.training.assignmentMode
            },
            cssClass: 'exclusion-modal',
            backdropDismiss: true
        });

        await modal.present();
    }

    async confirmDeleteMaterial(material: TrainingMaterial) {
        if (!this.training) return;

        const alert = await this.alertCtrl.create({
            header: 'Eliminar Material',
            message: `¿Estás seguro de que deseas eliminar "${material.title}"?`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => {
                        this.deleteMaterial(material);
                    }
                }
            ]
        });

        await alert.present();
    }

    private deleteMaterial(material: TrainingMaterial) {
        if (!this.training) return;

        this.trainingsAdminService.removeMaterial(this.training.id, material.id).subscribe({
            next: async () => {
                await this.toastService.success('Material eliminado correctamente');
                this.loadTraining(this.training!.id);
            },
            error: async (error) => {
                console.error('Error deleting material:', error);
                await this.toastService.error('Error al eliminar el material');
            }
        });
    }

    moveMaterialUp(index: number) {
        if (!this.training || index === 0) return;
        const materials = [...this.training.materials];
        const item = materials[index];
        const prev = materials[index - 1];

        const newItems = materials.map((m, i) => {
            if (i === index) return { ...m, orderIndex: prev.orderIndex };
            if (i === index - 1) return { ...m, orderIndex: item.orderIndex };
            return m;
        });

        this.training = { ...this.training, materials: newItems.sort((a, b) => a.orderIndex - b.orderIndex) };

        this.trainingsAdminService.reorderMaterials(this.training.id, [
            { materialId: item.id, orderIndex: prev.orderIndex },
            { materialId: prev.id, orderIndex: item.orderIndex }
        ]).subscribe({
            error: async () => {
                await this.toastService.error('Error al reordenar materiales');
                this.loadTraining(this.training!.id);
            }
        });
    }

    moveMaterialDown(index: number) {
        if (!this.training || index >= this.training.materials.length - 1) return;
        const materials = [...this.training.materials];
        const item = materials[index];
        const next = materials[index + 1];

        const newItems = materials.map((m, i) => {
            if (i === index) return { ...m, orderIndex: next.orderIndex };
            if (i === index + 1) return { ...m, orderIndex: item.orderIndex };
            return m;
        });

        this.training = { ...this.training, materials: newItems.sort((a, b) => a.orderIndex - b.orderIndex) };

        this.trainingsAdminService.reorderMaterials(this.training.id, [
            { materialId: item.id, orderIndex: next.orderIndex },
            { materialId: next.id, orderIndex: item.orderIndex }
        ]).subscribe({
            error: async () => {
                await this.toastService.error('Error al reordenar materiales');
                this.loadTraining(this.training!.id);
            }
        });
    }

    toggleQuizEditor(materialId: string) {
        this.expandedQuizMaterialId = this.expandedQuizMaterialId === materialId ? null : materialId;
    }

    onQuizSaved(materialId: string) {
        this.expandedQuizMaterialId = null;
        this.loadTraining(this.training!.id);
    }

    onQuizDeleted(materialId: string) {
        this.expandedQuizMaterialId = null;
        this.loadTraining(this.training!.id);
    }

    get sortedMaterials(): TrainingMaterial[] {
        if (!this.training?.materials) return [];
        return [...this.training.materials].sort((a, b) => a.orderIndex - b.orderIndex);
    }

    getMaterialTypeIcon(mimeType: string | undefined): string {
        if (mimeType?.startsWith('video/')) return 'videocam-outline';
        return 'document-text-outline';
    }

    getMaterialTypeLabel(mimeType: string | undefined): string {
        if (mimeType?.startsWith('video/')) return 'Video';
        return 'PDF';
    }

    get statusLabel(): string {
        const labels: Record<string, string> = {
            draft: 'Borrador',
            active: 'Activa',
            inactive: 'Inactiva',
            expired: 'Expirada'
        };
        return labels[this.training?.status ?? ''] ?? (this.training?.status ?? '');
    }

    get statusBadgeColor(): string {
        const colors: Record<string, string> = {
            draft: 'medium',
            active: 'success',
            inactive: 'warning',
            expired: 'danger'
        };
        return colors[this.training?.status ?? ''] ?? 'medium';
    }

    formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}
