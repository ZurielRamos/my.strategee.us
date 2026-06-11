import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonContent,
    IonIcon,
    IonButton,
    IonChip,
    IonLabel,
    IonSpinner,
    LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, closeCircle, personOutline, businessOutline, folderOutline, addOutline, trashOutline, arrowBackOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { FilterAutocompleteComponent, FilterOption } from '../components/filter-autocomplete/filter-autocomplete.component';
import { MinutesService } from '../services/minutes.service';
import { MinuteClient, MinuteProject, MinuteDetail } from '../models/minute.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-edit-minute',
    templateUrl: './edit-minute.page.html',
    styleUrls: ['./edit-minute.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        IonContent,
        IonIcon,
        IonButton,
        IonChip,
        IonLabel,
        IonSpinner,
        PageHeaderComponent,
        RichTextEditorComponent,
        FilterAutocompleteComponent,
    ]
})
export class EditMinutePage implements OnInit {
    minuteId = '';
    detail: MinuteDetail | null = null;
    form!: FormGroup;
    isLoading = true;
    isSubmitting = false;

    clients: MinuteClient[] = [];
    projects: MinuteProject[] = [];
    clientOptions: FilterOption[] = [];
    projectOptions: FilterOption[] = [];

    colaboradores: any[] = [];
    externos: any[] = [];
    selectedFuncionarios: any[] = [];
    selectedExternos: any[] = [];
    funcionarioResetValue: string | undefined = undefined;
    externoResetValue: string | undefined = undefined;

