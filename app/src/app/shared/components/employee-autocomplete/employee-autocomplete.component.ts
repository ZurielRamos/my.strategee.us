import { Component, forwardRef, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle, personCircleOutline, searchOutline } from 'ionicons/icons';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeesService } from '../../../admin/employees/services/employees.service';
import { Employee } from '../../../admin/employees/models/employee.model';

@Component({
  selector: 'app-employee-autocomplete',
  templateUrl: './employee-autocomplete.component.html',
  styleUrls: ['./employee-autocomplete.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmployeeAutocompleteComponent),
      multi: true
    }
  ]
})
export class EmployeeAutocompleteComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @ViewChild('anchor') anchorRef!: ElementRef<HTMLElement>;
  @Input() set initialEmployees(employees: { id: string; firstName: string; lastName: string; profilePhoto?: { url: string } | null }[]) {
    if (employees?.length) {
      this.selectedEmployees = employees.map(e => e as Employee);
    }
  }

  searchTerm = '';
  suggestions: Employee[] = [];
  selectedEmployees: Employee[] = [];
  isLoading = false;
  showDropdown = false;

  private dropdownEl: HTMLElement | null = null;
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private employeesService: EmployeesService,
    private ngZone: NgZone
  ) {
    addIcons({ closeCircle, personCircleOutline, searchOutline });

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term.trim()) {
          this.hideDrop();
          return of(null);
        }
        this.isLoading = true;
        return this.employeesService.getAll(1, 5, term);
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.isLoading = false;
      if (response) {
        const selectedIds = new Set(this.selectedEmployees.map(e => e.id));
        this.suggestions = response.data.filter(e => !selectedIds.has(e.id));
        if (this.suggestions.length > 0) {
          this.showDropdown = true;
          this.positionDrop();
          this.renderDrop();
        } else {
          this.hideDrop();
        }
      }
    });
  }

  ngAfterViewInit() {
    this.dropdownEl = document.createElement('div');
    this.dropdownEl.className = 'emp-autocomplete-drop';
    this.dropdownEl.style.cssText = [
      'position:fixed',
      'display:none',
      'z-index:1000000',
      'background:#fff',
      'border-radius:10px',
      'border:1px solid #e8e8e8',
      'box-shadow:0 4px 20px rgba(0,0,0,0.15)',
      'overflow:hidden',
      'min-width:200px'
    ].join(';');

    document.body.appendChild(this.dropdownEl);
  }

  private positionDrop() {
    if (!this.dropdownEl || !this.anchorRef) return;
    const rect = this.anchorRef.nativeElement.getBoundingClientRect();
    const dropH = this.suggestions.length * 56;
    const spaceBelow = window.innerHeight - rect.bottom;

    this.dropdownEl.style.left = `${rect.left}px`;
    this.dropdownEl.style.width = `${rect.width}px`;

    if (spaceBelow < dropH && rect.top > dropH) {
      // open upward
      this.dropdownEl.style.top = 'auto';
      this.dropdownEl.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    } else {
      this.dropdownEl.style.bottom = 'auto';
      this.dropdownEl.style.top = `${rect.bottom + 4}px`;
    }
  }

  private renderDrop() {
    if (!this.dropdownEl) return;
    this.dropdownEl.innerHTML = this.suggestions.map(emp => `
      <div class="emp-drop-item" data-id="${emp.id}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;">
        ${emp.profilePhoto?.url
          ? `<img src="${emp.profilePhoto.url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt=""/>`
          : `<span style="font-size:34px;color:#8c8c8c;flex-shrink:0;">👤</span>`
        }
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:14px;font-weight:600;color:#1a1a1a;">${emp.firstName} ${emp.lastName}</span>
          <span style="font-size:12px;color:#8c8c8c;">${emp.documentNumber}</span>
        </div>
      </div>
    `).join('');

    this.dropdownEl.querySelectorAll('.emp-drop-item').forEach((item, i) => {
      (item as HTMLElement).addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.ngZone.run(() => this.select(this.suggestions[i]));
      });
      (item as HTMLElement).addEventListener('mouseover', () => {
        (item as HTMLElement).style.background = '#f4f5f8';
      });
      (item as HTMLElement).addEventListener('mouseout', () => {
        (item as HTMLElement).style.background = '';
      });
    });

    this.dropdownEl.style.display = 'block';
  }

  private hideDrop() {
    this.showDropdown = false;
    this.suggestions = [];
    if (this.dropdownEl) this.dropdownEl.style.display = 'none';
  }

  onInput(value: string) {
    this.searchTerm = value;
    this.search$.next(value);
  }

  select(employee: Employee) {
    this.selectedEmployees = [...this.selectedEmployees, employee];
    this.searchTerm = '';
    this.hideDrop();
    this.emit();
  }

  remove(employee: Employee) {
    this.selectedEmployees = this.selectedEmployees.filter(e => e.id !== employee.id);
    this.emit();
  }

  onBlur() {
    setTimeout(() => {
      this.hideDrop();
      this.onTouched();
    }, 150);
  }

  private emit() {
    this.onChange(this.selectedEmployees.map(e => e.id));
  }

  fullName(e: Employee) {
    return `${e.firstName} ${e.lastName}`;
  }

  writeValue(ids: string[]): void {
    if (!ids || ids.length === 0) {
      this.selectedEmployees = [];
    }
  }

  registerOnChange(fn: (value: string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  ngOnDestroy() {
    this.dropdownEl?.remove();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
