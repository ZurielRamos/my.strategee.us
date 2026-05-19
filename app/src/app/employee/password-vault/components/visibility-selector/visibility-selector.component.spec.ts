import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { VisibilitySelectorComponent } from './visibility-selector.component';
import { VisibilityLevel } from '../../models/visibility.model';
import { CompaniesService } from '../../../../admin/organization/companies/services/companies.service';
import { AreasService } from '../../../../admin/organization/areas/services/areas.service';
import { PositionsService } from '../../../../admin/organization/positions/services/positions.service';
import { EmployeesService } from '../../../../admin/employees/services/employees.service';
import { of } from 'rxjs';

describe('VisibilitySelectorComponent', () => {
  let component: VisibilitySelectorComponent;
  let fixture: ComponentFixture<VisibilitySelectorComponent>;
  let formBuilder: FormBuilder;
  let mockCompaniesService: jasmine.SpyObj<CompaniesService>;
  let mockAreasService: jasmine.SpyObj<AreasService>;
  let mockPositionsService: jasmine.SpyObj<PositionsService>;
  let mockEmployeesService: jasmine.SpyObj<EmployeesService>;

  beforeEach(async () => {
    mockCompaniesService = jasmine.createSpyObj('CompaniesService', ['getAll']);
    mockAreasService = jasmine.createSpyObj('AreasService', ['getAll']);
    mockPositionsService = jasmine.createSpyObj('PositionsService', ['getAll']);
    mockEmployeesService = jasmine.createSpyObj('EmployeesService', ['getAll']);

    mockCompaniesService.getAll.and.returnValue(of([
      { id: '1', name: 'Company 1', legalName: 'Company 1 Legal', nit: '123', address: 'Address 1', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Company 2', legalName: 'Company 2 Legal', nit: '456', address: 'Address 2', createdAt: new Date(), updatedAt: new Date() }
    ] as any));
    mockAreasService.getAll.and.returnValue(of([
      { id: '1', name: 'Area 1', companyId: '1', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Area 2', companyId: '1', createdAt: new Date(), updatedAt: new Date() }
    ] as any));
    mockPositionsService.getAll.and.returnValue(of([
      { id: '1', name: 'Position 1', riskLevel: 'LOW', departmentId: '1', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Position 2', riskLevel: 'LOW', departmentId: '1', createdAt: new Date(), updatedAt: new Date() }
    ] as any));
    mockEmployeesService.getAll.and.returnValue(of({
      data: [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' }
      ],
      total: 2,
      meta: { page: 1, limit: 10, totalPages: 1 }
    } as any));

    await TestBed.configureTestingModule({
      imports: [VisibilitySelectorComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: CompaniesService, useValue: mockCompaniesService },
        { provide: AreasService, useValue: mockAreasService },
        { provide: PositionsService, useValue: mockPositionsService },
        { provide: EmployeesService, useValue: mockEmployeesService }
      ]
    }).compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(VisibilitySelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have all visibility levels defined', () => {
    expect(component.visibilityLevels.length).toBe(6);
    expect(component.visibilityLevels.map(l => l.value)).toEqual([
      VisibilityLevel.PRIVATE,
      VisibilityLevel.PUBLIC,
      VisibilityLevel.BY_COMPANY,
      VisibilityLevel.BY_AREA,
      VisibilityLevel.BY_POSITION,
      VisibilityLevel.BY_EMPLOYEE_LIST
    ]);
  });

  it('should load entities on init', async () => {
    component.formGroup = formBuilder.group({
      visibilityLevel: [VisibilityLevel.PRIVATE],
      companyIds: [[]],
      areaIds: [[]],
      positionIds: [[]],
      employeeIds: [[]]
    });

    await component.ngOnInit();

    expect(mockCompaniesService.getAll).toHaveBeenCalled();
    expect(mockAreasService.getAll).toHaveBeenCalled();
    expect(mockPositionsService.getAll).toHaveBeenCalled();
    expect(mockEmployeesService.getAll).toHaveBeenCalled();
    expect(component.companies.length).toBe(2);
    expect(component.areas.length).toBe(2);
    expect(component.positions.length).toBe(2);
    expect(component.employees.length).toBe(2);
  });

  it('should show company selector when BY_COMPANY is selected', () => {
    component.selectedLevel = VisibilityLevel.BY_COMPANY;
    expect(component.showCompanySelector()).toBe(true);
    expect(component.showAreaSelector()).toBe(false);
    expect(component.showPositionSelector()).toBe(false);
    expect(component.showEmployeeSelector()).toBe(false);
  });

  it('should show area selector when BY_AREA is selected', () => {
    component.selectedLevel = VisibilityLevel.BY_AREA;
    expect(component.showCompanySelector()).toBe(false);
    expect(component.showAreaSelector()).toBe(true);
    expect(component.showPositionSelector()).toBe(false);
    expect(component.showEmployeeSelector()).toBe(false);
  });

  it('should show position selector when BY_POSITION is selected', () => {
    component.selectedLevel = VisibilityLevel.BY_POSITION;
    expect(component.showCompanySelector()).toBe(false);
    expect(component.showAreaSelector()).toBe(false);
    expect(component.showPositionSelector()).toBe(true);
    expect(component.showEmployeeSelector()).toBe(false);
  });

  it('should show employee selector when BY_EMPLOYEE_LIST is selected', () => {
    component.selectedLevel = VisibilityLevel.BY_EMPLOYEE_LIST;
    expect(component.showCompanySelector()).toBe(false);
    expect(component.showAreaSelector()).toBe(false);
    expect(component.showPositionSelector()).toBe(false);
    expect(component.showEmployeeSelector()).toBe(true);
  });

  it('should clear visibility arrays when level changes', () => {
    component.formGroup = formBuilder.group({
      visibilityLevel: [VisibilityLevel.BY_COMPANY],
      companyIds: [['1', '2']],
      areaIds: [['1']],
      positionIds: [['1']],
      employeeIds: [['1']]
    });

    component.clearVisibilityArrays();

    expect(component.formGroup.get('companyIds')?.value).toEqual([]);
    expect(component.formGroup.get('areaIds')?.value).toEqual([]);
    expect(component.formGroup.get('positionIds')?.value).toEqual([]);
    expect(component.formGroup.get('employeeIds')?.value).toEqual([]);
  });

  it('should format employee full name correctly', () => {
    const employee = { firstName: 'John', lastName: 'Doe' };
    expect(component.getEmployeeFullName(employee)).toBe('John Doe');
  });

  it('should update selectedLevel when form value changes', async () => {
    component.formGroup = formBuilder.group({
      visibilityLevel: [VisibilityLevel.PRIVATE],
      companyIds: [[]],
      areaIds: [[]],
      positionIds: [[]],
      employeeIds: [[]]
    });

    await component.ngOnInit();

    component.formGroup.patchValue({ visibilityLevel: VisibilityLevel.BY_COMPANY });
    
    expect(component.selectedLevel).toBe(VisibilityLevel.BY_COMPANY);
  });
});
