import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonIcon,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    documentTextOutline,
    calendarOutline,
    checkmarkCircle,
    businessOutline,
    folderOutline,
    timeOutline,
    personOutline
} from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FilterAutocompleteComponent, FilterOption } from '../../../minutes/components/filter-autocomplete/filter-autocomplete.component';
import { MinutesService } from '../../../minutes/services/minutes.service';
import { MinuteListItem, MinuteClient, MinuteProject, MinutesFilter } from '../../../minutes/models/minute.model';

@Component({
    selector: 'app-link-minute-modal',
    templateUrl: './link-minute-modal.component.html',
    styleUrls: ['./link-minute-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        FormsModule,
        IonIcon,
        IonSpinner,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        BaseModalComponent,
        FilterAutocompleteComponent
    ]
})
export class LinkMinuteModalComponent implements OnInit {
    minutes: MinuteListItem[] = [];
    clients: MinuteClient[] = [];
    projects: MinuteProject[] = [];
    clientOptions: FilterOption[] = [];
    projectOptions: FilterOption[] = [];

    isLoading = false;
    currentPage = 1;
    hasMore = true;

    selectedClientId?: string;
    selectedProjectId?: string;
    selectedMinuteId: string | null = null;
    selectedMinute: MinuteListItem | null = null;

    constructor(
        private minutesService: MinutesService,
        private modalCtrl: ModalController
    ) {
        addIcons({
            documentTextOutline,
            calendarOutline,
            checkmarkCircle,
            businessOutline,
            folderOutline,
            timeOutline,
            personOutline
        });
    }

    ngOnInit() {
        this.loadClients();
        this.loadMinutes();
    }

    async loadClients() {
        try {
            this.clients = await this.minutesService.getMyClients().toPromise() || [];
            this.clientOptions = this.clients.map(c => ({ id: c.id, name: c.name }));
        } catch {
            this.clients = [];
        }
    }

    async loadProjects(clientId?: string) {
        try {
            this.projects = await this.minutesService.getMyProjects(clientId).toPromise() || [];
            this.projectOptions = this.projects.map(p => ({ id: p.id, name: p.name }));
        } catch {
            this.projects = [];
        }
    }

    onClientChange(clientId: string | undefined) {
        this.selectedClientId = clientId;
        this.selectedProjectId = undefined;
        this.projectOptions = [];

        if (this.selectedClientId) {
            this.loadProjects(this.selectedClientId);
        } else {
            this.projects = [];
        }
        this.resetAndLoad();
    }

    onProjectChange(projectId: string | undefined) {
        this.selectedProjectId = projectId;
        this.resetAndLoad();
    }

    private get currentFilters(): MinutesFilter | undefined {
        const filters: MinutesFilter = {};
        if (this.selectedClientId) filters.client_id = this.selectedClientId;
        if (this.selectedProjectId) filters.project_id = this.selectedProjectId;
        return Object.keys(filters).length > 0 ? filters : undefined;
    }

    private resetAndLoad() {
        this.minutes = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.selectedMinuteId = null;
        this.selectedMinute = null;
        this.loadMinutes();
    }

    async loadMinutes(append: boolean = false) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const data = await this.minutesService.getMyMinutes(this.currentPage, this.currentFilters).toPromise();
            if (data && data.length > 0) {
                if (append) {
                    this.minutes = [...this.minutes, ...data];
                } else {
                    this.minutes = data;
                }
                this.currentPage++;
            } else {
                this.hasMore = false;
            }
        } catch {
            this.minutes = append ? this.minutes : [];
        } finally {
            this.isLoading = false;
        }
    }

    onIonInfinite(event: any) {
        if (this.hasMore) {
            this.loadMinutes(true);
            setTimeout(() => event.target.complete(), 500);
        } else {
            event.target.complete();
        }
    }

    selectMinute(minute: MinuteListItem) {
        if (this.selectedMinuteId === minute.Contac.id) {
            this.selectedMinuteId = null;
            this.selectedMinute = null;
        } else {
            this.selectedMinuteId = minute.Contac.id;
            this.selectedMinute = minute;
        }
    }

    onConfirm() {
        if (this.selectedMinuteId && this.selectedMinute) {
            this.modalCtrl.dismiss({
                minuteId: this.selectedMinuteId,
                minute: this.selectedMinute
            }, 'save');
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss(null);
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    formatTime(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    stripHtml(html: string): string {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    getDuration(startDate: string, endDate: string): string {
        if (!startDate || !endDate) return '';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} min`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
}
