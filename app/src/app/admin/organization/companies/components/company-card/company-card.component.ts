import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline } from 'ionicons/icons';
import { Company } from '../../models/company.model';

@Component({
    selector: 'app-company-card',
    templateUrl: './company-card.component.html',
    styleUrls: ['./company-card.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon
    ]
})
export class CompanyCardComponent {
    @Input() company!: Company;
    @Output() cardClick = new EventEmitter<Company>();

    constructor() {
        addIcons({ businessOutline });
    }

    onCardClick() {
        this.cardClick.emit(this.company);
    }
}
