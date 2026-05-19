import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, callOutline, cardOutline } from 'ionicons/icons';
import { Employee } from '../../models/employee.model';

@Component({
    selector: 'app-employee-card',
    templateUrl: './employee-card.component.html',
    styleUrls: ['./employee-card.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon,
        IonBadge
    ]
})
export class EmployeeCardComponent {
    @Input() employee!: Employee;
    @Output() cardClick = new EventEmitter<Employee>();

    constructor() {
        addIcons({ personOutline, mailOutline, callOutline, cardOutline });
    }

    onCardClick() {
        this.cardClick.emit(this.employee);
    }

    get fullName(): string {
        return `${this.employee.firstName} ${this.employee.lastName}`;
    }

    get userRoleLabel(): string {
        if (!this.employee.user || !this.employee.user.isActive) {
            return 'Sin credenciales';
        }
        // roles es un array, tomamos el primer rol
        const roles = this.employee.user.roles;
        if (!roles || roles.length === 0) {
            return 'Sin rol';
        }
        
        const role = roles[0]; // Tomamos el primer rol
        const roleLabels: { [key: string]: string } = {
            'ADMIN': 'Administrador',
            'EMPLOYEE': 'Empleado',
            'FINANCE': 'Finanzas',
            'HR_MANAGER': 'RRHH'
        };
        return roleLabels[role] || role;
    }

    get userRoleBadgeColor(): string {
        if (!this.employee.user || !this.employee.user.isActive) {
            return 'medium';
        }
        const roles = this.employee.user.roles;
        if (!roles || roles.length === 0) {
            return 'medium';
        }
        
        const role = roles[0];
        const roleColors: { [key: string]: string } = {
            'ADMIN': 'danger',
            'EMPLOYEE': 'primary',
            'FINANCE': 'tertiary',
            'HR_MANAGER': 'warning'
        };
        return roleColors[role] || 'dark';
    }

    get contractStatusLabel(): string {
        if (!this.employee.contracts || this.employee.contracts.length === 0) {
            return 'Sin contrato';
        }
        
        // Buscar el contrato más reciente por startDate
        const latestContract = this.employee.contracts.reduce((latest, current) => {
            const latestDate = new Date(latest.startDate);
            const currentDate = new Date(current.startDate);
            return currentDate > latestDate ? current : latest;
        });

        const status = latestContract.status;
        const statusLabels: { [key: string]: string } = {
            'ACTIVE': 'Activo',
            'SUSPENDED': 'Suspendido',
            'LIQUIDATED': 'Liquidado',
            'DRAFT': 'Borrador'
        };
        return statusLabels[status] || status;
    }

    get contractStatusBadgeColor(): string {
        if (!this.employee.contracts || this.employee.contracts.length === 0) {
            return 'medium';
        }
        
        // Buscar el contrato más reciente por startDate
        const latestContract = this.employee.contracts.reduce((latest, current) => {
            const latestDate = new Date(latest.startDate);
            const currentDate = new Date(current.startDate);
            return currentDate > latestDate ? current : latest;
        });

        const status = latestContract.status;
        const statusColors: { [key: string]: string } = {
            'ACTIVE': 'success',
            'SUSPENDED': 'warning',
            'LIQUIDATED': 'danger',
            'DRAFT': 'medium'
        };
        return statusColors[status] || 'medium';
    }
}
