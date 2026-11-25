import { Directive, HostListener, Input } from '@angular/core';

/**
 * Restringe un input de texto (`<input>` o `<ion-input>`) a valores numéricos.
 * Reemplaza a `type="number"`. Por defecto acepta dígitos y un punto decimal;
 * con `[integer]="true"` acepta solo dígitos.
 *
 * Nota: el valor del control es un string, usar Number() al enviarlo.
 */
@Directive({
    selector: '[appNumericOnly]',
    standalone: true,
    host: {
        '[attr.inputmode]': 'integer ? "numeric" : "decimal"',
        autocomplete: 'off'
    }
})
export class NumericOnlyDirective {
    @Input() integer = false;

    // Se dispara antes de modificar el valor (tecleo, pegado, arrastre), incluso en el input interno de ion-input.
    @HostListener('beforeinput', ['$event'])
    onBeforeInput(event: InputEvent) {
        if (event.inputType?.startsWith('delete') || event.inputType?.startsWith('history')) {
            return;
        }
        const input = event.target as HTMLInputElement | null;
        if (!input || typeof input.value !== 'string') {
            return;
        }
        const data = event.data ?? event.dataTransfer?.getData('text') ?? '';
        if (!data) {
            return;
        }
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const next = input.value.slice(0, start) + data + input.value.slice(end);
        const pattern = this.integer ? /^\d*$/ : /^\d*\.?\d*$/;
        if (!pattern.test(next)) {
            event.preventDefault();
        }
    }
}
