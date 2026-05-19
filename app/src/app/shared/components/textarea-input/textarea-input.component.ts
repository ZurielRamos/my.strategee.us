import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
    IonItem, IonLabel, IonTextarea, IonNote
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-textarea-input',
    templateUrl: './textarea-input.component.html',
    styleUrls: ['./textarea-input.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonTextarea,
        IonNote
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextareaInputComponent),
            multi: true
        }
    ]
})
export class TextareaInputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() required = false;
    @Input() rows = 3;
    @Input() maxlength?: number;
    @Input() showCharCounter = false;
    @Input() helperText?: string;
    @Input() readonly = false;

    value = '';
    disabled = false;
    
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

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

    onValueChange(event: any) {
        const newValue = event.detail.value || '';
        this.value = newValue;
        this.onChange(newValue);
    }

    onBlur() {
        this.onTouched();
    }

    get characterCount(): number {
        return this.value?.length || 0;
    }

    get remainingCharacters(): number {
        if (!this.maxlength) return 0;
        return this.maxlength - this.characterCount;
    }

    get isNearLimit(): boolean {
        if (!this.maxlength) return false;
        return this.remainingCharacters <= 50;
    }

    get isAtLimit(): boolean {
        if (!this.maxlength) return false;
        return this.remainingCharacters === 0;
    }
}
