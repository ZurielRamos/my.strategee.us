import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonIcon,
    IonSpinner 
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-card-button',
    templateUrl: './card-button.component.html',
    styleUrls: ['./card-button.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon,
        IonSpinner
    ]
})
export class CardButtonComponent {
    @Input() title = '';
    @Input() description = '';
    @Input() icon = '';
    @Input() disabled = false;
    @Input() loading = false;
    @Input() badge?: { text: string; type: 'unavailable' | 'info' };
    @Input() colorClass?: string;
    
    @Output() cardClick = new EventEmitter<void>();

    handleClick() {
        if (!this.disabled && !this.loading) {
            this.cardClick.emit();
        }
    }
}
