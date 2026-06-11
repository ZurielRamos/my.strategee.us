import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, IonSpinner, IonItem, IonLabel, IonChip, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle, personOutline, addOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { FilterAutocompleteComponent, FilterOption } from '../../../minutes/components/filter-autocomplete/filter-autocomplete.component';
import { MinutesService } from '../../../minutes/services/minutes.service';
import { MinuteClient, MinuteProject } from '../../../minutes/models/minute.model';
import { CalendarEvent } from '../../models/calendar-event.model';

@Component({
    selector: 'app-create-minute-modal',
    templateUrl: './create-minute-modal.component.html',
    styleUrls: ['./create-minute-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonIcon,
        IonSpinner,
        IonItem,
        IonLabel,
        IonChip,
        BaseModalComponent,
        FormSelectComponent,
        TextareaInputComponent,
        FilterAutocompleteComponent,
    ]
})
export class CreateMinuteModalComponent implements OnInit {
    @Input() event!: CalendarEvent;

    form!: FormGroup;
    isSubmitting = false;
    isLoadingData = false;

    clients: MinuteClient[] = [];
    projects: MinuteProject[] = [];
    clientOptions: FilterOption[] = [];
    projectOptions: FilterOption[] = [];

    colaboradores: any[] = [];
    externos: any[] = [];
    selectedFuncionarios: any[] = [];
    selectedExternos: any[] = [];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private minutesService: MinutesService
    ) {
        addIcons({ closeCircle, personOutline, addOutline });
    }

    ngOnInit() {
        this.initForm();
        this.loadClients();
        this.loadTeamUsers();
    }

    initForm() {
        this.form = this.fb.group({
            client_id: ['', Validators.required],
            project_id: ['', Validators.required],
            description: ['', Validators.required],
        });
    }

    async loadClients() {
        this.isLoadingData = true;
        try {
            this.clients = await this.minutesService.getMyClients().toPromise() || [];
            this.clientOptions = this.clients.map(c => ({ id: c.id, name: c.name }));
        } catch {
            this.clients = [];
        } finally {
            this.isLoadingData = false;
        }
    }

    async loadProjects(clientId: string) {
        try {
            this.projects = await this.minutesService.getMyProjects(clientId).toPromise() || [];
            this.projectOptions = this.projects.map(p => ({ id: p.id, name: p.name }));
        } catch {
            this.projects = [];
            this.projectOptions = [];
        }
    }

    async loadTeamUsers(clientId?: string) {
        try {
            const result = await this.minutesService.getTeamUsers(clientId).toPromise();
            this.colaboradores = result?.colaboradores || [];
            this.externos = result?.externos || [];
        } catch {
            this.colaboradores = [];
            this.externos = [];
        }
    }

    onClientChange(clientId: string | undefined) {
        this.form.patchValue({ client_id: clientId || '', project_id: '' });
        this.projectOptions = [];
        this.selectedExternos = [];

        if (clientId) {
            this.loadProjects(clientId);
            this.loadTeamUsers(clientId);
        } else {
            this.projects = [];
            this.externos = [];
        }
    }

    onProjectChange(projectId: string | undefined) {
        this.form.patchValue({ project_id: projectId || '' });
    }

    // --- Funcionarios ---

    get availableFuncionarios(): any[] {
        const selectedIds = this.selectedFuncionarios.map(f => f.id);
        return this.colaboradores.filter(c => !selectedIds.includes(c.id));
    }

    get funcionarioOptions(): FilterOption[] {
        return this.availableFuncionarios.map(f => ({
            id: f.id,
            name: `${f.firstname} ${f.lastname}`
        }));
    }

    addFuncionario(id: string | undefined) {
        if (!id) return;
        const user = this.colaboradores.find(c => c.id === id);
        if (user && !this.selectedFuncionarios.find(f => f.id === user.id)) {
            this.selectedFuncionarios = [...this.selectedFuncionarios, user];
        }
    }

    removeFuncionario(user: any) {
        this.selectedFuncionarios = this.selectedFuncionarios.filter(f => f.id !== user.id);
    }

    // --- Externos ---

    get availableExternos(): any[] {
        const selectedIds = this.selectedExternos.map(e => e.id);
        return this.externos.filter(e => !selectedIds.includes(e.id));
    }

    get externoOptions(): FilterOption[] {
        return this.availableExternos.map(e => ({
            id: e.id,
            name: `${e.firstname} ${e.lastname}`
        }));
    }

    addExterno(id: string | undefined) {
        if (!id) return;
        const user = this.externos.find(e => e.id === id);
        if (user && !this.selectedExternos.find(e => e.id === user.id)) {
            this.selectedExternos = [...this.selectedExternos, user];
        }
    }

    removeExterno(user: any) {
        this.selectedExternos = this.selectedExternos.filter(e => e.id !== user.id);
    }

    // --- Submit ---

    get isFormValid(): boolean {
        return this.form.valid && this.selectedFuncionarios.length > 0;
    }

    async onConfirm() {
        if (!this.isFormValid || this.isSubmitting) return;
        this.isSubmitting = true;

        const formValue = this.form.value;

        const data = {
            team_id: 5,
            client_id: Number(formValue.client_id),
            project_id: Number(formValue.project_id),
            description: formValue.description,
            start_date: this.formatDateForApi(this.event.start),
            end_date: this.formatDateForApi(this.event.end),
            funcionarios: this.selectedFuncionarios.map(f => Number(f.id)),
            externos: this.selectedExternos.length > 0
                ? this.selectedExternos.map(e => Number(e.id))
                : undefined,
        };

        try {
            const result = await this.minutesService.createMinute(data).toPromise();
            this.modalCtrl.dismiss({ success: true, minute: result }, 'save');
        } catch (error: any) {
            this.modalCtrl.dismiss({ success: false, error: error?.error?.message || 'Error al crear el acta' });
        } finally {
            this.isSubmitting = false;
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss(null);
    }

    private formatDateForApi(dateStr: string): string {
        const date = new Date(dateStr);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:00`;
    }
}
