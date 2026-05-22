import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, chevronUpOutline, chevronDownOutline, closeOutline } from 'ionicons/icons';

export interface DatePickerConfig {
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: Date[];
    disabledDaysOfWeek?: number[]; // 0 = Domingo, 6 = Sábado
    locale?: string;
    mode?: 'single' | 'range';
    customValidator?: (date: Date, currentSelection?: { start: Date | null; end: Date | null }) => boolean;
}

interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    isInRange: boolean;
    isRangeStart: boolean;
    isRangeEnd: boolean;
}

@Component({
    selector: 'app-advanced-datepicker',
    templateUrl: './advanced-datepicker.component.html',
    styleUrls: ['./advanced-datepicker.component.scss'],
    standalone: true,
    imports: [CommonModule, IonIcon, IonButton],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AdvancedDatepickerComponent),
            multi: true
        }
    ]
})
export class AdvancedDatepickerComponent implements OnInit, ControlValueAccessor {
    @Input() config: DatePickerConfig = { mode: 'single', locale: 'es-ES' };
    @Output() dateSelected = new EventEmitter<Date | { start: Date; end: Date }>();

    currentMonth: Date = new Date();
    calendarDays: CalendarDay[] = [];
    selectedDate: Date | null = null;
    rangeStart: Date | null = null;
    rangeEnd: Date | null = null;

    // Year/Month picker
    showYearPicker = false;
    yearPickerDecade: number = Math.floor(new Date().getFullYear() / 10) * 10;

    monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    monthNamesShort = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    private onChange: (value: any) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        addIcons({ chevronBackOutline, chevronForwardOutline, chevronUpOutline, chevronDownOutline, closeOutline });
    }

    ngOnInit() {
        this.generateCalendar();
    }

    writeValue(value: any): void {
        if (this.config.mode === 'single') {
            this.selectedDate = value ? new Date(value) : null;
        } else {
            if (value?.start) this.rangeStart = new Date(value.start);
            if (value?.end) this.rangeEnd = new Date(value.end);
        }
        this.generateCalendar();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    generateCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayOfWeek = firstDay.getDay();
        const lastDateOfMonth = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();
        
        this.calendarDays = [];
        
        // Días del mes anterior
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevLastDate - i);
            this.calendarDays.push(this.createCalendarDay(date, false));
        }
        
        // Días del mes actual
        for (let day = 1; day <= lastDateOfMonth; day++) {
            const date = new Date(year, month, day);
            this.calendarDays.push(this.createCalendarDay(date, true));
        }
        
        // Días del mes siguiente
        const remainingDays = 42 - this.calendarDays.length; // 6 semanas * 7 días
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            this.calendarDays.push(this.createCalendarDay(date, false));
        }
    }

    createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        // Determinar si es inicio o fin de rango (incluso si el rango está invertido)
        let isRangeStart = false;
        let isRangeEnd = false;
        
        if (this.rangeStart && this.rangeEnd) {
            const start = this.rangeStart < this.rangeEnd ? this.rangeStart : this.rangeEnd;
            const end = this.rangeStart < this.rangeEnd ? this.rangeEnd : this.rangeStart;
            
            isRangeStart = date.getTime() === start.getTime();
            isRangeEnd = date.getTime() === end.getTime();
        } else if (this.rangeStart && !this.rangeEnd) {
            // Solo se ha seleccionado el inicio del rango
            isRangeStart = date.getTime() === this.rangeStart.getTime();
        }

        return {
            date,
            day: date.getDate(),
            isCurrentMonth,
            isToday: date.getTime() === today.getTime(),
            isSelected: this.isDateSelected(date),
            isDisabled: this.isDateDisabled(date),
            isInRange: this.isDateInRange(date),
            isRangeStart,
            isRangeEnd
        };
    }

    isDateSelected(date: Date): boolean {
        if (this.config.mode === 'single' && this.selectedDate) {
            return date.getTime() === this.selectedDate.getTime();
        }
        return false;
    }

    isDateDisabled(date: Date): boolean {
        // Verificar min/max date
        if (this.config.minDate && date < this.config.minDate) return true;
        if (this.config.maxDate && date > this.config.maxDate) return true;

        // Verificar días de la semana deshabilitados
        if (this.config.disabledDaysOfWeek?.includes(date.getDay())) return true;

        // Verificar fechas específicas deshabilitadas
        if (this.config.disabledDates) {
            return this.config.disabledDates.some(disabledDate => {
                const d = new Date(disabledDate);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === date.getTime();
            });
        }

        // Verificar validación personalizada
        if (this.config.customValidator) {
            const currentSelection = {
                start: this.rangeStart,
                end: this.rangeEnd
            };
            return this.config.customValidator(date, currentSelection);
        }

        return false;
    }

    isDateInRange(date: Date): boolean {
        if (this.config.mode !== 'range' || !this.rangeStart || !this.rangeEnd) return false;
        
        // Asegurarse de que las fechas estén en el orden correcto
        const start = this.rangeStart! < this.rangeEnd! ? this.rangeStart! : this.rangeEnd!;
        const end = this.rangeStart! < this.rangeEnd! ? this.rangeEnd! : this.rangeStart!;
        
        // Incluir las fechas de inicio y fin
        return date >= start && date <= end;
    }

    selectDate(day: CalendarDay) {
        if (day.isDisabled) return;

        this.onTouched();

        if (this.config.mode === 'single') {
            this.selectedDate = day.date;
            this.onChange(day.date.toISOString());
            this.dateSelected.emit(day.date);
        } else {
            // Modo rango
            if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
                // Iniciar nuevo rango
                this.rangeStart = day.date;
                this.rangeEnd = null;
            } else {
                // Completar rango
                if (day.date > this.rangeStart) {
                    this.rangeEnd = day.date;
                } else {
                    this.rangeEnd = this.rangeStart;
                    this.rangeStart = day.date;
                }
                
                const range = { start: this.rangeStart, end: this.rangeEnd };
                this.onChange(range);
                this.dateSelected.emit(range);
            }
        }

        this.generateCalendar();
    }

    previousMonth() {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() - 1,
            1
        );
        this.generateCalendar();
    }

    nextMonth() {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            1
        );
        this.generateCalendar();
    }

    clearSelection() {
        this.selectedDate = null;
        this.rangeStart = null;
        this.rangeEnd = null;
        this.onChange(null);
        this.generateCalendar();
    }

    get currentMonthName(): string {
        return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
    }

    get canGoPrevious(): boolean {
        if (!this.config.minDate) return true;
        const firstDayOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        return firstDayOfMonth > this.config.minDate;
    }

    get canGoNext(): boolean {
        if (!this.config.maxDate) return true;
        const lastDayOfMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
        return lastDayOfMonth < this.config.maxDate;
    }

    // ── Year / Month picker ───────────────────────────────────────────────────

    toggleYearPicker() {
        this.showYearPicker = !this.showYearPicker;
        if (this.showYearPicker) {
            this.yearPickerDecade = Math.floor(this.currentMonth.getFullYear() / 10) * 10;
        }
    }

    get decadeYears(): number[] {
        return Array.from({ length: 12 }, (_, i) => this.yearPickerDecade + i);
    }

    get decadeLabel(): string {
        return `${this.yearPickerDecade} – ${this.yearPickerDecade + 11}`;
    }

    previousDecade() {
        this.yearPickerDecade -= 12;
    }

    nextDecade() {
        this.yearPickerDecade += 12;
    }

    selectYear(year: number) {
        this.currentMonth = new Date(year, this.currentMonth.getMonth(), 1);
        this.showYearPicker = false;
        this.generateCalendar();
    }

    isYearDisabled(year: number): boolean {
        if (this.config.minDate && year < this.config.minDate.getFullYear()) return true;
        if (this.config.maxDate && year > this.config.maxDate.getFullYear()) return true;
        return false;
    }

    isCurrentYear(year: number): boolean {
        return year === this.currentMonth.getFullYear();
    }
}
