import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GiftedDaysAdminService {
    private apiUrl = `${environment.apiUrl}/gifted-days`;

    constructor(private http: HttpClient) { }

    grantDays(employeeId: string, days: number, note: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/grant`, { employeeId, days, note });
    }

    adjustBalance(employeeId: string, days: number, note: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/adjust`, { employeeId, days, note });
    }

    getEmployeeBalance(employeeId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/balance/${employeeId}`);
    }
}
