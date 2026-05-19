import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Notification,
    NotificationQueryParams,
    UnreadCountResponse,
    PaginatedNotifications
} from '../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/notifications`;

    private unreadCount$ = new BehaviorSubject<number>(0);

    constructor(private http: HttpClient) { }

    getNotifications(queryParams?: NotificationQueryParams): Observable<PaginatedNotifications> {
        let params = new HttpParams();

        if (queryParams?.page) {
            params = params.set('page', queryParams.page.toString());
        }
        if (queryParams?.limit) {
            params = params.set('limit', queryParams.limit.toString());
        }
        if (queryParams?.status) {
            params = params.set('status', queryParams.status);
        }

        return this.http.get<PaginatedNotifications>(this.apiUrl, { params });
    }

    getUnreadCount(): Observable<UnreadCountResponse> {
        return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
            tap(response => this.unreadCount$.next(response.count))
        );
    }

    markAsRead(notificationIds: number[]): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/mark-as-read`, { notificationIds }).pipe(
            tap(() => {
                const current = this.unreadCount$.getValue();
                const newCount = Math.max(0, current - notificationIds.length);
                this.unreadCount$.next(newCount);
            })
        );
    }

    /** Fuerza el conteo a 0 localmente (cuando se abre el popover) */
    clearUnreadCount(): void {
        this.unreadCount$.next(0);
    }

    startPolling(intervalMs: number = 30000): Observable<number> {
        return interval(intervalMs).pipe(
            startWith(0),
            switchMap(() => this.getUnreadCount()),
            switchMap(response => [response.count])
        );
    }

    /** Observable del conteo de no leídas para el badge */
    get unreadCount(): Observable<number> {
        return this.unreadCount$.asObservable();
    }
}
