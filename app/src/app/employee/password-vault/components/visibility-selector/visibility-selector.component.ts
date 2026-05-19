import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonSelect, IonSelectOption, IonItem, IonLabel } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { VisibilityLevel } from '../../models/visibility.model';
import { Credential } from '../../models/credential.model';
import { CompaniesService } from '../../../../admin/organization/companies/services/companies.service';
import { AreasService } from '../../../../admin/organization/areas/services/areas.service';
import { PositionsService } from '../../../../admin/organization/positions/services/positions.service';
import { EmployeeAutocompleteComponent } from '../../../../shared/components/employee-autocomplete/employee-autocomplete.component';
import { EntityAutocompleteComponent, EntityOption } from '../../../../shared/components/entity-autocomplete/entity-autocomplete.component';

@Component({
  selector: 'app-visibility-selector',
  templateUrl: './visibility-selector.component.html',
  styleUrls: ['./visibility-selector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    EmployeeAutocompleteComponent,
    EntityAutocompleteComponent
  ]
})
export class VisibilitySelectorComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() credential?: Credential;

  visibilityLevels = [
    { value: VisibilityLevel.PRIVATE, label: 'Privada' },
    { value: VisibilityLevel.PUBLIC, label: 'Pública' },
    { value: VisibilityLevel.BY_COMPANY, label: 'Por Empresa' },
    { value: VisibilityLevel.BY_AREA, label: 'Por Área' },
    { value: VisibilityLevel.BY_POSITION, label: 'Por Puesto' },
    { value: VisibilityLevel.BY_EMPLOYEE_LIST, label: 'Por Lista de Empleados' }
  ];

  companies: any[] = [];
  areas: any[] = [];
  positions: any[] = [];

  selectedLevel: VisibilityLevel = VisibilityLevel.PRIVATE;

  get companyOptions(): EntityOption[] {
    return this.companies.map(c => ({ id: c.id, name: c.name }));
  }

  get areaOptions(): EntityOption[] {
    return this.areas.map(a => ({ id: a.id, name: a.name, subtitle: a.company?.name }));
  }

  get positionOptions(): EntityOption[] {
    return this.positions.map(p => ({ id: p.id, name: p.name, subtitle: p.department?.name }));
  }

  get initialCompanies(): EntityOption[] {
    return this.credential?.visibilityCompanies?.map((vc: any) => ({ id: vc.companyId, name: vc.company?.name ?? '' })) ?? [];
  }

  get initialAreas(): EntityOption[] {
    return this.credential?.visibilityAreas?.map((va: any) => ({ id: va.areaId, name: va.area?.name ?? '', subtitle: va.area?.company?.name })) ?? [];
  }

  get initialPositions(): EntityOption[] {
    return this.credential?.visibilityPositions?.map((vp: any) => ({ id: vp.positionId, name: vp.position?.name ?? '', subtitle: vp.position?.department?.name })) ?? [];
  }

  get initialEmployees() {
    return this.credential?.visibilityEmployees?.map(ve => ve.employee) ?? [];
  }

  constructor(
    private companiesService: CompaniesService,
    private areasService: AreasService,
    private positionsService: PositionsService
  ) {}

  async ngOnInit() {
    await this.loadEntities();

    // Set initial level BEFORE subscribing to changes to avoid clearing on init
    const initialLevel = this.formGroup.get('visibilityLevel')?.value;
    if (initialLevel) {
      this.selectedLevel = initialLevel;
    }

    // Watch for visibility level changes (only clear when user actively changes)
    this.formGroup.get('visibilityLevel')?.valueChanges.subscribe(level => {
      if (level !== this.selectedLevel) {
        this.clearVisibilityArrays();
      }
      this.selectedLevel = level;
    });
  }

  async loadEntities() {
    try {
      const [companiesRes, areasRes, positionsRes] = await Promise.all([
        firstValueFrom(this.companiesService.getAll()),
        firstValueFrom(this.areasService.getAll()),
        firstValueFrom(this.positionsService.getAll())
      ]);

      this.companies = companiesRes;
      this.areas = areasRes;
      this.positions = positionsRes;
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }

  clearVisibilityArrays() {
    this.formGroup.patchValue({
      companyIds: [],
      areaIds: [],
      positionIds: [],
      employeeIds: []
    });
  }

  showCompanySelector(): boolean {
    return this.selectedLevel === VisibilityLevel.BY_COMPANY;
  }

  showAreaSelector(): boolean {
    return this.selectedLevel === VisibilityLevel.BY_AREA;
  }

  showPositionSelector(): boolean {
    return this.selectedLevel === VisibilityLevel.BY_POSITION;
  }

  showEmployeeSelector(): boolean {
    return this.selectedLevel === VisibilityLevel.BY_EMPLOYEE_LIST;
  }
}
