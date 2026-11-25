import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { briefcaseOutline } from 'ionicons/icons';
import { Area } from '../../models/area.model';

@Component({
    selector: 'app-area-card',
    templateUrl: './area-card.component.html',
    styleUrls: ['./area-card.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
    ]
})
export class AreaCardComponent {
    @Input() area!: Area;
    @Output() cardClick = new EventEmitter<Area>();

    constructor() {
        addIcons({ briefcaseOutline });
    }

    onCardClick() {
        this.cardClick.emit(this.area);
    }
}
