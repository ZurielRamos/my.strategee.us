import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VacationBalance } from '../models/vacation-balance.model';

@Injectable({
    providedIn: 'root'
})
export class VacationsService {
    private apiUrl = `${environment.apiUrl}/vacations`;

    constructor(private http: HttpClient) { }

    getMyBalance(): Observable<VacationBalance> {
        return this.http.get<VacationBalance>(`${this.apiUrl}/my-balance`);
    }

    getEmployeeBalance(employeeId: string): Observable<VacationBalance> {
        return this.http.get<VacationBalance>(`${this.apiUrl}/balance/${employeeId}`);
    }
}
