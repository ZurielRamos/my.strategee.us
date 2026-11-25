import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IonButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { clipboardOutline, trashOutline, logoGoogle, openOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { TasksService } from '../../services/tasks.service';
import { TaskDialogService } from '../../services/task-dialog.service';
import { Board, BoardMember, Task } from '../../models/task.model';

/**
 * Crear o editar una tarea manual de un tablero. Las tareas de un acta se muestran en solo lectura,
 * con su origen y un enlace al acta.
 * Al cerrarse devuelve { changed: true } si se creó, editó o eliminó la tarea.
 */
@Component({
    selector: 'app-task-modal',
    templateUrl: './task-modal.component.html',
    styleUrls: ['./task-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, IonButton, IonIcon, BaseModalComponent,
        TextInputComponent, TextareaInputComponent, DateInputComponent, FormSelectComponent,
    ]
})
export class TaskModalComponent implements OnInit {
    @Input() task?: Task;
    @Input({ required: true }) board!: Board;
    /** Lista donde se crea la tarea nueva. */
    @Input() listId?: string;
    /** Personas con acceso al tablero (posibles responsables). */
    @Input() members: BoardMember[] = [];
    @Input() currentUserId?: string;

    form!: FormGroup;
    isSaving = false;

    constructor(
        private fb: FormBuilder,
        private tasksService: TasksService,
        private modalCtrl: ModalController,
        private dialog: TaskDialogService,
        private toastService: ToastService,
        private router: Router
    ) {
        addIcons({ clipboardOutline, trashOutline, logoGoogle, openOutline });
    }

    get isNew(): boolean {
        return !this.task;
    }

    get isFromMinute(): boolean {
        return this.task?.source === 'recapmeeting';
    }

    get modalTitle(): string {
        if (this.isNew) return 'Nueva tarea';
        return this.isFromMinute ? 'Compromiso del acta' : 'Editar tarea';
    }

    get originLabel(): string {
        if (!this.task) return '';
        const minute = this.task.recapMinuteNumber ? `Acta #${this.task.recapMinuteNumber}` : 'Acta';
        return [minute, this.task.recapClientName, this.task.recapProjectName].filter(Boolean).join(' · ');
    }

    formatDueDate(date: string | null): string {
        if (!date) return 'Sin fecha';
        return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get memberOptions(): SelectOption[] {
        return this.members.map(m => ({
            value: m.id,
            label: m.id === this.currentUserId ? `${m.name} (yo)` : m.name,
        }));
    }

    /** El selector de responsable solo tiene sentido si el tablero es compartido. */
    get showAssignee(): boolean {
        return this.members.length > 1;
    }

    get assigneeName(): string {
        const member = this.members.find(m => m.id === this.task?.assigneeUserId);
        return member?.name ?? '';
    }

    ngOnInit() {
        this.form = this.fb.group({
            title: [this.task?.title ?? '', [Validators.required, Validators.maxLength(500)]],
            description: [this.task?.description ?? '', [Validators.maxLength(10000)]],
            dueDate: [this.task?.dueDate ?? null],
            assigneeUserId: [this.task?.assigneeUserId ?? this.currentUserId ?? null],
        });
    }

    close(changed = false) {
        this.modalCtrl.dismiss({ changed });
    }

    async save() {
        if (this.isFromMinute) {
            this.close();
            return;
        }
        if (this.form.invalid || this.isSaving) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        const { title, description, dueDate, assigneeUserId } = this.form.value;
        const payload = {
            title: title.trim(),
            description: description?.trim() || null,
            dueDate: dueDate || null,
            ...(this.showAssignee && assigneeUserId ? { assigneeUserId } : {}),
        };
        try {
            if (this.task) {
                await firstValueFrom(this.tasksService.update(this.task.id, payload));
            } else {
                await firstValueFrom(this.tasksService.create({ ...payload, boardId: this.board.id, listId: this.listId }));
            }
            await this.toastService.show(this.isNew ? 'Tarea creada' : 'Tarea actualizada');
            this.close(true);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo guardar la tarea');
        } finally {
            this.isSaving = false;
        }
    }

    async confirmDelete() {
        if (!this.task) return;
        const confirmed = await this.dialog.confirm(
            'Eliminar tarea',
            `¿Eliminar "${this.task.title}"? También se quitará de Google Tasks.`,
            'Eliminar tarea',
            true,
        );
        if (confirmed) await this.delete();
    }

    private async delete() {
        if (!this.task) return;
        try {
            await firstValueFrom(this.tasksService.remove(this.task.id));
            await this.toastService.show('Tarea eliminada');
            this.close(true);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo eliminar la tarea');
        }
    }

    async openMinute() {
        if (!this.task?.recapMinuteId) return;
        await this.modalCtrl.dismiss({ changed: false });
        this.router.navigate(['/employee/minutes', this.task.recapMinuteId], {
            queryParams: { backUrl: '/employee/tasks' }
        });
    }
}
