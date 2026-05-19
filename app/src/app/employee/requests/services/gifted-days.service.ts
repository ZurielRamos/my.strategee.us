import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GiftedDaysBalance } from '../models/gifted-days-balance.model';

@Injectable({
    providedIn: 'root'
})
export class GiftedDaysService {
    private apiUrl = `${environment.apiUrl}/gifted-days`;

    constructor(private http: HttpClient) { }

    getMyBalance(): Observable<GiftedDaysBalance> {
        return this.http.get<GiftedDaysBalance>(`${this.apiUrl}/my-balance`);
    }

    getEmployeeBalance(employeeId: string): Observable<GiftedDaysBalance> {
        return this.http.get<GiftedDaysBalance>(`${this.apiUrl}/balance/${employeeId}`);
    }
}
