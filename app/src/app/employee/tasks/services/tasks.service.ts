import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class TasksService {
    private readonly apiUrl = `${environment.apiUrl}/tasks`;

    constructor(private http: HttpClient) { }

    list(boardId: string): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl, { params: new HttpParams().set('boardId', boardId) });
    }

    create(payload: CreateTaskPayload): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, payload);
    }

    update(id: string, payload: UpdateTaskPayload): Observable<Task> {
        return this.http.patch<Task>(`${this.apiUrl}/${id}`, payload);
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
