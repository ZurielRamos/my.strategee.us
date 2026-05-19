import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';

export interface ShiftOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-shift-selector',
  templateUrl: './shift-selector.component.html',
  styleUrls: ['./shift-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShiftSelectorComponent),
      multi: true
    }
  ]
})
export class ShiftSelectorComponent implements ControlValueAccessor {
  @Input() label = 'Turno';
  @Input() required = false;
  @Input() options: ShiftOption[] = [
    { value: 'MANANA', label: 'Mañana', icon: 'time-outline' },
    { value: 'TARDE', label: 'Tarde', icon: 'time-outline' }
  ];
  @Input() readonly = false;

  value: string | null = null;
  disabled = false;
  touched = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    addIcons({ timeOutline });
  }

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  selectOption(optionValue: string): void {
    if (this.disabled || this.readonly) {
      return;
    }

    this.value = optionValue;
    this.onChange(this.value);
    this.markAsTouched();
  }

  isSelected(optionValue: string): boolean {
    return this.value === optionValue;
  }

  private markAsTouched(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }
}
