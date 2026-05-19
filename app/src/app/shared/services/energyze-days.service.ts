import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnergyzeDaysBalance } from '../models/energyze-days.model';

@Injectable({
  providedIn: 'root'
})
export class EnergyzeDaysService {
  private apiUrl = `${environment.apiUrl}/energyze-days`;

  constructor(private http: HttpClient) {}

  getMyBalance(): Observable<EnergyzeDaysBalance> {
    return this.http.get<EnergyzeDaysBalance>(`${this.apiUrl}/my-balance`);
  }

  getEmployeeBalance(employeeId: string): Observable<EnergyzeDaysBalance> {
    return this.http.get<EnergyzeDaysBalance>(`${this.apiUrl}/balance/${employeeId}`);
  }

  adjustBalance(employeeId: string, days: number, note: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/adjust`, {
      employeeId,
      days,
      note
    });
  }
}
