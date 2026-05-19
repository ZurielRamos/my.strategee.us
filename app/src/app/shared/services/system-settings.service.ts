import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SystemSettings {
    id: string;
    vacationDaysLaborContract: number;
    vacationDaysServiceContract: number;
    hoursPerWorkday: number;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class SystemSettingsService {
    private apiUrl = `${environment.apiUrl}/system-settings`;
    private settingsCache$?: Observable<SystemSettings>;
    private readonly DEFAULT_HOURS_PER_DAY = 8.5;

    constructor(private http: HttpClient) {}

    /**
     * Obtiene las configuraciones del sistema (con caché)
     */
    getSettings(): Observable<SystemSettings> {
        if (!this.settingsCache$) {
            this.settingsCache$ = this.http.get<SystemSettings>(this.apiUrl).pipe(
                shareReplay(1),
                catchError(error => {
                    console.error('Error loading system settings:', error);
                    // Retornar valores por defecto en caso de error
                    return of({
                        id: '',
                        vacationDaysLaborContract: 15,
                        vacationDaysServiceContract: 15,
                        hoursPerWorkday: this.DEFAULT_HOURS_PER_DAY,
                        createdAt: '',
                        updatedAt: ''
                    });
                })
            );
        }
        return this.settingsCache$;
    }

    /**
     * Obtiene solo las horas por día laboral
     */
    getHoursPerWorkday(): Observable<number> {
        return this.getSettings().pipe(
            map(settings => settings.hoursPerWorkday)
        );
    }

    /**
     * Limpia el caché (útil después de actualizar configuraciones)
     */
    clearCache(): void {
        this.settingsCache$ = undefined;
    }
}
