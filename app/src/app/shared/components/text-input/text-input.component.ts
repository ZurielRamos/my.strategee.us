import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
    IonItem, IonLabel, IonInput, IonNote, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

export type TextInputType = 'text' | 'email' | 'tel' | 'number' | 'url' | 'password';

@Component({
    selector: 'app-text-input',
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonInput,
        IonNote,
        IonIcon
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextInputComponent),
            multi: true
        }
    ]
})
export class TextInputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() required = false;
    @Input() type: TextInputType = 'text';
    @Input() helperText?: string;
    @Input() helperIcon?: string;
    @Input() readonly = false;
    @Input() maxlength?: number;
    @Input() minlength?: number;
    @Input() min?: number;
    @Input() max?: number;
    @Input() pattern?: string;
    @Input() autocomplete?: string;
    /** Permite solo dígitos (elimina cualquier otro carácter mientras se escribe). */
    @Input() digitsOnly = false;
    /** Selecciona todo el contenido al enfocar el campo. */
    @Input() selectOnFocus = false;

    value = '';
    disabled = false;
    
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        addIcons({ informationCircleOutline });
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

    get inputMode(): 'numeric' | undefined {
        return this.digitsOnly ? 'numeric' : undefined;
    }

    onValueChange(event: any) {
        let newValue = event.detail.value || '';
        if (this.digitsOnly) {
            newValue = newValue.replace(/\D/g, '');
            // Forzar el valor en el ion-input: si el valor saneado no cambia, el binding no lo actualiza
            event.target.value = newValue;
        }
        this.value = newValue;
        this.onChange(newValue);
    }

    async onFocus(event: any) {
        if (!this.selectOnFocus || this.readonly) return;
        const input: HTMLInputElement = await event.target.getInputElement();
        // Esperar a que el navegador termine de posicionar el cursor antes de seleccionar
        setTimeout(() => input.select());
    }

    onBlur() {
        this.onTouched();
    }
}
