import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle, searchOutline } from 'ionicons/icons';

export interface FilterOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-filter-autocomplete',
  templateUrl: './filter-autocomplete.component.html',
  styleUrls: ['./filter-autocomplete.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class FilterAutocompleteComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('anchor') anchorRef!: ElementRef<HTMLElement>;

  @Input() options: FilterOption[] = [];
  @Input() placeholder = 'Buscar...';
  @Input() icon = 'search-outline';
  @Input() value: string | undefined;
  @Output() valueChange = new EventEmitter<string | undefined>();

  searchTerm = '';
  filtered: FilterOption[] = [];
  selectedOption: FilterOption | null = null;
  showDropdown = false;

  private dropdownEl: HTMLElement | null = null;

  constructor(private ngZone: NgZone) {
    addIcons({ closeCircle, searchOutline });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      if (!this.value) {
        this.selectedOption = null;
        this.searchTerm = '';
      } else {
        const found = this.options.find(o => o.id === this.value);
        if (found) {
          this.selectedOption = found;
          this.searchTerm = '';
        }
      }
    }
    if (changes['options'] && this.value) {
      const found = this.options.find(o => o.id === this.value);
      if (found) {
        this.selectedOption = found;
      }
    }
  }

  ngAfterViewInit() {
    this.dropdownEl = document.createElement('div');
    this.dropdownEl.className = 'filter-autocomplete-drop';
    this.dropdownEl.style.cssText = [
      'position:fixed', 'display:none', 'z-index:1000000',
      'background:var(--app-card-bg, #fff)', 'border-radius:10px',
      'border:1px solid var(--app-border, #e8e8e8)',
      'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
      'overflow:auto', 'min-width:200px', 'max-height:260px'
    ].join(';');
    document.body.appendChild(this.dropdownEl);
  }

  onInput(value: string) {
    this.searchTerm = value;
    if (!value.trim()) {
      this.filtered = this.options.slice(0, 8);
    } else {
      const term = value.toLowerCase();
      this.filtered = this.options.filter(o =>
        o.name.toLowerCase().includes(term)
      ).slice(0, 8);
    }

    if (this.filtered.length) {
      this.showDropdown = true;
      this.positionDrop();
      this.renderDrop();
    } else {
      this.hideDrop();
    }
  }

  onFocus() {
    // Show all options on focus (limited to first 8)
    if (!this.searchTerm.trim()) {
      this.filtered = this.options.slice(0, 8);
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filtered = this.options.filter(o =>
        o.name.toLowerCase().includes(term)
      ).slice(0, 8);
    }

    if (this.filtered.length) {
      this.showDropdown = true;
      this.positionDrop();
      this.renderDrop();
    }
  }

  private positionDrop() {
    if (!this.dropdownEl || !this.anchorRef) return;
    const rect = this.anchorRef.nativeElement.getBoundingClientRect();
    const dropH = Math.min(this.filtered.length, 5) * 48;
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
      <div class="filter-drop-item" data-id="${item.id}"
        style="display:flex;align-items:center;padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(0,0,0,0.05);font-size:14px;font-weight:500;color:var(--app-text-primary, #1a1a1a);transition:background 0.15s;">
        ${item.name}
      </div>
    `).join('');

    this.dropdownEl.querySelectorAll('.filter-drop-item').forEach((el, i) => {
      (el as HTMLElement).addEventListener('mousedown', e => {
        e.preventDefault();
        this.ngZone.run(() => this.select(this.filtered[i]));
      });
      (el as HTMLElement).addEventListener('mouseover', () => (el as HTMLElement).style.background = 'var(--app-hover-bg, #f4f5f8)');
      (el as HTMLElement).addEventListener('mouseout', () => (el as HTMLElement).style.background = '');
    });

    this.dropdownEl.style.display = 'block';
  }

  private hideDrop() {
    this.showDropdown = false;
    this.filtered = [];
    if (this.dropdownEl) this.dropdownEl.style.display = 'none';
  }

  select(item: FilterOption) {
    this.selectedOption = item;
    this.searchTerm = '';
    this.hideDrop();
    this.valueChange.emit(item.id);
  }

  clear() {
    this.selectedOption = null;
    this.searchTerm = '';
    this.valueChange.emit(undefined);
  }

  onBlur() {
    setTimeout(() => {
      this.hideDrop();
      // If user typed something but didn't select, clear the input
      if (this.searchTerm && !this.selectedOption) {
        this.searchTerm = '';
      }
    }, 150);
  }

  ngOnDestroy() {
    this.dropdownEl?.remove();
  }
}
