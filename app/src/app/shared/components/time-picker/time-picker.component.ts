import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonModal, IonDatetime } from '@ionic/angular/standalone';

@Component({
    selector: 'app-time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: ['./time-picker.component.scss'],
    standalone: true,
    imports: [CommonModule, IonModal, IonDatetime]
})
export class TimePickerComponent {
    @Input() isOpen = false;
    @Input() value: string | null = null;
    @Input() cancelText = 'Cancelar';
    @Input() doneText = 'Aceptar';
    @Output() timeSelected = new EventEmitter<string>();
    @Output() dismissed = new EventEmitter<void>();

    onTimeChange(event: any) {
        const time = event.detail.value;
        if (time) {
            // Extraer solo HH:MM del formato ISO
            const timeString = time.split('T')[1]?.substring(0, 5) || time;
            this.timeSelected.emit(timeString);
        }
    }

    onDismiss() {
        this.dismissed.emit();
    }
}
