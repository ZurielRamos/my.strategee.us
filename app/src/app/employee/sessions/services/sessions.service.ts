import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Session {
    id: string;
    deviceName: string;
    deviceType: string;
    ipAddress: string;
    lastUsedAt: Date;
    createdAt: Date;
    isCurrent: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SessionsService {
    private apiUrl = `${environment.apiUrl}/sessions`;

    constructor(private http: HttpClient) {}

    getSessions(): Observable<Session[]> {
        return this.http.get<Session[]>(this.apiUrl);
    }

    revokeSession(sessionId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${sessionId}`);
    }

    revokeOtherSessions(): Observable<{ revoked: number }> {
        return this.http.delete<{ revoked: number }>(`${this.apiUrl}/others`);
    }
}
