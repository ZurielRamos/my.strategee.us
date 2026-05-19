import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Location, CreateLocationDto, UpdateLocationDto } from '../models/location.model';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LocationsService {
    private readonly apiUrl = `${environment.apiUrl}/locations`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Location[]> {
        return this.http.get<Location[]>(this.apiUrl);
    }

    getById(id: string): Observable<Location> {
        return this.http.get<Location>(`${this.apiUrl}/${id}`);
    }

    create(data: CreateLocationDto): Observable<Location> {
        return this.http.post<Location>(this.apiUrl, data);
    }

    update(id: string, data: UpdateLocationDto): Observable<Location> {
        return this.http.patch<Location>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    toggleActive(id: string): Observable<Location> {
        return this.http.patch<Location>(`${this.apiUrl}/${id}/toggle-active`, {});
    }
}
