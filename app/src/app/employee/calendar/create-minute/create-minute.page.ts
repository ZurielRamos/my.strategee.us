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
    LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, closeCircle, personOutline, businessOutline, folderOutline, addOutline, trashOutline, documentOutline, cloudUploadOutline, checkmarkCircle, imageOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { FilterAutocompleteComponent, FilterOption } from '../../minutes/components/filter-autocomplete/filter-autocomplete.component';
import { MinutesService } from '../../minutes/services/minutes.service';
import { MinuteClient, MinuteProject } from '../../minutes/models/minute.model';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { CalendarEvent } from '../models/calendar-event.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-create-minute',
    templateUrl: './create-minute.page.html',
    styleUrls: ['./create-minute.page.scss'],
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
        PageHeaderComponent,
        RichTextEditorComponent,
        FilterAutocompleteComponent,
    ]
})
export class CreateMinutePage implements OnInit {
    event: CalendarEvent | null = null;
    form!: FormGroup;
    isSubmitting = false;
    backUrl = '/employee/calendar';

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

    // Attachments
    images: File[] = [];
    documents: File[] = [];

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private minutesService: MinutesService,
        private calendarService: GoogleCalendarService,
        private toastService: ToastService,
        private loadingCtrl: LoadingController
    ) {
        addIcons({ calendarOutline, closeCircle, personOutline, businessOutline, folderOutline, addOutline, trashOutline, documentOutline, cloudUploadOutline, checkmarkCircle, imageOutline });

        // Recuperar evento de sessionStorage
        const stored = sessionStorage.getItem('create-minute-event');
        if (stored) {
            try {
                this.event = JSON.parse(stored);
            } catch { /* ignore */ }
        }
    }

    ngOnInit() {
        // Back URL desde query params
        const eventId = this.route.snapshot.queryParamMap.get('eventId');
        if (eventId) {
            this.backUrl = `/employee/calendar/event/${eventId}`;

            // Si no hay evento del storage, cargar desde la API
            if (!this.event) {
                this.loadEventFromApi(eventId);
            }
        }

        this.initForm();
        this.loadClients();
        this.loadTeamUsers();
    }

    private async loadEventFromApi(eventId: string) {
        try {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
            const events = await this.calendarService.getEvents({
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                maxResults: 250
            }).toPromise() || [];
            this.event = events.find(e => e.id === eventId) || null;
            // Re-init form with event dates
            if (this.event) {
                this.form.patchValue({
                    start_date: this.formatDateForInput(this.event.start),
                    start_time: this.formatTimeForInput(this.event.start),
                    end_date: this.formatDateForInput(this.event.end),
                    end_time: this.formatTimeForInput(this.event.end),
                });
            }
        } catch {
            // If can't load, the form still works with manual dates
        }
    }

    initForm() {
        // Precargar fechas del evento
        const startDate = this.event ? this.formatDateForInput(this.event.start) : '';
        const endDate = this.event ? this.formatDateForInput(this.event.end) : '';
        const startTime = this.event ? this.formatTimeForInput(this.event.start) : '';
        const endTime = this.event ? this.formatTimeForInput(this.event.end) : '';

        this.form = this.fb.group({
            client_id: ['', Validators.required],
            project_id: ['', Validators.required],
            description: ['', Validators.required],
            start_date: [startDate, Validators.required],
            start_time: [startTime, Validators.required],
            end_date: [endDate, Validators.required],
            end_time: [endTime, Validators.required],
            copies: [''],
        });
    }

    private formatDateForInput(dateStr: string): string {
        const date = new Date(dateStr);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private formatTimeForInput(dateStr: string): string {
        const date = new Date(dateStr);
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${min}`;
    }

    async loadClients() {
        try {
            this.clients = await this.minutesService.getMyClients().toPromise() || [];
            this.clientOptions = this.clients.map(c => ({ id: c.id, name: c.name }));
        } catch {
            this.clients = [];
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
            // Normalizar estructura - la API puede retornar {id, firstname, lastname} 
            // o puede anidar en User, o tener campos como name
            this.colaboradores = (result?.colaboradores || []).map((c: any) => ({
                id: c.id || c.User?.id,
                firstname: c.firstname || c.User?.firstname || c.name?.split(' ')[0] || '',
                lastname: c.lastname || c.User?.lastname || c.name?.split(' ').slice(1).join(' ') || '',
                email: c.email || c.User?.email || '',
            }));
            this.externos = (result?.externos || []).map((e: any) => ({
                id: e.id || e.User?.id,
                firstname: e.firstname || e.User?.firstname || e.name?.split(' ')[0] || '',
                lastname: e.lastname || e.User?.lastname || e.name?.split(' ').slice(1).join(' ') || '',
                email: e.email || e.User?.email || '',
            }));

            // Precargar participantes internos que coincidan con asistentes del evento (@strategee.us)
            this.preselectEventAttendees();
        } catch {
            this.colaboradores = [];
            this.externos = [];
        }
    }

    /**
     * Preselecciona como participantes internos a los asistentes del evento
     * que tengan correo @strategee.us y existan en la lista de colaboradores.
     */
    private preselectEventAttendees() {
        if (!this.event?.attendees || this.colaboradores.length === 0) return;

        const strategeeAttendees = this.event.attendees
            .filter(a => a.email && a.email.endsWith('@strategee.us'))
            .map(a => a.email!.toLowerCase());

        for (const colaborador of this.colaboradores) {
            const email = colaborador.email?.toLowerCase();
            if (email && strategeeAttendees.includes(email)) {
                if (!this.selectedFuncionarios.find(f => f.id === colaborador.id)) {
                    this.selectedFuncionarios = [...this.selectedFuncionarios, colaborador];
                }
            }
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
            .map(f => ({
                id: f.id,
                name: (f.firstname && f.lastname) ? `${f.firstname} ${f.lastname}`.trim() : f.email || f.id
            }));
    }

    addFuncionario(id: string | undefined) {
        if (!id) return;
        const user = this.colaboradores.find(c => c.id === id);
        if (user && !this.selectedFuncionarios.find(f => f.id === user.id)) {
            this.selectedFuncionarios = [...this.selectedFuncionarios, user];
        }
        // Reset the input
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
            .map(e => ({
                id: e.id,
                name: (e.firstname && e.lastname) ? `${e.firstname} ${e.lastname}`.trim() : e.email || e.id
            }));
    }

    addExterno(id: string | undefined) {
        if (!id) return;
        const user = this.externos.find(e => e.id === id);
        if (user && !this.selectedExternos.find(e => e.id === user.id)) {
            this.selectedExternos = [...this.selectedExternos, user];
        }
        // Reset the input
        this.externoResetValue = '';
        setTimeout(() => this.externoResetValue = undefined);
    }

    removeExterno(user: any) {
        this.selectedExternos = this.selectedExternos.filter(e => e.id !== user.id);
    }

    // --- Validation & Submit ---

    get isFormValid(): boolean {
        return this.form.valid && this.selectedFuncionarios.length > 0;
    }

    getUserDisplayName(user: any): string {
        if (user.firstname && user.lastname) {
            return `${user.firstname} ${user.lastname}`.trim();
        }
        return user.email || user.id;
    }

    // --- Compromisos ---

    get allParticipantsOptions(): FilterOption[] {
        const all = [...this.selectedFuncionarios, ...this.selectedExternos];
        return all.map(u => ({
            id: u.id,
            name: this.getUserDisplayName(u)
        }));
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

    // --- Attachments ---

    onImagesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            for (let i = 0; i < input.files.length; i++) {
                this.images = [...this.images, input.files[i]];
            }
            input.value = '';
        }
    }

    onDocumentsSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            for (let i = 0; i < input.files.length; i++) {
                this.documents = [...this.documents, input.files[i]];
            }
            input.value = '';
        }
    }

    removeImage(index: number) {
        this.images = this.images.filter((_, i) => i !== index);
    }

    removeDocument(index: number) {
        this.documents = this.documents.filter((_, i) => i !== index);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    private async uploadAttachmentsToMinute(minuteId: string) {
        // Subir imágenes
        for (const file of this.images) {
            try {
                await this.minutesService.uploadImage(minuteId, file).toPromise();
            } catch {
                // No es crítico, continuar con el siguiente
            }
        }
        // Subir documentos
        for (const file of this.documents) {
            try {
                await this.minutesService.uploadDocument(minuteId, file).toPromise();
            } catch {
                // No es crítico, continuar con el siguiente
            }
        }
    }

    async onSubmit(state: number = 0) {
        if (!this.isFormValid || this.isSubmitting || !this.event) return;
        this.isSubmitting = true;

        const loading = await this.loadingCtrl.create({
            message: state === 1 ? 'Guardando borrador...' : 'Creando acta...'
        });
        await loading.present();

        const formValue = this.form.value;
        const data = {
            team_id: 5,
            client_id: Number(formValue.client_id),
            project_id: Number(formValue.project_id),
            description: formValue.description,
            start_date: `${formValue.start_date} ${formValue.start_time}:00`,
            end_date: `${formValue.end_date} ${formValue.end_time}:00`,
            funcionarios: this.selectedFuncionarios.map(f => Number(f.id)),
            externos: this.selectedExternos.length > 0
                ? this.selectedExternos.map(e => Number(e.id))
                : undefined,
            copies: formValue.copies ? formValue.copies.trim() : undefined,
            commitments: this.commitments.map(c => ({
                    user_id: Number(c.user_id),
                    description: c.description,
                    delivery_date: c.delivery_date,
                })),
            state,
        };

        try {
            const result = await this.minutesService.createMinute(data).toPromise();

            // Subir archivos al acta creada
            const minuteId = result?.Contac?.id || result?.id || result?.contac_id;
            console.log('[CreateMinute] Acta creada, minuteId:', minuteId, 'eventId:', this.event.id);

            if (minuteId && (this.images.length > 0 || this.documents.length > 0)) {
                await this.uploadAttachmentsToMinute(String(minuteId));
            }

            // Vincular automáticamente al evento (tanto para actas como borradores)
            if (minuteId && this.event) {
                console.log('[CreateMinute] Vinculando minuteId:', minuteId, 'al evento:', this.event.id);
                try {
                    await this.calendarService.linkEventToMinute(this.event.id, String(minuteId)).toPromise();
                    console.log('[CreateMinute] Vinculación exitosa');
                } catch (err) {
                    console.error('[CreateMinute] Error al vincular:', err);
                }
            } else {
                console.warn('[CreateMinute] No se pudo vincular. minuteId:', minuteId, 'event:', this.event);
            }

            await this.toastService.show(state === 1 ? 'Borrador guardado y vinculado' : 'Acta creada y vinculada exitosamente');
            this.router.navigateByUrl(this.backUrl);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'Error al crear el acta');
        } finally {
            this.isSubmitting = false;
            await loading.dismiss();
        }
    }

    goBack() {
        sessionStorage.removeItem('create-minute-event');
        this.router.navigateByUrl(this.backUrl);
    }

    private formatDateForApi(dateStr: string): string {
        return dateStr; // kept for compatibility
    }
}
