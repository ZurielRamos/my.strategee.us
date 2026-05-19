import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent, IonIcon, IonButton, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    peopleOutline, documentTextOutline, calendarOutline,
    checkmarkCircleOutline, timeOutline, closeCircleOutline,
    trendingUpOutline, briefcaseOutline, cashOutline,
    alertCircleOutline, refreshOutline, businessOutline,
    personAddOutline, statsChartOutline
} from 'ionicons/icons';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { DashboardService, DashboardData, RecentRequest } from './dashboard.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.scss'],
    standalone: true,
    imports: [
        IonContent, CommonModule,
        IonIcon, IonButton, IonSpinner,
        PageHeaderComponent, PageTitleComponent
    ]
})
export class DashboardPage implements OnInit {
    data: DashboardData | null = null;
    isLoading = true;
    today = new Date();
    todayLabel = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    quickActions = [
        { title: 'Empleados', icon: 'people-outline', route: '/admin/organization/employees', color: 'primary' },
        { title: 'Solicitudes', icon: 'document-text-outline', route: '/admin/operations/requests', color: 'secondary' },
        { title: 'Contratos', icon: 'briefcase-outline', route: '/admin/finance/contracts', color: 'tertiary' },
        { title: 'Compensaciones', icon: 'cash-outline', route: '/admin/finance/compensation', color: 'success' }
    ];

    constructor(
        private router: Router,
        private dashboardService: DashboardService
    ) {
        addIcons({
            peopleOutline, documentTextOutline, calendarOutline,
            checkmarkCircleOutline, timeOutline, closeCircleOutline,
            trendingUpOutline, briefcaseOutline, cashOutline,
            alertCircleOutline, refreshOutline, businessOutline,
            personAddOutline, statsChartOutline
        });
    }

    ngOnInit() {
        this.load();
    }

    load() {
        this.isLoading = true;
        this.dashboardService.loadDashboard().subscribe({
            next: (data) => {
                this.data = data;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    navigateTo(route: string) {
        this.router.navigate([route]);
    }

    getStatusColor(status: string): string {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'medium';
            default: return 'medium';
        }
    }

    getStatusLabel(status: string): string {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'Aprobada';
            case 'REJECTED': return 'Rechazada';
            case 'PENDING': return 'Pendiente';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
        }
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            VACATION: 'Vacaciones',
            SICK_LEAVE: 'Incapacidad',
            ORDINARY_PERMISSION: 'Permiso',
            MEDICAL_APPOINTMENT: 'Cita médica',
            DOCUMENT: 'Documento',
            BIRTHDAY: 'Cumpleaños',
            HOME_OFFICE: 'Home Office',
            BENEFIT: 'Beneficio',
        };
        return labels[type] ?? type;
    }

    activePercent(): number {
        if (!this.data || this.data.totalEmployees === 0) return 0;
        return Math.round((this.data.activeEmployees / this.data.totalEmployees) * 100);
    }
}
