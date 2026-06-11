import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonButton,
    IonBadge,
    IonChip,
    ModalController,
    LoadingController,
    ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline,
    timeOutline,
    locationOutline,
    videocamOutline,
    peopleOutline,
    linkOutline,
    openOutline,
    personOutline,
    mailOutline,
    checkmarkCircle,
    closeCircle,
    helpCircle,
    removeCircle,
    documentTextOutline,
    addOutline,
    trashOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { CalendarEvent, EventMinuteLink } from '../models/calendar-event.model';
import { ToastService } from '../../../shared/services/toast.service';
import { LinkMinuteModalComponent } from '../components/link-minute-modal/link-minute-modal.component';
import { MinutesService } from '../../minutes/services/minutes.service';
import { MinuteListItem } from '../../minutes/models/minute.model';

@Component({
    selector: 'app-event-detail',
    templateUrl: './event-detail.page.html',
    styleUrls: ['./event-detail.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        IonContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonButton,
        IonBadge,
        IonChip,
        PageHeaderComponent
    ]
})
export class EventDetailPage implements OnInit, ViewWillEnter {
    event: CalendarEvent | null = null;
    eventLink: EventMinuteLink | null = null;
    linkedMinute: MinuteListItem | null = null;
    linkedMinuteState: string | null = null;
    isLoading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private calendarService: GoogleCalendarService,
        private minutesService: MinutesService,
        private toastService: ToastService,
        private modalCtrl: ModalController,
        private loadingCtrl: LoadingController
    ) {
        addIcons({
            calendarOutline,
            timeOutline,
            locationOutline,
            videocamOutline,
            peopleOutline,
            linkOutline,
            openOutline,
            personOutline,
            mailOutline,
            checkmarkCircle,
            closeCircle,
            helpCircle,
            removeCircle,
            documentTextOutline,
            addOutline,
            trashOutline
        });
    }

    ngOnInit() {
        // El evento se pasa como state desde la navegación
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras?.state?.['event']) {
            this.event = nav.extras.state['event'];
            this.isLoading = false;
            this.loadEventLink();
        } else {
            // Si no hay state (recarga de página), intentar cargar por ID
            const eventId = this.route.snapshot.paramMap.get('id');
            if (eventId) {
                this.loadEventById(eventId);
            } else {
                this.router.navigate(['/employee/calendar']);
            }
        }
    }

    ionViewWillEnter() {
        // Recargar vinculación cada vez que la vista se muestra (Ionic cachea las páginas)
        this.loadEventLink();
    }

    private async loadEventLink() {
        if (!this.event) return;
        try {
            this.eventLink = await this.calendarService.getEventLink(this.event.id).toPromise() || null;

            // Verificar que el acta aún existe y obtener su estado
            if (this.eventLink) {
                try {
                    const minuteDetail = await this.minutesService.getMinuteDetail(this.eventLink.minuteId).toPromise();
                    this.linkedMinuteState = minuteDetail?.Contac?.state || null;
                } catch {
                    // Si el acta no existe (404 o error), desvinculamos
                    await this.calendarService.unlinkEvent(this.event.id).toPromise();
                    this.eventLink = null;
                    this.linkedMinuteState = null;
                }
            }
        } catch {
            this.eventLink = null;
        }
    }

    private async loadEventById(eventId: string) {
        try {
            // Cargar eventos del día actual y buscar por ID
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);

            const events = await this.calendarService.getEvents({
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                maxResults: 250
            }).toPromise() || [];

            this.event = events.find(e => e.id === eventId) || null;

            if (!this.event) {
                await this.toastService.show('No se encontró el evento');
                this.router.navigate(['/employee/calendar']);
            }
        } catch {
            await this.toastService.show('Error al cargar el evento');
            this.router.navigate(['/employee/calendar']);
        } finally {
            this.isLoading = false;
        }
    }

    // --- Vinculación con Actas ---

    async openLinkMinuteModal() {
        const modal = await this.modalCtrl.create({
            component: LinkMinuteModalComponent,
            cssClass: 'full-modal',
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data?.minuteId && this.event) {
            const loading = await this.loadingCtrl.create({ message: 'Vinculando acta...' });
            await loading.present();
            try {
                this.eventLink = await this.calendarService
                    .linkEventToMinute(this.event.id, data.minuteId)
                    .toPromise() || null;
                this.linkedMinute = data.minute || null;
                await this.toastService.show('Acta vinculada exitosamente');
            } catch {
                await this.toastService.show('Error al vincular el acta');
            } finally {
                await loading.dismiss();
            }
        }
    }

    async unlinkMinute() {
        if (!this.event || !this.eventLink) return;
        const loading = await this.loadingCtrl.create({ message: 'Desvinculando...' });
        await loading.present();
        try {
            await this.calendarService.unlinkEvent(this.event.id).toPromise();
            this.eventLink = null;
            this.linkedMinute = null;
            await this.toastService.show('Acta desvinculada');
        } catch {
            await this.toastService.show('Error al desvincular el acta');
        } finally {
            await loading.dismiss();
        }
    }

    async openLinkedMinute() {
        if (this.eventLink && this.event) {
            this.router.navigate(['/employee/minutes', this.eventLink.minuteId], {
                queryParams: { backUrl: `/employee/calendar/event/${this.event.id}` }
            });
        }
    }

    saveEventToStorage() {
        if (this.event) {
            sessionStorage.setItem('create-minute-event', JSON.stringify(this.event));
        }
    }

    openCreateMinuteModal() {
        if (!this.event) return;
        sessionStorage.setItem('create-minute-event', JSON.stringify(this.event));
        this.router.navigate(['/employee/calendar/create-minute'], {
            queryParams: { eventId: this.event.id }
        });
    }

    // --- Formateo ---

    getFormattedDate(): string {
        if (!this.event) return '';

        if (this.event.allDay) {
            const date = new Date(this.event.start);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        const start = new Date(this.event.start);
        const end = new Date(this.event.end);
        const dateStr = start.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const startTime = this.formatTime(start);
        const endTime = this.formatTime(end);

        return `${dateStr}`;
    }

    getFormattedTime(): string {
        if (!this.event || this.event.allDay) return 'Todo el día';

        const start = new Date(this.event.start);
        const end = new Date(this.event.end);
        return `${this.formatTime(start)} – ${this.formatTime(end)}`;
    }

    getDuration(): string {
        if (!this.event || this.event.allDay) return '';

        const start = new Date(this.event.start);
        const end = new Date(this.event.end);
        const diffMs = end.getTime() - start.getTime();
        const minutes = Math.floor(diffMs / 60000);

        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h ${remainingMinutes}min`;
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    getStatusIcon(responseStatus: string): string {
        switch (responseStatus) {
            case 'accepted': return 'checkmark-circle';
            case 'declined': return 'close-circle';
            case 'tentative': return 'help-circle';
            default: return 'remove-circle';
        }
    }

    getStatusColor(responseStatus: string): string {
        switch (responseStatus) {
            case 'accepted': return 'success';
            case 'declined': return 'danger';
            case 'tentative': return 'warning';
            default: return 'medium';
        }
    }

    getStatusLabel(responseStatus: string): string {
        switch (responseStatus) {
            case 'accepted': return 'Aceptó';
            case 'declined': return 'Rechazó';
            case 'tentative': return 'Quizás';
            case 'needsAction': return 'Pendiente';
            default: return 'Sin respuesta';
        }
    }

    // --- Acciones ---

    openInGoogle() {
        if (this.event?.htmlLink) {
            window.open(this.event.htmlLink, '_blank');
        }
    }

    openConference() {
        if (this.event?.conferenceLink) {
            window.open(this.event.conferenceLink, '_blank');
        }
    }

    openLocation() {
        if (this.event?.location) {
            window.open(`https://maps.google.com/maps?q=${encodeURIComponent(this.event.location)}`, '_blank');
        }
    }
}
