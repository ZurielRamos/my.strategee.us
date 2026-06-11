import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  calendarOutline,
  personOutline,
  businessOutline,
  folderOutline,
  timeOutline,
  filterOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MinutesService } from './services/minutes.service';
import { MinuteListItem, MinuteClient, MinuteProject, MinutesFilter } from './models/minute.model';
import { FilterAutocompleteComponent, FilterOption } from './components/filter-autocomplete/filter-autocomplete.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-minutes',
  templateUrl: './minutes.page.html',
  styleUrls: ['./minutes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    PageHeaderComponent,
    FilterAutocompleteComponent,
  ],
})
export class MinutesPage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

  minutes: MinuteListItem[] = [];
  clients: MinuteClient[] = [];
  projects: MinuteProject[] = [];
  clientOptions: FilterOption[] = [];
  projectOptions: FilterOption[] = [];
  isLoading = false;
  currentPage = 1;
  hasMore = true;

  // Filtros
  selectedClientId?: string;
  selectedProjectId?: string;

  constructor(
    private minutesService: MinutesService,
    private router: Router,
    private toastService: ToastService
  ) {
    addIcons({
      documentTextOutline,
      calendarOutline,
      personOutline,
      businessOutline,
      folderOutline,
      timeOutline,
      filterOutline,
      closeCircleOutline,
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
    } catch (error) {
      console.error('Error loading clients', error);
    }
  }

  async loadProjects(clientId?: string) {
    try {
      this.projects = await this.minutesService.getMyProjects(clientId).toPromise() || [];
      this.projectOptions = this.projects.map(p => ({ id: p.id, name: p.name }));
    } catch (error) {
      console.error('Error loading projects', error);
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

  hasActiveFilters(): boolean {
    return !!(this.selectedClientId || this.selectedProjectId);
  }

  clearFilters() {
    this.selectedClientId = undefined;
    this.selectedProjectId = undefined;
    this.projects = [];
    this.projectOptions = [];
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
    } catch (error) {
      await this.toastService.show('Error al cargar las actas');
    } finally {
      this.isLoading = false;
    }
  }

  onIonInfinite(event: any) {
    if (this.hasMore) {
      this.loadMinutes(true);
      setTimeout(() => {
        event.target.complete();
      }, 500);
    } else {
      event.target.complete();
    }
  }

  async openDetail(minute: MinuteListItem) {
    this.router.navigate(['/employee/minutes', minute.Contac.id]);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
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
