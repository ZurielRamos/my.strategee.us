import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
    IonItem, IonLabel, IonInput, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { TimePickerComponent } from '../time-picker/time-picker.component';

@Component({
    selector: 'app-time-input',
    templateUrl: './time-input.component.html',
    styleUrls: ['./time-input.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonInput,
        IonIcon,
        TimePickerComponent
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TimeInputComponent),
            multi: true
        }
    ]
})
export class TimeInputComponent implements ControlValueAccessor {
    @Input() label = 'Hora';
    @Input() placeholder = 'HH:MM';
    @Input() required = false;
    @Input() helperText?: string;

    showTimePicker = false;
    value = '';
    disabled = false;
    
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        addIcons({ timeOutline });
    }

    writeValue(value: string): void {
        this.value = value || '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    toggleTimePicker() {
        if (!this.disabled) {
            this.showTimePicker = !this.showTimePicker;
            if (this.showTimePicker) {
                this.onTouched();
            }
        }
    }

    onTimeSelected(time: string) {
        console.log('TimeInput - onTimeSelected:', time);
        
        // Extraer solo HH:MM del formato ISO si viene en ese formato
        let timeString = time;
        if (time.includes('T')) {
            timeString = time.split('T')[1]?.substring(0, 5) || time;
        }
        
        console.log('TimeInput - formatted time:', timeString);
        this.value = timeString;
        this.onChange(timeString);
        this.showTimePicker = false;
    }

    onDismissed() {
        this.showTimePicker = false;
    }
}
