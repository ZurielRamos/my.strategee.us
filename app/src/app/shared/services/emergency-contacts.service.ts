import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmergencyContact, CreateEmergencyContactDto } from '../models/emergency-contact.model';

@Injectable({ providedIn: 'root' })
export class EmergencyContactsService {
    private readonly apiUrl = `${environment.apiUrl}/emergency-contacts`;

    constructor(private http: HttpClient) {}

    // ── Empleado ──────────────────────────────────────────────────────────────

    getMyContacts(): Observable<EmergencyContact[]> {
        return this.http.get<EmergencyContact[]>(`${this.apiUrl}/my`);
    }

    createMyContact(dto: CreateEmergencyContactDto): Observable<EmergencyContact> {
        return this.http.post<EmergencyContact>(`${this.apiUrl}/my`, dto);
    }

    removeMyContact(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/my/${id}`);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    getByEmployee(employeeId: string): Observable<EmergencyContact[]> {
        return this.http.get<EmergencyContact[]>(`${this.apiUrl}/employee/${employeeId}`);
    }

    removeAsAdmin(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
