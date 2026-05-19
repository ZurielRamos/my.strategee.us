import { Component, forwardRef, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle, searchOutline, businessOutline, layersOutline, briefcaseOutline } from 'ionicons/icons';

export interface EntityOption {
  id: string;
  name: string;
  subtitle?: string; // e.g. company name for areas/positions
}

@Component({
  selector: 'app-entity-autocomplete',
  templateUrl: './entity-autocomplete.component.html',
  styleUrls: ['./entity-autocomplete.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EntityAutocompleteComponent),
      multi: true
    }
  ]
})
export class EntityAutocompleteComponent implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('anchor') anchorRef!: ElementRef<HTMLElement>;

  @Input() options: EntityOption[] = [];
  @Input() placeholder = 'Buscar...';
  @Input() icon = 'business-outline';

  @Input() set initialItems(items: EntityOption[]) {
    if (items?.length) {
      this.selected = [...items];
    }
  }

  searchTerm = '';
  filtered: EntityOption[] = [];
  selected: EntityOption[] = [];
  showDropdown = false;

  private dropdownEl: HTMLElement | null = null;
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private ngZone: NgZone) {
    addIcons({ closeCircle, searchOutline, businessOutline, layersOutline, briefcaseOutline });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.dropdownEl = document.createElement('div');
    this.dropdownEl.style.cssText = [
      'position:fixed', 'display:none', 'z-index:1000000',
      'background:#fff', 'border-radius:10px',
      'border:1px solid #e8e8e8', 'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
      'overflow:hidden', 'min-width:200px'
    ].join(';');
    document.body.appendChild(this.dropdownEl);
  }

  onInput(value: string) {
    this.searchTerm = value;
    if (!value.trim()) {
      this.hideDrop();
      return;
    }
    const term = value.toLowerCase();
    const selectedIds = new Set(this.selected.map(s => s.id));
    this.filtered = this.options.filter(o =>
      !selectedIds.has(o.id) &&
      (o.name.toLowerCase().includes(term) || o.subtitle?.toLowerCase().includes(term))
    ).slice(0, 5);

    if (this.filtered.length) {
      this.showDropdown = true;
      this.positionDrop();
      this.renderDrop();
    } else {
      this.hideDrop();
    }
  }

  private positionDrop() {
    if (!this.dropdownEl || !this.anchorRef) return;
    const rect = this.anchorRef.nativeElement.getBoundingClientRect();
    const dropH = Math.min(this.filtered.length, 5) * 52;
    const spaceBelow = window.innerHeight - rect.bottom;

    this.dropdownEl.style.left = `${rect.left}px`;
    this.dropdownEl.style.width = `${rect.width}px`;

    if (spaceBelow < dropH && rect.top > dropH) {
      this.dropdownEl.style.top = 'auto';
      this.dropdownEl.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    } else {
      this.dropdownEl.style.bottom = 'auto';
      this.dropdownEl.style.top = `${rect.bottom + 4}px`;
    }
  }

  private renderDrop() {
    if (!this.dropdownEl) return;
    this.dropdownEl.innerHTML = this.filtered.map(item => `
      <div class="entity-drop-item" data-id="${item.id}"
        style="display:flex;flex-direction:column;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:14px;font-weight:600;color:#1a1a1a;">${item.name}</span>
        ${item.subtitle ? `<span style="font-size:12px;color:#8c8c8c;">${item.subtitle}</span>` : ''}
      </div>
    `).join('');

    this.dropdownEl.querySelectorAll('.entity-drop-item').forEach((el, i) => {
      (el as HTMLElement).addEventListener('mousedown', e => {
        e.preventDefault();
        this.ngZone.run(() => this.select(this.filtered[i]));
      });
      (el as HTMLElement).addEventListener('mouseover', () => (el as HTMLElement).style.background = '#f4f5f8');
      (el as HTMLElement).addEventListener('mouseout', () => (el as HTMLElement).style.background = '');
    });

    this.dropdownEl.style.display = 'block';
  }

  private hideDrop() {
    this.showDropdown = false;
    this.filtered = [];
    if (this.dropdownEl) this.dropdownEl.style.display = 'none';
  }

  select(item: EntityOption) {
    this.selected = [...this.selected, item];
    this.searchTerm = '';
    this.hideDrop();
    this.emit();
  }

  remove(item: EntityOption) {
    this.selected = this.selected.filter(s => s.id !== item.id);
    this.emit();
  }

  onBlur() {
    setTimeout(() => { this.hideDrop(); this.onTouched(); }, 150);
  }

  private emit() {
    this.onChange(this.selected.map(s => s.id));
  }

  writeValue(ids: string[]): void {
    if (!ids?.length) this.selected = [];
  }

  registerOnChange(fn: (value: string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  ngOnDestroy() {
    this.dropdownEl?.remove();
  }
}
