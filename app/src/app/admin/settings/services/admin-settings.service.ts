import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SystemSettings {
    id: string;
    vacationDaysLaborContract: number;
    vacationDaysServiceContract: number;
    hoursPerWorkday: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateSystemSettingsDto {
    vacationDaysLaborContract?: number;
    vacationDaysServiceContract?: number;
    hoursPerWorkday?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AdminSettingsService {
    private apiUrl = `${environment.apiUrl}/system-settings`;

    constructor(private http: HttpClient) {}

    getSettings(): Observable<SystemSettings> {
        return this.http.get<SystemSettings>(this.apiUrl);
    }

    updateSettings(settings: UpdateSystemSettingsDto): Observable<SystemSettings> {
        return this.http.patch<SystemSettings>(this.apiUrl, settings);
    }
}
