import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent, CalendarStatus, EventMinuteLink } from '../models/calendar-event.model';

@Injectable({
    providedIn: 'root'
})
export class GoogleCalendarService {
    private readonly apiUrl = `${environment.apiUrl}/google-calendar`;

    constructor(private http: HttpClient) {}

    /**
     * Verifica si el empleado tiene su calendario conectado.
     */
    getStatus(): Observable<CalendarStatus> {
        return this.http.get<CalendarStatus>(`${this.apiUrl}/status`);
    }

    /**
     * Desconecta Google Calendar.
     */
    disconnect(): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/disconnect`);
    }

    /**
     * Obtiene los eventos del calendario.
     */
    getEvents(params?: {
        timeMin?: string;
        timeMax?: string;
        maxResults?: number;
    }): Observable<CalendarEvent[]> {
        let httpParams = new HttpParams();

        if (params?.timeMin) {
            httpParams = httpParams.set('timeMin', params.timeMin);
        }
        if (params?.timeMax) {
            httpParams = httpParams.set('timeMax', params.timeMax);
        }
        if (params?.maxResults) {
            httpParams = httpParams.set('maxResults', params.maxResults.toString());
        }

        return this.http.get<CalendarEvent[]>(`${this.apiUrl}/events`, { params: httpParams });
    }

    // --- Event-Minute Links ---

    /**
     * Obtiene todas las vinculaciones evento-acta.
     */
    getEventLinks(): Observable<EventMinuteLink[]> {
        return this.http.get<EventMinuteLink[]>(`${this.apiUrl}/event-links`);
    }

    /**
     * Obtiene la vinculación de un evento específico.
     */
    getEventLink(googleEventId: string): Observable<EventMinuteLink | null> {
        return this.http.get<EventMinuteLink | null>(`${this.apiUrl}/event-links/${googleEventId}`);
    }

    /**
     * Vincula un evento con un acta.
     */
    linkEventToMinute(googleEventId: string, minuteId: string): Observable<EventMinuteLink> {
        return this.http.post<EventMinuteLink>(`${this.apiUrl}/event-links`, {
            googleEventId,
            minuteId
        });
    }

    /**
     * Desvincula un evento de un acta.
     */
    unlinkEvent(googleEventId: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/event-links/${googleEventId}`);
    }
}
