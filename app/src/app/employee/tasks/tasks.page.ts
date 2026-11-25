import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
    CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragMove, CdkDragPlaceholder, CdkDropList, moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
    PopoverController, IonButton, IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSpinner,
    ModalController, ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline, checkmark, checkmarkDoneOutline, clipboardOutline, calendarClearOutline, ellipsisHorizontal,
    peopleOutline, personOutline, reorderTwoOutline, settingsOutline, createOutline, trashOutline,
    arrowBackOutline, arrowForwardOutline, closeCircleOutline, listOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../auth/services/auth.service';
import { TasksService } from './services/tasks.service';
import { BoardsService } from './services/boards.service';
import { TaskDialogService } from './services/task-dialog.service';
import { Board, BoardList, BoardMember, Task } from './models/task.model';
import { TaskModalComponent } from './components/task-modal/task-modal.component';
import { ShareBoardModalComponent } from './components/share-board-modal/share-board-modal.component';
import { ActionsPopoverComponent, PopoverAction } from './components/actions-popover/actions-popover.component';

const SELECTED_BOARD_KEY = 'tasks.selectedBoardId';

/**
 * Tableros de tareas tipo pipeline. Cada tablero tiene listas propias; las marcadas como
 * "hechas" completan las tareas (y los compromisos de recapmeeting). Siempre existe el
 * tablero Recapmeeting con los compromisos del usuario.
 */
@Component({
    selector: 'app-tasks',
    templateUrl: './tasks.page.html',
    styleUrls: ['./tasks.page.scss'],
    standalone: true,
    imports: [
        CommonModule, IonContent, IonButton, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
        CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkScrollable, PageHeaderComponent
    ]
})
export class TasksPage implements OnInit, OnDestroy, ViewWillEnter {
    @ViewChild('boardScroller') boardScroller?: ElementRef<HTMLElement>;

    boards: Board[] = [];
    board: Board | null = null;
    /** Tareas por lista, en su orden. */
    columns: Record<string, Task[]> = {};
    members: BoardMember[] = [];
    isLoading = false;
    isLoadingBoard = false;
    private updating = new Set<string>();
    /** Desplazamiento automático del tablero al arrastrar cerca de los bordes (px por cuadro). */
    private autoScrollSpeed = 0;
    private autoScrollFrame: number | null = null;

    constructor(
        private tasksService: TasksService,
        private boardsService: BoardsService,
        private authService: AuthService,
        private modalCtrl: ModalController,
        private dialog: TaskDialogService,
        private popoverCtrl: PopoverController,
        private toastService: ToastService,
        private zone: NgZone
    ) {
        addIcons({
            addOutline, checkmark, checkmarkDoneOutline, clipboardOutline, calendarClearOutline, ellipsisHorizontal,
            peopleOutline, personOutline, reorderTwoOutline, settingsOutline, createOutline, trashOutline,
            arrowBackOutline, arrowForwardOutline, closeCircleOutline, listOutline,
        });
    }

    ngOnInit() {
        this.loadBoards();
    }

    ngOnDestroy() {
        this.stopAutoScroll();
    }

    ionViewWillEnter() {
        if (this.board) this.loadBoardTasks(false);
    }

    get currentUserId(): string | undefined {
        return this.authService.getCurrentUser()?.id;
    }

    get isRecapBoard(): boolean {
        return this.board?.type === 'recapmeeting';
    }

    get canManage(): boolean {
        return !!this.board?.isOwner;
    }

    /** Ids de las listas, para conectar el arrastre de tarjetas entre ellas. */
    get dropListIds(): string[] {
        return (this.board?.lists ?? []).map(l => `list-${l.id}`);
    }

    // --- Carga ---

