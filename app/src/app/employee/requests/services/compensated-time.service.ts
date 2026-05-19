import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompensatedTimeBalance } from '../models/compensated-time-balance.model';

@Injectable({
    providedIn: 'root'
})
export class CompensatedTimeService {
    private apiUrl = `${environment.apiUrl}/compensated-time`;

    constructor(private http: HttpClient) { }

    getMyBalance(): Observable<CompensatedTimeBalance> {
        return this.http.get<CompensatedTimeBalance>(`${this.apiUrl}/my-balance`);
    }

    getEmployeeBalance(employeeId: string): Observable<CompensatedTimeBalance> {
        return this.http.get<CompensatedTimeBalance>(`${this.apiUrl}/balance/${employeeId}`);
    }

    adjustBalance(data: { employeeId: string; type: 'ADD' | 'SUBTRACT'; hours: number; reason: string }): Observable<CompensatedTimeBalance> {
        const hours = data.type === 'ADD' ? data.hours : -data.hours;
        
        return this.http.post<CompensatedTimeBalance>(`${this.apiUrl}/adjust`, {
            employeeId: data.employeeId,
            hours: hours,
            note: data.reason
        });
    }
}
