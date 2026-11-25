import { AfterViewInit, Component, ElementRef, forwardRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    COUNTRY_DIAL_CODES,
    CountryDialCode,
    DEFAULT_DIAL_CODE,
    splitPhoneNumber
} from '../../helpers/country-dial-codes';

/** País mostrado cuando varios comparten indicativo (ej. +1 EE. UU./Canadá, +7 Rusia/Kazajistán). */
const PREFERRED_ISO_BY_DIAL_CODE: Record<string, string> = { '1': 'US', '7': 'RU' };
const MAX_RESULTS = 50;
const ITEM_HEIGHT = 44;

/**
 * Campo de teléfono con selector de indicativo (autocomplete).
 * El valor del formulario es el indicativo concatenado con el número, solo dígitos
 * y sin "+" (ej. "573001234567"). Si no hay número, el valor es "".
 */
@Component({
    selector: 'app-phone-input',
    templateUrl: './phone-input.component.html',
    styleUrls: ['./phone-input.component.scss'],
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneInputComponent),
            multi: true
        }
    ]
})
export class PhoneInputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
    @ViewChild('codeAnchor') codeAnchorRef!: ElementRef<HTMLElement>;
    @ViewChild('codeInput') codeInputRef!: ElementRef<HTMLInputElement>;

    @Input() label = 'Teléfono';
    @Input() placeholder = 'Ej: 3001234567';
    @Input() required = false;
    @Input() readonly = false;

    selectedCountry: CountryDialCode = this.findCountry(DEFAULT_DIAL_CODE);
    number = '';
    codeSearch = '';
    isSearching = false;
    disabled = false;

    private filtered: CountryDialCode[] = [];
    private dropdownEl: HTMLElement | null = null;
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor(private ngZone: NgZone) {}

    get codeDisplay(): string {
        return this.isSearching ? this.codeSearch : `+${this.selectedCountry.dialCode}`;
    }

    get isLocked(): boolean {
        return this.disabled || this.readonly;
    }

    ngAfterViewInit() {
        // El dropdown se monta en <body> para que no lo recorte el overflow del modal.
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.style.cssText = [
            'position:fixed', 'display:none', 'z-index:1000000',
            'background:#fff', 'border-radius:10px',
            'border:1px solid #e8e8e8', 'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
            'overflow-y:auto', `max-height:${ITEM_HEIGHT * 6}px`, 'width:280px'
        ].join(';');
        document.body.appendChild(this.dropdownEl);
    }

    ngOnDestroy() {
        this.dropdownEl?.remove();
    }

    // ── Indicativo ──────────────────────────────────────────────────────────

    onCodeFocus() {
        if (this.isLocked) return;
        this.isSearching = true;
        this.codeSearch = '';
        this.filter('');
    }

    onCodeInput(value: string) {
        this.codeSearch = value;
        this.filter(value);
    }

    onCodeKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (this.filtered.length) this.selectCountry(this.filtered[0]);
        } else if (event.key === 'Escape') {
            this.codeInputRef.nativeElement.blur();
        }
    }

    onCodeBlur() {
        setTimeout(() => {
            this.isSearching = false;
            this.codeSearch = '';
            this.hideDrop();
            this.onTouched();
        }, 150);
    }

    private filter(term: string) {
        const normalized = this.normalize(term.replace('+', '').trim());
        this.filtered = COUNTRY_DIAL_CODES.filter(c =>
            !normalized ||
            c.dialCode.startsWith(normalized) ||
            this.normalize(c.name).includes(normalized) ||
            c.iso.toLowerCase() === normalized
        ).slice(0, MAX_RESULTS);
        this.renderDrop();
    }

    private selectCountry(country: CountryDialCode) {
        this.selectedCountry = country;
        this.isSearching = false;
        this.codeSearch = '';
        this.hideDrop();
        this.codeInputRef?.nativeElement.blur();
        this.emit();
    }

    // ── Número ──────────────────────────────────────────────────────────────

    onNumberInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const digits = input.value.replace(/\D/g, '');
        input.value = digits;
        this.number = digits;
        this.emit();
    }

    onNumberBlur() {
        this.onTouched();
    }

    // ── ControlValueAccessor ────────────────────────────────────────────────

    writeValue(value: string | null): void {
        const { dialCode, number } = splitPhoneNumber(value);
        this.selectedCountry = this.findCountry(dialCode);
        this.number = number;
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

    // ── Helpers ─────────────────────────────────────────────────────────────

    private emit() {
        this.onChange(this.number ? `${this.selectedCountry.dialCode}${this.number}` : '');
    }

    private findCountry(dialCode: string): CountryDialCode {
        const preferredIso = PREFERRED_ISO_BY_DIAL_CODE[dialCode];
        return COUNTRY_DIAL_CODES.find(c => c.dialCode === dialCode && (!preferredIso || c.iso === preferredIso))
            ?? COUNTRY_DIAL_CODES.find(c => c.dialCode === dialCode)
            ?? COUNTRY_DIAL_CODES[0];
    }

    private normalize(text: string): string {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    private renderDrop() {
        if (!this.dropdownEl || !this.codeAnchorRef) return;
        if (!this.filtered.length) {
            this.hideDrop();
            return;
        }

        const rect = this.codeAnchorRef.nativeElement.getBoundingClientRect();
        const dropH = Math.min(this.filtered.length, 6) * ITEM_HEIGHT;
        const spaceBelow = window.innerHeight - rect.bottom;
        this.dropdownEl.style.left = `${rect.left}px`;
        if (spaceBelow < dropH && rect.top > dropH) {
            this.dropdownEl.style.top = 'auto';
            this.dropdownEl.style.bottom = `${window.innerHeight - rect.top + 4}px`;
        } else {
            this.dropdownEl.style.bottom = 'auto';
            this.dropdownEl.style.top = `${rect.bottom + 4}px`;
        }

        this.dropdownEl.innerHTML = this.filtered.map(c => `
            <div class="phone-code-item"
                style="display:flex;justify-content:space-between;align-items:center;gap:12px;height:${ITEM_HEIGHT}px;padding:0 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;box-sizing:border-box;${c.iso === this.selectedCountry.iso ? 'background:#f4f5f8;' : ''}">
                <span style="font-size:14px;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</span>
                <span style="font-size:13px;font-weight:600;color:#8c8c8c;">+${c.dialCode}</span>
            </div>
        `).join('');

        this.dropdownEl.querySelectorAll('.phone-code-item').forEach((el, i) => {
            const item = el as HTMLElement;
            item.addEventListener('mousedown', e => {
                e.preventDefault();
                this.ngZone.run(() => this.selectCountry(this.filtered[i]));
            });
            item.addEventListener('mouseover', () => item.style.background = '#f4f5f8');
            item.addEventListener('mouseout', () => item.style.background = '');
        });

        this.dropdownEl.style.display = 'block';
        this.dropdownEl.scrollTop = 0;
    }

    private hideDrop() {
        this.filtered = [];
        if (this.dropdownEl) this.dropdownEl.style.display = 'none';
    }
}