    async loadBoards(selectId?: string, refresher?: any) {
        this.isLoading = !this.boards.length;
        try {
            this.boards = await firstValueFrom(this.boardsService.list());
            const wanted = selectId ?? this.board?.id ?? localStorage.getItem(SELECTED_BOARD_KEY);
            const board = this.boards.find(b => b.id === wanted) ?? this.boards[0] ?? null;
            await this.selectBoard(board);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'Error al cargar los tableros');
        } finally {
            this.isLoading = false;
            refresher?.target?.complete();
        }
    }

    async selectBoard(board: Board | null) {
        this.board = board;
        this.columns = this.emptyColumns(board?.lists ?? []);
        this.members = [];
        if (!board) return;
        localStorage.setItem(SELECTED_BOARD_KEY, board.id);
        await this.loadBoardTasks();
    }

    async loadBoardTasks(showSpinner = true) {
        const board = this.board;
        if (!board) return;
        if (showSpinner) this.isLoadingBoard = true;
        try {
            const [tasks, members] = await Promise.all([
                firstValueFrom(this.tasksService.list(board.id)),
                firstValueFrom(this.boardsService.members(board.id)),
            ]);
            if (this.board?.id !== board.id) return; // Se cambió de tablero mientras cargaba.
            this.members = members;
            this.columns = this.emptyColumns(board.lists);
            for (const task of tasks) {
                (this.columns[task.listId] ??= []).push(task);
            }
            Object.values(this.columns).forEach(list => list.sort((a, b) => a.position - b.position));
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'Error al cargar las tareas');
        } finally {
            this.isLoadingBoard = false;
        }
    }

    // --- Desplazamiento automático al arrastrar ---

    /**
     * Al acercar la tarjeta (o la lista) al borde izquierdo o derecho del tablero, este se
     * desplaza solo; cuanto más cerca del borde, más rápido.
     */
    onDragMoved(event: CdkDragMove) {
        const scroller = this.boardScroller?.nativeElement;
        if (!scroller) return;
        const rect = scroller.getBoundingClientRect();
        const x = event.pointerPosition.x;
        const edge = Math.min(120, rect.width / 4);
        const maxSpeed = 18;
        if (x < rect.left + edge) {
            this.autoScrollSpeed = -Math.ceil(maxSpeed * (1 - Math.max(0, x - rect.left) / edge));
        } else if (x > rect.right - edge) {
            this.autoScrollSpeed = Math.ceil(maxSpeed * (1 - Math.max(0, rect.right - x) / edge));
        } else {
            this.autoScrollSpeed = 0;
        }
        if (this.autoScrollSpeed !== 0 && this.autoScrollFrame === null) {
            this.zone.runOutsideAngular(() => this.autoScrollStep());
        }
    }

    stopAutoScroll() {
        this.autoScrollSpeed = 0;
        if (this.autoScrollFrame !== null) {
            cancelAnimationFrame(this.autoScrollFrame);
            this.autoScrollFrame = null;
        }
    }

    private autoScrollStep() {
        const scroller = this.boardScroller?.nativeElement;
        if (!scroller || this.autoScrollSpeed === 0) {
            this.autoScrollFrame = null;
            return;
        }
        scroller.scrollLeft += this.autoScrollSpeed;
        this.autoScrollFrame = requestAnimationFrame(() => this.autoScrollStep());
    }

    // --- Tarjetas ---

    async onTaskDrop(event: CdkDragDrop<Task[], Task[], Task>, list: BoardList) {
        this.stopAutoScroll();
        const task = event.item.data;
        if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) return;
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        }
        await this.saveTaskMove(task, list, event.currentIndex);
    }

    /** Botón rápido: a la primera lista de hechas, o de vuelta a la primera de pendientes. */
    async toggleDone(task: Task, event: Event) {
        event.stopPropagation();
        const lists = this.board?.lists ?? [];
        const target = task.status === 'done' ? lists.find(l => !l.isDone) : lists.find(l => l.isDone);
        if (!target) {
            await this.toastService.show(task.status === 'done'
                ? 'Este tablero no tiene listas de pendientes'
                : 'Este tablero no tiene una lista de hechas. Marca una desde el menú de la lista.');
            return;
        }
        const from = this.columns[task.listId] ?? [];
        from.splice(from.indexOf(task), 1);
        (this.columns[target.id] ??= []).push(task);
        await this.saveTaskMove(task, target, this.columns[target.id].length - 1);
    }

    private async saveTaskMove(task: Task, list: BoardList, position: number) {
        const wasDone = task.status === 'done';
        this.updating.add(task.id);
        task.listId = list.id;
        task.status = list.isDone ? 'done' : 'pending';
        try {
            const updated = await firstValueFrom(this.tasksService.update(task.id, { listId: list.id, position }));
            Object.assign(task, updated);
            if (task.source === 'recapmeeting' && wasDone !== list.isDone) {
                await this.toastService.show(list.isDone
                    ? 'El compromiso también quedó terminado en el acta.'
                    : 'El compromiso volvió a quedar pendiente en el acta.');
            }
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo mover la tarea');
            await this.loadBoardTasks(false);
        } finally {
            this.updating.delete(task.id);
        }
    }

    isUpdating(task: Task): boolean {
        return this.updating.has(task.id);
    }

    async openTask(task?: Task, list?: BoardList) {
        if (!this.board) return;
        const isMobile = window.innerWidth < 768;
        const modal = await this.modalCtrl.create({
            component: TaskModalComponent,
            componentProps: {
                task, board: this.board, listId: list?.id, members: this.members, currentUserId: this.currentUserId,
            },
            cssClass: 'task-modal',
            ...(isMobile ? { breakpoints: [0, 0.75, 0.95], initialBreakpoint: 0.75 } : {})
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.changed) await this.loadBoardTasks(false);
    }

    // --- Tableros ---

    async createBoard() {
        const name = await this.dialog.prompt('Nuevo tablero', 'Nombre del tablero', '', 'Crear tablero', 'Por ejemplo: Marketing');
        if (!name) return;
        try {
            const board = await firstValueFrom(this.boardsService.create(name));
            await this.loadBoards(board.id);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo crear el tablero');
        }
    }

    async openBoardMenu(event: Event) {
        if (!this.board || !this.canManage || this.isRecapBoard) return;
        const action = await this.showActions(event, [
            { key: 'share', label: 'Compartir', icon: 'people-outline' },
            { key: 'rename', label: 'Renombrar', icon: 'create-outline' },
            { key: 'list', label: 'Nueva lista', icon: 'list-outline' },
            { key: 'delete', label: 'Eliminar tablero', icon: 'trash-outline', danger: true },
        ]);
        switch (action) {
            case 'share': await this.shareBoard(); break;
            case 'rename': await this.renameBoard(); break;
            case 'list': await this.createList(); break;
            case 'delete': await this.deleteBoard(); break;
        }
    }

    /** Muestra un menú de acciones junto al elemento pulsado y devuelve la elegida. */
    private async showActions(event: Event, actions: PopoverAction[]): Promise<string | undefined> {
        const popover = await this.popoverCtrl.create({
            component: ActionsPopoverComponent,
            componentProps: { actions },
            event,
            alignment: 'end',
            size: 'auto',
        });
        await popover.present();
        const { data } = await popover.onWillDismiss();
        return data?.action;
    }

    private async shareBoard() {
        if (!this.board) return;
        const modal = await this.modalCtrl.create({
            component: ShareBoardModalComponent,
            componentProps: { board: this.board },
            cssClass: 'task-modal',
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.changed) await this.loadBoards(this.board.id);
    }

    private async renameBoard() {
        if (!this.board) return;
        const name = await this.dialog.prompt('Renombrar tablero', 'Nombre del tablero', this.board.name);
        if (!name || name === this.board.name) return;
        try {
            await firstValueFrom(this.boardsService.rename(this.board.id, name));
            await this.loadBoards(this.board.id);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo renombrar el tablero');
        }
    }

    private async deleteBoard() {
        if (!this.board) return;
        const board = this.board;
        const confirmed = await this.dialog.confirm(
            'Eliminar tablero',
            `Se eliminarán "${board.name}", sus listas y todas sus tareas, también en Google Tasks. Esta acción no se puede deshacer.`,
            'Eliminar tablero',
            true,
        );
        if (!confirmed) return;
        try {
            await firstValueFrom(this.boardsService.remove(board.id));
            localStorage.removeItem(SELECTED_BOARD_KEY);
            this.board = null;
            await this.loadBoards();
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo eliminar el tablero');
        }
    }

    // --- Listas ---

    async createList() {
        if (!this.board) return;
        const name = await this.dialog.prompt('Nueva lista', 'Nombre de la lista', '', 'Crear lista', 'Por ejemplo: En revisión');
        if (!name) return;
        try {
            await firstValueFrom(this.boardsService.createList(this.board.id, name));
            await this.loadBoards(this.board.id);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo crear la lista');
        }
    }

    async openListMenu(list: BoardList, event: Event) {
        event.stopPropagation();
        if (!this.board) return;
        const lists = this.board.lists;
        const index = lists.indexOf(list);
        const action = await this.showActions(event, [
            { key: 'rename', label: 'Renombrar', icon: 'create-outline' },
            list.isDone
                ? { key: 'undone', label: 'Dejar de marcar como hechas', icon: 'close-circle-outline' }
                : { key: 'done', label: 'Marcar las tareas como hechas', icon: 'checkmark-done-outline' },
            ...(index > 0 ? [{ key: 'left', label: 'Mover a la izquierda', icon: 'arrow-back-outline' }] : []),
            ...(index < lists.length - 1 ? [{ key: 'right', label: 'Mover a la derecha', icon: 'arrow-forward-outline' }] : []),
            { key: 'delete', label: 'Eliminar lista', icon: 'trash-outline', danger: true },
        ]);
        switch (action) {
            case 'rename': await this.renameList(list); break;
            case 'done': await this.setListDone(list, true); break;
            case 'undone': await this.setListDone(list, false); break;
            case 'left': await this.moveList(list, index - 1); break;
            case 'right': await this.moveList(list, index + 1); break;
            case 'delete': await this.deleteList(list); break;
        }
    }

    async onListDrop(event: CdkDragDrop<BoardList[]>) {
        this.stopAutoScroll();
        if (!this.board || event.previousIndex === event.currentIndex) return;
        const list = this.board.lists[event.previousIndex];
        moveItemInArray(this.board.lists, event.previousIndex, event.currentIndex);
        await this.saveListPosition(list, event.currentIndex);
    }

    private async moveList(list: BoardList, position: number) {
        if (!this.board) return;
        moveItemInArray(this.board.lists, this.board.lists.indexOf(list), position);
        await this.saveListPosition(list, position);
    }

    private async saveListPosition(list: BoardList, position: number) {
        try {
            await firstValueFrom(this.boardsService.updateList(list.id, { position }));
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo mover la lista');
            await this.loadBoards(this.board?.id);
        }
    }

    private async renameList(list: BoardList) {
        const name = await this.dialog.prompt('Renombrar lista', 'Nombre de la lista', list.name);
        if (!name || name === list.name) return;
        try {
            await firstValueFrom(this.boardsService.updateList(list.id, { name }));
            list.name = name;
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo renombrar la lista');
        }
    }

    private async setListDone(list: BoardList, isDone: boolean) {
        const count = this.columns[list.id]?.length ?? 0;
        if (count > 0) {
            const tasksLabel = count === 1 ? 'La tarea' : `Las ${count} tareas`;
            const confirmed = await this.dialog.confirm(
                isDone ? 'Marcar como hechas' : 'Dejar de marcar como hechas',
                isDone
                    ? `${tasksLabel} de "${list.name}" ${count === 1 ? 'quedará' : 'quedarán'} como ${count === 1 ? 'hecha' : 'hechas'}, también en Google Tasks.`
                    : `${tasksLabel} de "${list.name}" ${count === 1 ? 'volverá' : 'volverán'} a quedar ${count === 1 ? 'pendiente' : 'pendientes'}.`,
                isDone ? 'Marcar como hechas' : 'Dejar de marcar',
            );
            if (!confirmed) return;
        }
        try {
            await firstValueFrom(this.boardsService.updateList(list.id, { isDone }));
            await this.loadBoards(this.board?.id);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo actualizar la lista');
        }
    }

    private async deleteList(list: BoardList) {
        if (!this.board) return;
        const tasks = this.columns[list.id] ?? [];
        let moveToListId: string | undefined;
        if (tasks.length > 0) {
            const others = this.board.lists.filter(l => l.id !== list.id);
            moveToListId = await this.dialog.choose(
                `Eliminar "${list.name}"`,
                `Tiene ${tasks.length} tarea${tasks.length > 1 ? 's' : ''}. ¿A qué lista ${tasks.length > 1 ? 'las' : 'la'} movemos?`,
                others.map(l => ({ value: l.id, label: l.name, hint: l.isDone ? 'Las tareas quedan como hechas' : undefined })),
                'Mover y eliminar',
                true,
            ) ?? undefined;
            if (!moveToListId) return;
        } else if (!(await this.dialog.confirm('Eliminar lista', `¿Eliminar la lista "${list.name}"?`, 'Eliminar lista', true))) {
            return;
        }
        try {
            await firstValueFrom(this.boardsService.deleteList(list.id, moveToListId));
            await this.loadBoards(this.board.id);
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || 'No se pudo eliminar la lista');
        }
    }

    // --- Tarjeta: textos ---

    originLabel(task: Task): string {
        const minute = task.recapMinuteNumber ? `Acta #${task.recapMinuteNumber}` : 'Acta';
        return [minute, task.recapClientName].filter(Boolean).join(' · ');
    }

    assigneeInitials(task: Task): string {
        const name = this.members.find(m => m.id === task.assigneeUserId)?.name ?? '';
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    }

    assigneeName(task: Task): string {
        return this.members.find(m => m.id === task.assigneeUserId)?.name ?? '';
    }

    dueLabel(task: Task): string {
        if (!task.dueDate) return '';
        if (task.dueDate === this.dateKey(0)) return 'Hoy';
        if (task.dueDate === this.dateKey(1)) return 'Mañana';
        return new Date(`${task.dueDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    isOverdue(task: Task): boolean {
        return task.status !== 'done' && !!task.dueDate && task.dueDate < this.dateKey(0);
    }

    private emptyColumns(lists: BoardList[]): Record<string, Task[]> {
        const columns: Record<string, Task[]> = {};
        lists.forEach(l => (columns[l.id] = []));
        return columns;
    }

    /** Fecha local YYYY-MM-DD dentro de `days` días. */
    private dateKey(days: number): string {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}
