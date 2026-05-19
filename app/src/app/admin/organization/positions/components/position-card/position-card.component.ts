import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
} from '@ionic/angular/standalone';
import { Position } from '../../models/position.model';

@Component({
    selector: 'app-position-card',
    templateUrl: './position-card.component.html',
    styleUrls: ['./position-card.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent
    ]
})
export class PositionCardComponent {
    @Input() position!: Position;
    @Output() cardClick = new EventEmitter<Position>();

    onCardClick() {
        this.cardClick.emit(this.position);
    }
}
