import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonProgressBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { schoolOutline, alertCircleOutline, checkmarkCircleOutline, timeOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TrainingsEmployeeService } from './services/trainings-employee.service';
import { MyTrainingListItem, AssignmentStatus } from './models/my-training.model';

@Component({
    selector: 'app-employee-trainings',
    templateUrl: './trainings.page.html',
    styleUrls: ['./trainings.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonIcon,
        IonSpinner,
        IonBadge,
        IonProgressBar,
        PageHeaderComponent
    ]
})
export class EmployeeTrainingsPage implements OnInit {
    trainings: MyTrainingListItem[] = [];
    isLoading = false;

    constructor(
        private trainingsService: TrainingsEmployeeService,
        private router: Router
    ) {
        addIcons({ schoolOutline, alertCircleOutline, checkmarkCircleOutline, timeOutline });
    }

    ngOnInit() {
        this.loadTrainings();
    }

    ionViewWillEnter() {
        this.loadTrainings();
    }

    loadTrainings() {
        this.isLoading = true;
        this.trainingsService.getMyTrainings().subscribe({
            next: (trainings) => {
                this.trainings = trainings;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading trainings:', error);
                this.isLoading = false;
            }
        });
    }

    openTraining(item: MyTrainingListItem) {
        this.router.navigate(['/employee/trainings', item.training.id]);
    }

    getProgressValue(item: MyTrainingListItem): number {
        if (item.progress.total === 0) return 0;
        return item.progress.completed / item.progress.total;
    }

    getStatusLabel(status: AssignmentStatus): string {
        const labels: Record<AssignmentStatus, string> = {
            pending: 'Pendiente',
            in_progress: 'En progreso',
            completed: 'Completada'
        };
        return labels[status] ?? status;
    }

    getStatusColor(status: AssignmentStatus): string {
        const colors: Record<AssignmentStatus, string> = {
            pending: 'medium',
            in_progress: 'warning',
            completed: 'success'
        };
        return colors[status] ?? 'medium';
    }

    formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    get mandatoryPending(): MyTrainingListItem[] {
        return this.trainings.filter(
            t => t.training.isMandatory && t.assignment.status !== 'completed'
        );
    }
}
