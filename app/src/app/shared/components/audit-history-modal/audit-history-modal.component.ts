import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, timeOutline, personOutline } from 'ionicons/icons';
import { AuditService, AuditLog } from '../../services/audit.service';

@Component({
    selector: 'app-audit-history-modal',
    templateUrl: './audit-history-modal.component.html',
    styleUrls: ['./audit-history-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner
    ]
})
export class AuditHistoryModalComponent implements OnInit {
    @Input() entityName: string = '';
    @Input() entityId: string = '';
    @Input() title: string = 'Historial de Cambios';

    auditLogs: AuditLog[] = [];
    loading = true;

    constructor(
        private modalController: ModalController,
        private auditService: AuditService
    ) {
        addIcons({ closeOutline, timeOutline, personOutline });
    }

    ngOnInit() {
        this.loadAuditHistory();
    }

    loadAuditHistory() {
        if (!this.entityName || !this.entityId) {
            console.error('entityName and entityId are required');
            this.loading = false;
            return;
        }

        this.loading = true;
        this.auditService.getEntityAuditHistory(this.entityName, this.entityId).subscribe({
            next: (logs) => {
                this.auditLogs = logs;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading audit history:', error);
                this.loading = false;
            }
        });
    }

    dismiss() {
        this.modalController.dismiss();
    }

    getActionLabel(action: string): string {
        const labels: { [key: string]: string } = {
            'create': 'Creación',
            'update': 'Actualización',
            'delete': 'Eliminación'
        };
        return labels[action] || action;
    }

    getActionColor(action: string): string {
        const colors: { [key: string]: string } = {
            'create': 'success',
            'update': 'primary',
            'delete': 'danger'
        };
        return colors[action] || 'medium';
    }

    formatChanges(changes: any): string {
        if (!changes) return 'Sin cambios';

        const changesList: string[] = [];
        
        for (const [key, value] of Object.entries(changes)) {
            if (typeof value === 'object' && value !== null && 'from' in value && 'to' in value) {
                const change = value as { from: any; to: any };
                const fieldName = this.formatFieldName(key);
                changesList.push(`${fieldName}: ${this.formatValue(change.from)} → ${this.formatValue(change.to)}`);
            }
        }

        return changesList.length > 0 ? changesList.join(', ') : 'Cambios completos';
    }

    formatFieldName(field: string): string {
        // Convertir camelCase a palabras separadas
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    formatValue(value: any): string {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    formatDate(date: string): string {
        // El backend guarda fechas en UTC, necesitamos convertir a hora de Colombia (UTC-5)
        const utcDate = new Date(date);
        
        // Restar 5 horas para convertir de UTC a Colombia
        const colombiaDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000));
        
        return colombiaDate.toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
