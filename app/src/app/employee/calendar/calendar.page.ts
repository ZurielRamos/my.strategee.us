import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    LoadingController,
    AlertController,
    ModalController,
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
    refreshOutline,
    logoGoogle,
    unlinkOutline,
    chevronBackOutline,
    chevronForwardOutline,
    todayOutline,
    checkmarkCircle
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GoogleCalendarService } from './services/google-calendar.service';
import { CalendarEvent, CalendarStatus, EventMinuteLink } from './models/calendar-event.model';
import { ToastService } from '../../shared/services/toast.service';
import { MinutesService } from '../minutes/services/minutes.service';
import { GoogleWorkspaceService } from '../../auth/services/google-workspace.service';
import { AuthService } from '../../auth/services/auth.service';
import { EventDetailModalComponent } from './components/event-detail-modal/event-detail-modal.component';

type ViewMode = 'today' | 'week';

interface WeekDay {
    date: Date;
    name: string;
    number: number;
}

@Component({
    selector: 'app-calendar',
    templateUrl: './calendar.page.html',
    styleUrls: ['./calendar.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonButton,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        PageHeaderComponent
    ]
})
export class CalendarPage implements OnInit, OnDestroy, AfterViewInit, ViewWillEnter {
    @ViewChild('timeGrid') timeGridRef!: ElementRef;

    status: CalendarStatus = { connected: false };
    events: CalendarEvent[] = [];
    eventLinks: Map<string, EventMinuteLink> = new Map();
    /** Columna y número de columnas de cada evento con hora, para mostrar lado a lado los que se superponen. */
    private eventLayout = new Map<string, { col: number; cols: number }>();
    eventLinkStates: Map<string, string> = new Map(); // googleEventId -> acta state ('0' publicada, '1' borrador)
    isLoading = false;
    isConnecting = false;
    viewMode: ViewMode = 'today';
    currentDate = new Date();
    hours: number[] = [];
    weekDays: WeekDay[] = [];

    private timeUpdateInterval: any;

    constructor(
        private calendarService: GoogleCalendarService,
        private minutesService: MinutesService,
        private toastService: ToastService,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private router: Router,
        private googleWorkspace: GoogleWorkspaceService,
        private authService: AuthService,
        private modalCtrl: ModalController
    ) {
        addIcons({
            calendarOutline,
            timeOutline,
            locationOutline,
            videocamOutline,
            peopleOutline,
            linkOutline,
            refreshOutline,
            logoGoogle,
            unlinkOutline,
            chevronBackOutline,
            chevronForwardOutline,
            todayOutline,
            checkmarkCircle
        });

        // Generar horas del día (6am a 11pm)
        for (let i = 6; i <= 23; i++) {
            this.hours.push(i);
        }
    }

    ngOnInit() {
        this.checkStatus();
        this.updateWeekDays();

        // Actualizar la línea de hora actual cada minuto
        this.timeUpdateInterval = setInterval(() => {
            // Forzar re-render para la línea de tiempo actual
        }, 60000);
    }

    ionViewWillEnter() {
        // Recargar links y estados al volver a la vista
        if (this.status.connected && this.events.length > 0) {
            this.refreshEventLinks();
        }
    }

    ngAfterViewInit() {
        // Scroll a la hora actual después de cargar
        setTimeout(() => this.scrollToCurrentTime(), 500);
    }

