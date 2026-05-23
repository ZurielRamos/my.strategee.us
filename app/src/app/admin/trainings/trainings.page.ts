import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, schoolOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TrainingsAdminService } from './services/trainings-admin.service';
import { Training } from './models/training.model';
import { TrainingCardComponent } from './components/training-card/training-card.component';
import { TrainingModalComponent } from './components/training-modal/training-modal.component';

@Component({
    selector: 'app-trainings',
    templateUrl: './trainings.page.html',
    styleUrls: ['./trainings.page.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonFab,
        IonFabButton,
        PageHeaderComponent,
        TrainingCardComponent
    ]
})
export class TrainingsPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    trainings: Training[] = [];
    isLoading = false;
    isLoadingMore = false;

    currentPage = 1;
    totalPages = 1;
    limit = 20;

    constructor(
        private trainingsAdminService: TrainingsAdminService,
        private modalCtrl: ModalController,
        private router: Router
    ) {
        addIcons({ addOutline, schoolOutline });
    }

    ngOnInit() {
        this.loadTrainings();
    }

    loadTrainings(append: boolean = false) {
        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
            this.trainings = [];
            this.currentPage = 1;
        }

        this.trainingsAdminService.findAll(this.currentPage, this.limit).subscribe({
            next: (response) => {
                if (append) {
                    this.trainings = [...this.trainings, ...response.data];
                } else {
                    this.trainings = response.data;
                }
                this.totalPages = response.totalPages;
                this.isLoading = false;
                this.isLoadingMore = false;
            },
            error: (error) => {
                console.error('Error loading trainings:', error);
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        });
    }

    async onScroll(event: any) {
        const scrollElement = await this.content.getScrollElement();
        const scrollTop = scrollElement.scrollTop;
        const scrollHeight = scrollElement.scrollHeight;
        const clientHeight = scrollElement.clientHeight;

        const threshold = scrollHeight * 0.8;

        if (
            scrollTop + clientHeight >= threshold &&
            !this.isLoadingMore &&
            !this.isLoading &&
            this.currentPage < this.totalPages
        ) {
            this.currentPage++;
            this.loadTrainings(true);
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: TrainingModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'training-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadTrainings();
        }
    }

    viewTrainingDetail(training: Training) {
        this.router.navigate(['/admin/trainings', training.id]);
    }
}
