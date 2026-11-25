import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IonIcon, IonSearchbar, IonSegment, IonSegmentButton, IonLabel, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmark, peopleOutline, businessOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { BoardsService } from '../../services/boards.service';
import { Board, ShareOptions } from '../../models/task.model';

/** Elegir con qué empleados y departamentos se comparte un tablero. Devuelve { changed: true } al guardar. */
@Component({
    selector: 'app-share-board-modal',
    templateUrl: './share-board-modal.component.html',
    styleUrls: ['./share-board-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonIcon, IonSearchbar, IonSegment, IonSegmentButton, IonLabel, IonSpinner, BaseModalComponent]
})
export class ShareBoardModalComponent implements OnInit {
    @Input({ required: true }) board!: Board;

    options: ShareOptions = { users: [], departments: [] };
    selectedUsers = new Set<string>();
    selectedDepartments = new Set<string>();
    tab: 'users' | 'departments' = 'users';
    search = '';
    isLoading = true;
    isSaving = false;

    constructor(
        private boardsService: BoardsService,
        private modalCtrl: ModalController,
        private toastService: ToastService
    ) {
        addIcons({ checkmark, peopleOutline, businessOutline });
    }

    async ngOnInit() {
        this.board.shares.forEach(s => {
            if (s.userId) this.selectedUsers.add(s.userId);
            if (s.departmentId) this.selectedDepartments.add(s.departmentId);
        });
        try {
            this.options = await firstValueFrom(this.boardsService.shareOptions());
        } catch {
            await this.toastService.show('No se pudieron cargar los empleados');
        } finally {
            this.isLoading = false;
        }
    }

    get filteredUsers() {
        const q = this.normalize(this.search);
        return this.options.users.filter(u => !q || this.normalize(`${u.name} ${u.email}`).includes(q));
    }

    get filteredDepartments() {
        const q = this.normalize(this.search);
        return this.options.departments.filter(d => !q || this.normalize(d.name).includes(q));
    }

    get summary(): string {
        const parts: string[] = [];
        if (this.selectedUsers.size) parts.push(`${this.selectedUsers.size} empleado${this.selectedUsers.size > 1 ? 's' : ''}`);
        if (this.selectedDepartments.size) parts.push(`${this.selectedDepartments.size} departamento${this.selectedDepartments.size > 1 ? 's' : ''}`);
        return parts.length ? `Compartido con ${parts.join(' y ')}` : 'Solo tú tienes acceso';
    }

    toggle(set: Set<string>, id: string) {
        set.has(id) ? set.delete(id) : set.add(id);
    }

    close(changed = false) {
        this.modalCtrl.dismiss({ changed });
    }

    async save() {
        this.isSaving = true;
        try {
            await firstValueFrom(this.boardsService.setShares(this.board.id, [...this.selectedUsers], [...this.selectedDepartments]));
            await this.toastService.show('Accesos actualizados');
            this.close(true);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudieron guardar los accesos');
        } finally {
            this.isSaving = false;
        }
    }

    private normalize(text: string): string {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
}
