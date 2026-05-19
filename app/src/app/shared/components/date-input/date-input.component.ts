import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
    IonItem, IonLabel, IonInput, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { AdvancedDatepickerComponent, DatePickerConfig } from '../advanced-datepicker/advanced-datepicker.component';

export type DateInputMode = 'single' | 'range';

export interface DateValue {
    startDate: string | null;
    endDate?: string | null;
}

@Component({
    selector: 'app-date-input',
    templateUrl: './date-input.component.html',
    styleUrls: ['./date-input.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonInput,
        IonIcon,
        AdvancedDatepickerComponent
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateInputComponent),
            multi: true
        }
    ]
})
export class DateInputComponent implements ControlValueAccessor, OnInit, OnChanges {
    @Input() label = 'Fecha';
    @Input() placeholder = 'Selecciona una fecha';
    @Input() mode: DateInputMode = 'single';
    @Input() required = false;
    @Input() minDate?: Date;
    @Input() maxDate?: Date;
    @Input() disabledDaysOfWeek?: number[];
    @Input() customValidator?: (date: Date, currentSelection?: { start: Date | null; end: Date | null }) => boolean;
    
    @Output() dateChange = new EventEmitter<DateValue>();

    showDatePicker = false;
    datePickerConfig!: DatePickerConfig;
    displayValue = '';
    
    private _value: DateValue = { startDate: null, endDate: null };
    private onChange: (value: DateValue) => void = () => {};
    private onTouched: () => void = () => {};
    
    disabled = false;

    constructor() {
        addIcons({ calendarOutline });
        // Inicializar config con valores por defecto
        this.datePickerConfig = {
            mode: 'single',
            locale: 'es-ES'
        };
    }

    ngOnInit() {
        this.initializeDatePickerConfig();
    }

    ngOnChanges(changes: SimpleChanges) {
        // Reinicializar config cuando cambien los inputs
        if (changes['minDate'] || changes['maxDate'] || changes['disabledDaysOfWeek'] || 
            changes['customValidator'] || changes['mode']) {
            this.initializeDatePickerConfig();
        }
    }

    private initializeDatePickerConfig() {
        console.log('DateInput - initializeDatePickerConfig', {
            mode: this.mode,
            minDate: this.minDate,
            maxDate: this.maxDate,
            disabledDaysOfWeek: this.disabledDaysOfWeek
        });
        
        this.datePickerConfig = {
            minDate: this.minDate,
            maxDate: this.maxDate,
            disabledDaysOfWeek: this.disabledDaysOfWeek,
            mode: this.mode,
            locale: 'es-ES',
            customValidator: this.customValidator
        };
        
        console.log('DateInput - datePickerConfig created:', this.datePickerConfig);
    }

    writeValue(value: any): void {
        console.log('DateInput - writeValue called with:', value, 'type:', typeof value);
        
        // Manejar diferentes tipos de valores
        if (!value) {
            this._value = { startDate: null, endDate: null };
            this.displayValue = '';
        } else if (typeof value === 'string') {
            // Si es un string (formato YYYY-MM-DD o ISO), convertirlo a DateValue
            this._value = {
                startDate: value.includes('T') ? value : new Date(value + 'T00:00:00').toISOString()
            };
            this.updateDisplayValue();
        } else if (value.startDate) {
            // Si ya es un DateValue
            this._value = value;
            this.updateDisplayValue();
        }
        
        console.log('DateInput - after writeValue, _value:', this._value);
        console.log('DateInput - after writeValue, displayValue:', this.displayValue);
    }

    registerOnChange(fn: (value: DateValue) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    toggleDatePicker() {
        if (!this.disabled) {
            this.showDatePicker = !this.showDatePicker;
            console.log('DateInput - toggleDatePicker:', this.showDatePicker);
            console.log('DateInput - config:', this.datePickerConfig);
            if (this.showDatePicker) {
                this.onTouched();
            }
        }
    }

    onDateSelected(date: Date | { start: Date; end: Date }) {
        console.log('DateInput - onDateSelected:', date);
        
        if (this.mode === 'single' && date instanceof Date) {
            this._value = {
                startDate: date.toISOString()
            };
            
            // Para compatibilidad con formularios que esperan string
            const dateString = date.toISOString().split('T')[0];
            console.log('DateInput - emitting string value:', dateString);
            this.onChange(dateString as any);
            
        } else if (this.mode === 'range' && !(date instanceof Date)) {
            this._value = {
                startDate: date.start.toISOString(),
                endDate: date.end.toISOString()
            };
            
            // Para modo range, emitir el objeto completo
            this.onChange(this._value);
        }

        console.log('DateInput - new internal value:', this._value);
        this.updateDisplayValue();
        this.dateChange.emit(this._value);
        this.showDatePicker = false;
    }

    private updateDisplayValue() {
        if (!this._value.startDate) {
            this.displayValue = '';
            return;
        }

        const startDate = new Date(this._value.startDate);
        const formattedStart = this.formatDate(startDate);

        if (this.mode === 'single' || !this._value.endDate) {
            this.displayValue = formattedStart;
        } else {
            const endDate = new Date(this._value.endDate);
            const formattedEnd = this.formatDate(endDate);
            
            if (startDate.getTime() === endDate.getTime()) {
                this.displayValue = formattedStart;
            } else {
                this.displayValue = `${formattedStart} al ${formattedEnd}`;
            }
        }
    }

    private formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    get value(): DateValue {
        return this._value;
    }
}
