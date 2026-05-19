import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel
} from '@ionic/angular/standalone';
import { Schedule } from '../../models/schedule.model';

@Component({
    selector: 'app-schedule-card',
    templateUrl: './schedule-card.component.html',
    styleUrls: ['./schedule-card.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonChip,
        IonLabel
    ]
})
export class ScheduleCardComponent {
    @Input() schedule!: Schedule;
    @Output() cardClick = new EventEmitter<Schedule>();

    get workDaysCount(): number {
        return this.schedule.dailySchedules.filter(d => d.isWorkDay).length;
    }

    get workDaysSummary(): string {
        const workDays = this.schedule.dailySchedules.filter(d => d.isWorkDay);
        if (workDays.length === 0) return 'Sin días laborales';
        
        const firstDay = workDays[0];
        if (!firstDay.entryTime || !firstDay.exitTime) return `${workDays.length} días`;
        
        return `${firstDay.entryTime.substring(0, 5)} - ${firstDay.exitTime.substring(0, 5)}`;
    }

    onCardClick() {
        this.cardClick.emit(this.schedule);
    }
}