    ngOnDestroy() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
    }

    async checkStatus() {
        this.isLoading = true;
        try {
            this.status = await this.calendarService.getStatus().toPromise() || { connected: false };
            if (this.status.connected) {
                await this.loadEvents();
            } else {
                // En web precarga Google Identity Services para que el popup abra sin bloqueo al pulsar "Conectar".
                this.googleWorkspace.prepare().catch(() => { });
            }
        } catch {
            this.status = { connected: false };
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Pide los permisos de Google Workspace con el mismo flujo del login
     * (selector nativo en Android, popup de Google en web).
     */
    async connectCalendar() {
        const email = this.authService.getCurrentUser()?.email;
        if (!email) {
            return;
        }
        this.isConnecting = true;
        try {
            const workspaceStatus = await this.googleWorkspace.getStatus();
            if (!workspaceStatus.eligible) {
                await this.toastService.show(`Google Calendar solo está disponible para cuentas de ${workspaceStatus.domain}`);
                return;
            }
            const result = await this.googleWorkspace.authorize(workspaceStatus, email);
            if (result === 'cancelled') {
                await this.toastService.show('No se concedieron los permisos de Google');
                return;
            }
            await this.toastService.show('Google Calendar conectado');
            await this.checkStatus();
        } catch (error: any) {
            await this.toastService.show(error?.error?.message || error?.message || 'Error al conectar el calendario');
        } finally {
            this.isConnecting = false;
        }
    }

    async disconnectCalendar() {
        const alert = await this.alertCtrl.create({
            header: 'Desconectar Calendario',
            message: '¿Estás seguro de que deseas desconectar tu Google Calendar?',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Desconectar',
                    role: 'destructive',
                    handler: async () => {
                        const loading = await this.loadingCtrl.create({ message: 'Desconectando...' });
                        await loading.present();
                        try {
                            await this.calendarService.disconnect().toPromise();
                            this.status = { connected: false };
                            this.events = [];
                            await this.toastService.show('Calendario desconectado');
                        } catch {
                            await this.toastService.show('Error al desconectar el calendario');
                        } finally {
                            await loading.dismiss();
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    async loadEvents() {
        this.isLoading = true;
        try {
            const { timeMin, timeMax } = this.getDateRange();
            const [events, links] = await Promise.all([
                this.calendarService.getEvents({
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    maxResults: 100
                }).toPromise(),
                this.calendarService.getEventLinks().toPromise()
            ]);

            this.events = events || [];
            this.computeEventLayout();
            this.eventLinks = new Map((links || []).map(l => [l.googleEventId, l]));

            // Cargar estados de las actas vinculadas
            this.loadMinuteStates(links || []);
        } catch (error: any) {
            if (error?.status === 409) {
                this.status = { connected: false };
                await this.toastService.show('La conexión ha expirado. Reconecta tu calendario.');
            } else {
                await this.toastService.show(error?.error?.message || 'Error al cargar los eventos');
            }
        } finally {
            this.isLoading = false;
        }
    }

    private async loadMinuteStates(links: EventMinuteLink[]) {
        this.eventLinkStates.clear();
        for (const link of links) {
            try {
                const detail = await this.minutesService.getMinuteDetail(link.minuteId).toPromise();
                if (detail?.Contac?.state) {
                    this.eventLinkStates.set(link.googleEventId, detail.Contac.state);
                }
            } catch {
                // Si falla, ignorar
            }
        }
    }

    hasMinuteLink(eventId: string): boolean {
        return this.eventLinks.has(eventId);
    }

    isDraftMinute(eventId: string): boolean {
        return this.eventLinkStates.get(eventId) === '1';
    }

    private async refreshEventLinks() {
        try {
            const links = await this.calendarService.getEventLinks().toPromise() || [];
            this.eventLinks = new Map(links.map(l => [l.googleEventId, l]));
            this.loadMinuteStates(links);
        } catch {
            // Silencioso
        }
    }

    // --- Navegación ---

    onViewChange(event: any) {
        this.viewMode = event.detail.value;
        this.updateWeekDays();
        if (this.status.connected) {
            this.loadEvents();
        }
        setTimeout(() => this.scrollToCurrentTime(), 200);
    }

    navigateDate(direction: 'prev' | 'next') {
        const offset = direction === 'next' ? 1 : -1;
        if (this.viewMode === 'today') {
            this.currentDate = new Date(this.currentDate.getTime() + offset * 24 * 60 * 60 * 1000);
        } else {
            this.currentDate = new Date(this.currentDate.getTime() + offset * 7 * 24 * 60 * 60 * 1000);
        }
        this.updateWeekDays();
        this.loadEvents();
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateWeekDays();
        this.loadEvents();
        setTimeout(() => this.scrollToCurrentTime(), 200);
    }

    // --- Formateo ---

    getFormattedDateRange(): string {
        if (this.viewMode === 'today') {
            return this.currentDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } else {
            const { timeMin, timeMax } = this.getDateRange();
            const sameMonth = timeMin.getMonth() === timeMax.getMonth();
            if (sameMonth) {
                return `${timeMin.getDate()} – ${timeMax.getDate()} de ${timeMin.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
            }
            return `${timeMin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${timeMax.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
    }

    getDayOfWeek(): string {
        return this.currentDate.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
    }

    formatHour(hour: number): string {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }

    getEventTime(event: CalendarEvent): string {
        if (event.allDay) return 'Todo el día';
        const start = new Date(event.start);
        const end = new Date(event.end);
        return `${this.formatTimeShort(start)} – ${this.formatTimeShort(end)}`;
    }

    getEventTimeShort(event: CalendarEvent): string {
        if (event.allDay) return '';
        const start = new Date(event.start);
        return this.formatTimeShort(start);
    }

    getCurrentTimeLabel(): string {
        const now = new Date();
        return this.formatTimeShort(now);
    }

    private formatTimeShort(date: Date): string {
        const h = date.getHours();
        const m = date.getMinutes();
        const ampm = h >= 12 ? 'p.m.' : 'a.m.';
        const hour = h % 12 || 12;
        return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    // --- Posicionamiento de eventos ---

    getEventTop(event: CalendarEvent): number {
        const start = new Date(event.start);
        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        // Cada hora = 60px, offset por el inicio a las 6am
        const firstHour = this.hours[0];
        return (startHour - firstHour) * 60 + startMinute;
    }

    getEventHeight(event: CalendarEvent): number {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = durationMs / (1000 * 60);
        // Mínimo 20px de altura
        return Math.max(20, durationMinutes);
    }

    getCurrentTimePosition(): number {
        const now = new Date();
        const firstHour = this.hours[0];
        return (now.getHours() - firstHour) * 60 + now.getMinutes();
    }

    // Vista de día: área de eventos entre la columna de horas (72px) y el margen derecho (12px).
    getDayEventLeft(event: CalendarEvent): string {
        const { col, cols } = this.getLayout(event);
        return `calc(72px + (100% - 84px) * ${col} / ${cols})`;
    }

    getDayEventWidth(event: CalendarEvent): string {
        const { cols } = this.getLayout(event);
        return `calc((100% - 84px) / ${cols} - 4px)`;
    }

    getWeekEventLeft(dayIndex: number, event: CalendarEvent): string {
        // 60px gutter + cada día tiene ancho proporcional; los eventos superpuestos dividen el día en columnas
        const { col, cols } = this.getLayout(event);
        const dayWidth = `((100% - 60px) / 7)`;
        return `calc(60px + ${dayIndex} * ${dayWidth} + ${dayWidth} * ${col} / ${cols} + 2px)`;
    }

    getWeekEventWidth(event: CalendarEvent): string {
        const { cols } = this.getLayout(event);
        return `calc((100% - 60px) / 7 / ${cols} - 4px)`;
    }

    private getLayout(event: CalendarEvent): { col: number; cols: number } {
        return this.eventLayout.get(event.id) ?? { col: 0, cols: 1 };
    }

    /**
     * Agrupa los eventos de cada día que se superponen y reparte columnas,
     * como en Google Calendar: cada evento usa la primera columna libre del grupo.
     */
    private computeEventLayout() {
        this.eventLayout.clear();
        const byDay = new Map<string, CalendarEvent[]>();
        for (const event of this.events.filter(e => !e.allDay)) {
            const key = new Date(event.start).toDateString();
            byDay.set(key, [...(byDay.get(key) ?? []), event]);
        }

        const range = (e: CalendarEvent) => {
            const start = new Date(e.start).getTime();
            // Misma altura mínima que getEventHeight (20 min) para que los eventos cortos no se encimen.
            return { start, end: Math.max(new Date(e.end).getTime(), start + 20 * 60000) };
        };

        for (const dayEvents of byDay.values()) {
            const sorted = [...dayEvents].sort((a, b) =>
                range(a).start - range(b).start || range(b).end - range(a).end);

            let group: { event: CalendarEvent; col: number }[] = [];
            let columnEnds: number[] = [];
            let groupEnd = -Infinity;

            const closeGroup = () => {
                for (const item of group) {
                    this.eventLayout.set(item.event.id, { col: item.col, cols: columnEnds.length });
                }
                group = [];
                columnEnds = [];
            };

            for (const event of sorted) {
                const { start, end } = range(event);
                if (start >= groupEnd) {
                    closeGroup();
                    groupEnd = -Infinity;
                }
                let col = columnEnds.findIndex(colEnd => colEnd <= start);
                if (col === -1) {
                    col = columnEnds.length;
                    columnEnds.push(end);
                } else {
                    columnEnds[col] = end;
                }
                group.push({ event, col });
                groupEnd = Math.max(groupEnd, end);
            }
            closeGroup();
        }
    }

    // --- Filtros de eventos ---

    getAllDayEvents(): CalendarEvent[] {
        return this.events.filter(e => e.allDay);
    }

    getTimedEvents(): CalendarEvent[] {
        return this.events.filter(e => !e.allDay && this.isEventOnDate(e, this.currentDate));
    }

    getTimedEventsForDay(date: Date): CalendarEvent[] {
        return this.events.filter(e => !e.allDay && this.isEventOnDate(e, date));
    }

    getAllDayEventsForDay(date: Date): CalendarEvent[] {
        return this.events.filter(e => e.allDay && this.isEventOnDate(e, date));
    }

    hasAllDayEventsInWeek(): boolean {
        return this.weekDays.some(day => this.getAllDayEventsForDay(day.date).length > 0);
    }

    private isEventOnDate(event: CalendarEvent, date: Date): boolean {
        const eventDate = new Date(event.start);
        return eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate();
    }

    // --- Helpers de fecha ---

    isToday(): boolean {
        const today = new Date();
        return this.currentDate.toDateString() === today.toDateString();
    }

    isDayToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    isCurrentWeek(): boolean {
        const today = new Date();
        return this.weekDays.some(d => d.date.toDateString() === today.toDateString());
    }

    getDateRange(): { timeMin: Date; timeMax: Date } {
        const date = new Date(this.currentDate);
        if (this.viewMode === 'today') {
            const timeMin = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            const timeMax = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
            return { timeMin, timeMax };
        } else {
            const dayOfWeek = date.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(date.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
            const timeMin = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0);
            const sunday = new Date(timeMin.getTime() + 6 * 24 * 60 * 60 * 1000);
            const timeMax = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59);
            return { timeMin, timeMax };
        }
    }

    updateWeekDays() {
        const { timeMin } = this.getDateRange();
        const monday = this.viewMode === 'week' ? timeMin : this.getMonday(this.currentDate);
        const days: WeekDay[] = [];
        const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
            days.push({
                date: d,
                name: dayNames[i],
                number: d.getDate()
            });
        }
        this.weekDays = days;
    }

    private getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // --- Acciones ---

    async openEvent(event: CalendarEvent) {
        const isMobile = window.innerWidth < 768;
        const modal = await this.modalCtrl.create({
            component: EventDetailModalComponent,
            componentProps: { event },
            cssClass: 'event-detail-modal',
            // En móvil se muestra como hoja inferior; en escritorio, centrado.
            ...(isMobile ? { breakpoints: [0, 0.6, 0.92], initialBreakpoint: 0.92 } : {})
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.changed) {
            this.refreshEventLinks();
        }
    }

    openConference(event: CalendarEvent) {
        if (event.conferenceLink) {
            window.open(event.conferenceLink, '_blank');
        }
    }

    private scrollToCurrentTime() {
        if (this.timeGridRef?.nativeElement) {
            const now = new Date();
            const firstHour = this.hours[0];
            const scrollPosition = Math.max(0, (now.getHours() - firstHour - 1) * 60);
            this.timeGridRef.nativeElement.scrollTop = scrollPosition;
        }
    }
}