    // Compromisos
    commitments: { user_id: string; description: string; delivery_date: string }[] = [];
    newCommitment = { user_id: '', description: '', delivery_date: '' };

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private minutesService: MinutesService,
        private toastService: ToastService,
        private loadingCtrl: LoadingController
    ) {
        addIcons({ calendarOutline, closeCircle, personOutline, businessOutline, folderOutline, addOutline, trashOutline, arrowBackOutline });
    }

    ngOnInit() {
        this.minuteId = this.route.snapshot.paramMap.get('id') || '';
        this.initForm();
        this.loadData();
    }

    initForm() {
        this.form = this.fb.group({
            client_id: ['', Validators.required],
            project_id: ['', Validators.required],
            description: ['', Validators.required],
            start_date: ['', Validators.required],
            start_time: ['', Validators.required],
            end_date: ['', Validators.required],
            end_time: ['', Validators.required],
            copies: [''],
        });
    }

    async loadData() {
        this.isLoading = true;
        try {
            // Load clients first
            this.clients = await this.minutesService.getMyClients().toPromise() || [];
            this.clientOptions = this.clients.map(c => ({ id: c.id, name: c.name }));

            // Load minute detail
            this.detail = await this.minutesService.getMinuteDetail(this.minuteId).toPromise() || null;

            if (this.detail) {
                // Load projects for the client
                await this.loadProjects(this.detail.Contac.client_id);

                // Load team users for assigning
                await this.loadTeamUsers(this.detail.Contac.client_id);

                // Populate form
                this.populateForm();
            }
        } catch (error) {
            await this.toastService.show('Error al cargar el acta');
        } finally {
            this.isLoading = false;
        }
    }

    private populateForm() {
        if (!this.detail) return;
        const contac = this.detail.Contac;

        const startDate = contac.start_date.split(' ')[0];
        const startTime = contac.start_date.split(' ')[1]?.substring(0, 5) || '';
        const endDate = contac.end_date.split(' ')[0];
        const endTime = contac.end_date.split(' ')[1]?.substring(0, 5) || '';

        this.form.patchValue({
            client_id: contac.client_id,
            project_id: contac.project_id,
            description: contac.description,
            start_date: startDate,
            start_time: startTime,
            end_date: endDate,
            end_time: endTime,
            copies: contac.copies || '',
        });

        // Populate participants
        if (this.detail.Assistant) {
            for (const assistant of this.detail.Assistant) {
                const user = {
                    id: assistant.user_id || assistant.User?.id,
                    firstname: assistant.User?.firstname || '',
                    lastname: assistant.User?.lastname || '',
                    email: assistant.User?.email || '',
                };
                if (assistant.type_user === '1') {
                    if (!this.selectedFuncionarios.find(f => f.id === user.id)) {
                        this.selectedFuncionarios = [...this.selectedFuncionarios, user];
                    }
                } else {
                    if (!this.selectedExternos.find(e => e.id === user.id)) {
                        this.selectedExternos = [...this.selectedExternos, user];
                    }
                }
            }
        }

        // Populate commitments
        if (this.detail.Commitment) {
            this.commitments = this.detail.Commitment.map(c => ({
                user_id: c.User?.id || '',
                description: c.description,
                delivery_date: c.delivery_date || '',
            }));
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
            this.colaboradores = (result?.colaboradores || []).map((c: any) => ({
                id: c.id || c.User?.id,
                firstname: c.firstname || c.User?.firstname || '',
                lastname: c.lastname || c.User?.lastname || '',
                email: c.email || c.User?.email || '',
            }));
            this.externos = (result?.externos || []).map((e: any) => ({
                id: e.id || e.User?.id,
                firstname: e.firstname || e.User?.firstname || '',
                lastname: e.lastname || e.User?.lastname || '',
                email: e.email || e.User?.email || '',
            }));
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
    get funcionarioOptions(): FilterOption[] {
        const selectedIds = this.selectedFuncionarios.map(f => f.id);
        return this.colaboradores
            .filter(c => !selectedIds.includes(c.id))
            .map(f => ({ id: f.id, name: this.getUserDisplayName(f) }));
    }

    addFuncionario(id: string | undefined) {
        if (!id) return;
        const user = this.colaboradores.find(c => c.id === id);
        if (user && !this.selectedFuncionarios.find(f => f.id === user.id)) {
            this.selectedFuncionarios = [...this.selectedFuncionarios, user];
        }
        this.funcionarioResetValue = '';
        setTimeout(() => this.funcionarioResetValue = undefined);
    }

    removeFuncionario(user: any) {
        this.selectedFuncionarios = this.selectedFuncionarios.filter(f => f.id !== user.id);
    }

    // --- Externos ---
    get externoOptions(): FilterOption[] {
        const selectedIds = this.selectedExternos.map(e => e.id);
        return this.externos
            .filter(e => !selectedIds.includes(e.id))
            .map(e => ({ id: e.id, name: this.getUserDisplayName(e) }));
    }

    addExterno(id: string | undefined) {
        if (!id) return;
        const user = this.externos.find(e => e.id === id);
        if (user && !this.selectedExternos.find(e => e.id === user.id)) {
            this.selectedExternos = [...this.selectedExternos, user];
        }
        this.externoResetValue = '';
        setTimeout(() => this.externoResetValue = undefined);
    }

    removeExterno(user: any) {
        this.selectedExternos = this.selectedExternos.filter(e => e.id !== user.id);
    }

    // --- Utils ---
    getUserDisplayName(user: any): string {
        if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`.trim();
        return user.email || user.id;
    }

    get isFormValid(): boolean {
        return this.form.valid && this.selectedFuncionarios.length > 0;
    }

    // --- Compromisos ---
    get allParticipantsOptions(): FilterOption[] {
        const all = [...this.selectedFuncionarios, ...this.selectedExternos];
        return all.map(u => ({ id: u.id, name: this.getUserDisplayName(u) }));
    }

    get isCommitmentValid(): boolean {
        return !!(this.newCommitment.description.trim() && this.newCommitment.user_id && this.newCommitment.delivery_date);
    }

    addCommitment() {
        if (!this.isCommitmentValid) return;
        this.commitments = [...this.commitments, { ...this.newCommitment }];
        this.newCommitment = { user_id: '', description: '', delivery_date: '' };
    }

    removeCommitment(index: number) {
        this.commitments = this.commitments.filter((_, i) => i !== index);
    }

    getCommitmentResponsableName(commitment: { user_id: string }): string {
        const all = [...this.colaboradores, ...this.externos];
        const user = all.find(u => u.id === commitment.user_id);
        return user ? this.getUserDisplayName(user) : commitment.user_id;
    }

    // --- Submit ---
    async onSubmit(state: number = 1) {
        if (!this.isFormValid || this.isSubmitting) return;
        this.isSubmitting = true;

        const loading = await this.loadingCtrl.create({
            message: state === 0 ? 'Enviando acta...' : 'Guardando borrador...',
            spinner: 'crescent',
        });
        await loading.present();

        const formValue = this.form.value;
        const data: any = {
            client_id: Number(formValue.client_id),
            project_id: Number(formValue.project_id),
            description: formValue.description,
            start_date: `${formValue.start_date} ${formValue.start_time}:00`,
            end_date: `${formValue.end_date} ${formValue.end_time}:00`,
            funcionarios: this.selectedFuncionarios.map(f => Number(f.id)),
            externos: this.selectedExternos.map(e => Number(e.id)),
            copies: formValue.copies ? formValue.copies.trim() : '',
            commitments: this.commitments.map(c => ({
                user_id: Number(c.user_id),
                description: c.description,
                delivery_date: c.delivery_date,
            })),
            state,
        };

        try {
            await this.minutesService.updateMinute(this.minuteId, data).toPromise();
            await this.toastService.show(state === 0 ? 'Acta enviada exitosamente' : 'Borrador actualizado');
            this.router.navigate(['/employee/minutes', this.minuteId]);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'Error al actualizar el acta');
        } finally {
            this.isSubmitting = false;
            await loading.dismiss();
        }
    }

    goBack() {
        this.router.navigate(['/employee/minutes', this.minuteId]);
    }
}
