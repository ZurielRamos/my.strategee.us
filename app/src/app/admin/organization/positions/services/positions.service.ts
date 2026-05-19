import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Position, CreatePositionDto, UpdatePositionDto } from '../models/position.model';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PositionsService {
    private readonly apiUrl = `${environment.apiUrl}/positions`;

    constructor(private http: HttpClient) { }

    getAll(departmentId?: string): Observable<Position[]> {
        let params = new HttpParams();
        if (departmentId) {
            params = params.set('departmentId', departmentId);
        }
        return this.http.get<Position[]>(this.apiUrl, { params });
    }

    getById(id: string): Observable<Position> {
        return this.http.get<Position>(`${this.apiUrl}/${id}`);
    }

    create(data: CreatePositionDto): Observable<Position> {
        return this.http.post<Position>(this.apiUrl, data);
    }

    update(id: string, data: UpdatePositionDto): Observable<Position> {
        return this.http.patch<Position>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
