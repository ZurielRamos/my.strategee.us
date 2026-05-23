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
import {
    bookOutline,
    calendarOutline,
    documentTextOutline,
    alertCircleOutline
} from 'ionicons/icons';
import { Training, TrainingStatus } from '../../models/training.model';

@Component({
    selector: 'app-training-card',
    templateUrl: './training-card.component.html',
    styleUrls: ['./training-card.component.scss'],
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
export class TrainingCardComponent {
    @Input() training!: Training;
    @Output() cardClick = new EventEmitter<Training>();

    constructor() {
        addIcons({ bookOutline, calendarOutline, documentTextOutline, alertCircleOutline });
    }

    onCardClick() {
        this.cardClick.emit(this.training);
    }

    get statusLabel(): string {
        const labels: Record<TrainingStatus, string> = {
            draft: 'Borrador',
            active: 'Activa',
            inactive: 'Inactiva',
            expired: 'Expirada'
        };
        return labels[this.training.status] ?? this.training.status;
    }

    get statusBadgeColor(): string {
        const colors: Record<TrainingStatus, string> = {
            draft: 'medium',
            active: 'success',
            inactive: 'warning',
            expired: 'danger'
        };
        return colors[this.training.status] ?? 'medium';
    }

    get formattedStartDate(): string {
        return this.training.startsAt ? this.formatDate(this.training.startsAt) : 'Sin fecha de inicio';
    }

    get formattedEndDate(): string {
        return this.training.endsAt ? this.formatDate(this.training.endsAt) : 'Sin fecha de fin';
    }

    get materialsCount(): number {
        return this.training.materials?.length ?? 0;
    }

    private formatDate(dateStr: string): string {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}
