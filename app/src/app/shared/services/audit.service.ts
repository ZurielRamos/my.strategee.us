import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
    id: string;
    entityName: string;
    entityId: string;
    action: string;
    userId: string;
    userName?: string;
    changes: any;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private apiUrl = `${environment.apiUrl}/audit`;

    constructor(private http: HttpClient) { }

    getEntityAuditHistory(entityName: string, entityId: string): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.apiUrl}/${entityName}/${entityId}`);
    }
}
