import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Area, CreateAreaDto, UpdateAreaDto } from '../models/area.model';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AreasService {
    private readonly apiUrl = `${environment.apiUrl}/departments`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Area[]> {
        return this.http.get<Area[]>(this.apiUrl);
    }

    getById(id: string): Observable<Area> {
        return this.http.get<Area>(`${this.apiUrl}/${id}`);
    }

    create(data: CreateAreaDto): Observable<Area> {
        return this.http.post<Area>(this.apiUrl, data);
    }

    update(id: string, data: UpdateAreaDto): Observable<Area> {
        return this.http.patch<Area>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
