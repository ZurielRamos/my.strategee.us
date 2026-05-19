import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EmployeeSettings {
    id: string;
    employeeId: string;
    personalEmailNotification: boolean;
    corporativeEmailNotification: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateEmployeeSettingsDto {
    personalEmailNotification?: boolean;
    corporativeEmailNotification?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class EmployeeSettingsService {
    private apiUrl = `${environment.apiUrl}/employees`;

    constructor(private http: HttpClient) { }

    getSettings(employeeId: string): Observable<EmployeeSettings> {
        return this.http.get<EmployeeSettings>(`${this.apiUrl}/${employeeId}/settings`);
    }

    updateSettings(employeeId: string, dto: UpdateEmployeeSettingsDto): Observable<EmployeeSettings> {
        return this.http.patch<EmployeeSettings>(`${this.apiUrl}/${employeeId}/settings`, dto);
    }
}
