import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Schedule, CreateScheduleDto, UpdateScheduleDto } from '../models/schedule.model';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SchedulesService {
    private readonly apiUrl = `${environment.apiUrl}/schedules`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Schedule[]> {
        return this.http.get<Schedule[]>(this.apiUrl);
    }

    getById(id: string): Observable<Schedule> {
        return this.http.get<Schedule>(`${this.apiUrl}/${id}`);
    }

    create(data: CreateScheduleDto): Observable<Schedule> {
        return this.http.post<Schedule>(this.apiUrl, data);
    }

    update(id: string, data: UpdateScheduleDto): Observable<Schedule> {
        return this.http.patch<Schedule>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    toggleActive(id: string): Observable<Schedule> {
        return this.http.patch<Schedule>(`${this.apiUrl}/${id}/toggle-active`, {});
    }
}
