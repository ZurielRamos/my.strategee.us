import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonIcon
} from '@ionic/angular/standalone';

export interface SelectOption {
    value: any;
    label: string;
}

/**
 * Componente reutilizable de select para formularios.
 * 
 * Implementa ControlValueAccessor para integrarse con Angular Forms.
 * 
 * @example
 * ```html
 * <app-form-select
 *   label="Cargo"
 *   [options]="positions"
 *   [formControl]="form.controls.positionId"
 *   placeholder="Seleccione cargo"
 *   [required]="true">
 * </app-form-select>
 * ```
 */
@Component({
    selector: 'app-form-select',
    templateUrl: './form-select.component.html',
    styleUrls: ['./form-select.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonItem,
        IonLabel,
        IonSelect,
        IonSelectOption,
        IonNote,
        IonIcon
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormSelectComponent),
            multi: true
        }
    ]
})
export class FormSelectComponent implements ControlValueAccessor {
    /** Etiqueta del campo */
    @Input() label = '';
    
    /** Opciones del select */
    @Input() options: SelectOption[] = [];
    
    /** Placeholder cuando no hay selección */
    @Input() placeholder = 'Seleccione una opción';
    
    /** Indica si el campo es requerido */
    @Input() required = false;
    
    /** Texto de ayuda opcional */
    @Input() helperText = '';
    
    /** Icono de ayuda (nombre de ionicon) */
    @Input() helperIcon = '';
    
    /** Interface del select: 'alert' | 'action-sheet' | 'popover' */
    @Input() interface: 'alert' | 'action-sheet' | 'popover' = 'popover';

    value: any = null;
    disabled = false;

    // ControlValueAccessor callbacks
    private onChange: (value: any) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onValueChange(event: any): void {
        this.value = event.detail.value;
        this.onChange(this.value);
        this.onTouched();
    }

    get displayLabel(): string {
        return this.required ? `${this.label} *` : this.label;
    }
}
