import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonSpinner,
    IonBadge,
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonLabel
} from '@ionic/angular/standalone';
import { TrainingsAdminService } from '../../services/trainings-admin.service';
import { CompletionReport, CompletionReportAssignment, AssignmentStatus } from '../../models/training.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-completion-list',
    templateUrl: './completion-list.component.html',
    styleUrls: ['./completion-list.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonSpinner,
        IonBadge,
        IonProgressBar,
        IonSegment,
        IonSegmentButton,
        IonLabel
    ]
})
export class CompletionListComponent implements OnInit {
    @Input() trainingId!: string;

    report: CompletionReport | null = null;
    isLoading = false;
    selectedStatus: AssignmentStatus | 'all' = 'all';

    constructor(
        private trainingsAdminService: TrainingsAdminService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.loadReport();
    }

    loadReport() {
        this.isLoading = true;
        const status = this.selectedStatus !== 'all' ? this.selectedStatus : undefined;

        this.trainingsAdminService.getCompletionReport(this.trainingId, status).subscribe({
            next: (report) => {
                this.report = report;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading completion report:', error);
                this.isLoading = false;
                this.toastService.error('Error al cargar el reporte de completitud');
            }
        });
    }

    onStatusChange() {
        this.loadReport();
    }

    get filteredAssignments(): CompletionReportAssignment[] {
        if (!this.report) return [];
        if (this.selectedStatus === 'all') return this.report.assignments;
        return this.report.assignments.filter(a => a.status === this.selectedStatus);
    }

    getStatusLabel(status: AssignmentStatus): string {
        const labels: Record<AssignmentStatus, string> = {
            pending: 'Pendiente',
            in_progress: 'En progreso',
            completed: 'Completado'
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

    formatDate(dateStr: string | null): string {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    get progressValue(): number {
        if (!this.report) return 0;
        return this.report.completionPercentage / 100;
    }
}
