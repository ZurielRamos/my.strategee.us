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

    /** Nunca se usa <input type="number">: se renderiza como texto y se filtra a números. */
    get nativeType(): Exclude<TextInputType, 'number'> {
        return this.type === 'number' ? 'text' : this.type;
    }

    get inputMode(): 'numeric' | 'decimal' | undefined {
        if (this.digitsOnly) return 'numeric';
        return this.type === 'number' ? 'decimal' : undefined;
    }

    onValueChange(event: any) {
        let newValue = event.detail.value || '';
        if (this.digitsOnly || this.type === 'number') {
            if (this.digitsOnly) {
                newValue = newValue.replace(/\D/g, '');
            } else {
                // Solo dígitos y un único punto decimal (la coma se toma como punto)
                newValue = newValue.replace(/,/g, '.').replace(/[^\d.]/g, '');
                const firstDot = newValue.indexOf('.');
                if (firstDot !== -1) {
                    newValue = newValue.slice(0, firstDot + 1) + newValue.slice(firstDot + 1).replace(/\./g, '');
                }
            }
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
