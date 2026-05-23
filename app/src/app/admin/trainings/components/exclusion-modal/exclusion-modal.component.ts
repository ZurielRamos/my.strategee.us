import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonSpinner, IonCheckbox, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, personRemoveOutline, refreshOutline, searchOutline, closeOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TrainingsAdminService } from '../../services/trainings-admin.service';
import { ExcludedEmployee } from '../../models/training.model';
import { EmployeesService } from '../../../employees/services/employees.service';
import { Employee } from '../../../employees/models/employee.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { AssignmentMode } from '../../models/training.model';

@Component({
    selector: 'app-exclusion-modal',
    templateUrl: './exclusion-modal.component.html',
    styleUrls: ['./exclusion-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        FormsModule,
        BaseModalComponent,
        IonSpinner,
        IonCheckbox,
        IonButton,
        IonIcon,
        IonBadge
    ]
})
export class ExclusionModalComponent implements OnInit, OnDestroy {
    @Input() trainingId!: string;
    @Input() assignmentMode: AssignmentMode = 'all_with_exclusions';

    // ─── Modo all_with_exclusions ─────────────────────────────────────────────
    excludedEmployees: ExcludedEmployee[] = [];
    // Búsqueda para excluir
    excludeQuery = '';
    excludeResults: Employee[] = [];
    isSearchingExclude = false;
    private excludeSubject = new Subject<string>();

    // ─── Modo selected ────────────────────────────────────────────────────────
    assignedEmployees: any[] = [];
    // Búsqueda para agregar
    addQuery = '';
    addResults: Employee[] = [];
    isSearchingAdd = false;
    private addSubject = new Subject<string>();

    // ─── Compartido ───────────────────────────────────────────────────────────
    selectedIds = new Set<string>();
    isLoading = false;
    isSaving = false;
    revertingId: string | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private modalCtrl: ModalController,
        private trainingsAdminService: TrainingsAdminService,
        private employeesService: EmployeesService,
        private toastService: ToastService
    ) {
        addIcons({ personAddOutline, personRemoveOutline, refreshOutline, searchOutline, closeOutline });
    }

    ngOnInit() {
        this.setupAddSearch();
        this.setupExcludeSearch();
        this.loadData();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ─── Búsqueda modo selected (agregar) ────────────────────────────────────

    private setupAddSearch() {
        this.addSubject.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap(query => {
                if (!query.trim()) {
                    this.addResults = [];
                    this.isSearchingAdd = false;
                    return [];
                }
                this.isSearchingAdd = true;
                return this.employeesService.getAll(1, 20, query, undefined, 'active');
            })
        ).subscribe({
            next: (response: any) => {
                if (!response) return;
                const assignedIds = new Set(this.assignedEmployees.map((a: any) => a.employeeId));
                this.addResults = response.data.filter((e: Employee) => !assignedIds.has(e.id));
                this.isSearchingAdd = false;
            },
            error: () => { this.isSearchingAdd = false; }
        });
    }

    onAddQueryChange(value: string) {
        this.addQuery = value;
        this.selectedIds.clear();
        this.addSubject.next(value);
    }

    clearAddSearch() {
        this.addQuery = '';
        this.addResults = [];
        this.selectedIds.clear();
        this.addSubject.next('');
    }

    // ─── Búsqueda modo all_with_exclusions (excluir) ──────────────────────────

    private setupExcludeSearch() {
        this.excludeSubject.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
            switchMap(query => {
                if (!query.trim()) {
                    this.excludeResults = [];
                    this.isSearchingExclude = false;
                    return [];
                }
                this.isSearchingExclude = true;
                return this.employeesService.getAll(1, 20, query, undefined, 'active');
            })
        ).subscribe({
            next: (response: any) => {
                if (!response) return;
                const excludedIds = new Set(this.excludedEmployees.map(e => e.employeeId));
                this.excludeResults = response.data.filter((e: Employee) => !excludedIds.has(e.id));
                this.isSearchingExclude = false;
            },
            error: () => { this.isSearchingExclude = false; }
        });
    }

    onExcludeQueryChange(value: string) {
        this.excludeQuery = value;
        this.selectedIds.clear();
        this.excludeSubject.next(value);
    }

    clearExcludeSearch() {
        this.excludeQuery = '';
        this.excludeResults = [];
        this.selectedIds.clear();
        this.excludeSubject.next('');
    }

    // ─── Carga inicial ────────────────────────────────────────────────────────

    loadData() {
        this.isLoading = true;
        this.selectedIds.clear();
        this.addQuery = '';
        this.addResults = [];
        this.excludeQuery = '';
        this.excludeResults = [];

        if (this.assignmentMode === 'selected') {
            this.trainingsAdminService.getAssignedEmployees(this.trainingId).subscribe({
                next: (assigned) => {
                    this.assignedEmployees = assigned;
                    this.isLoading = false;
                },
                error: () => { this.isLoading = false; this.toastService.error('Error al cargar empleados'); }
            });
        } else {
            // all_with_exclusions: solo cargar los ya excluidos
            this.trainingsAdminService.getExcluded(this.trainingId).subscribe({
                next: (excluded) => {
                    this.excludedEmployees = excluded;
                    this.isLoading = false;
                },
                error: () => { this.isLoading = false; this.toastService.error('Error al cargar empleados'); }
            });
        }
    }

    toggle(id: string) {
        this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
    }

    isSelected(id: string): boolean { return this.selectedIds.has(id); }
    get hasSelection(): boolean { return this.selectedIds.size > 0; }

    // ─── Modo selected: agregar / quitar ─────────────────────────────────────

    addSelected() {
        if (!this.hasSelection || this.isSaving) return;
        this.isSaving = true;
        const ids = Array.from(this.selectedIds);
        this.trainingsAdminService.addEmployees(this.trainingId, ids).subscribe({
            next: async (r) => {
                await this.toastService.success(`${r.added} empleado(s) agregado(s)`);
                this.isSaving = false;
                this.loadData();
            },
            error: async () => { await this.toastService.error('Error al agregar empleados'); this.isSaving = false; }
        });
    }

    removeAssigned(employeeId: string) {
        this.revertingId = employeeId;
        this.trainingsAdminService.removeEmployee(this.trainingId, employeeId).subscribe({
            next: async () => {
                await this.toastService.success('Empleado removido');
                this.revertingId = null;
                this.loadData();
            },
            error: async () => { await this.toastService.error('Error al remover empleado'); this.revertingId = null; }
        });
    }

    // ─── Modo all_with_exclusions: excluir / reincorporar ────────────────────

    excludeSelected() {
        if (!this.hasSelection || this.isSaving) return;
        this.isSaving = true;
        const ids = Array.from(this.selectedIds);
        this.trainingsAdminService.excludeEmployees(this.trainingId, ids).subscribe({
            next: async (r) => {
                await this.toastService.success(`${r.excluded} empleado(s) excluido(s)`);
                this.isSaving = false;
                this.loadData();
            },
            error: async () => { await this.toastService.error('Error al excluir empleados'); this.isSaving = false; }
        });
    }

    revertExclusion(employeeId: string) {
        this.revertingId = employeeId;
        this.trainingsAdminService.revertExclusion(this.trainingId, employeeId).subscribe({
            next: async () => {
                await this.toastService.success('Empleado reincorporado');
                this.revertingId = null;
                this.loadData();
            },
            error: async () => { await this.toastService.error('Error al reincorporar'); this.revertingId = null; }
        });
    }

    onDismiss() { this.modalCtrl.dismiss(null, 'cancel'); }

    fullName(e: any): string { return `${e.firstName} ${e.lastName}`; }
}
