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
import { Location } from '../../models/location.model';

@Component({
    selector: 'app-location-card',
    templateUrl: './location-card.component.html',
    styleUrls: ['./location-card.component.scss'],
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
export class LocationCardComponent {
    @Input() location!: Location;
    @Output() cardClick = new EventEmitter<Location>();

    onCardClick() {
        this.cardClick.emit(this.location);
    }
}
