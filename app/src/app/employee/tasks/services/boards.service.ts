import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Board, BoardList, BoardMember, ShareOptions } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class BoardsService {
    private readonly apiUrl = `${environment.apiUrl}/boards`;

    constructor(private http: HttpClient) { }

    list(): Observable<Board[]> {
        return this.http.get<Board[]>(this.apiUrl);
    }

    create(name: string): Observable<Board> {
        return this.http.post<Board>(this.apiUrl, { name });
    }

    rename(id: string, name: string): Observable<Board> {
        return this.http.patch<Board>(`${this.apiUrl}/${id}`, { name });
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    shareOptions(): Observable<ShareOptions> {
        return this.http.get<ShareOptions>(`${this.apiUrl}/share-options`);
    }

    setShares(id: string, userIds: string[], departmentIds: string[]): Observable<unknown> {
        return this.http.put(`${this.apiUrl}/${id}/shares`, { userIds, departmentIds });
    }

    members(id: string): Observable<BoardMember[]> {
        return this.http.get<BoardMember[]>(`${this.apiUrl}/${id}/members`);
    }

    createList(boardId: string, name: string, isDone = false): Observable<BoardList> {
        return this.http.post<BoardList>(`${this.apiUrl}/${boardId}/lists`, { name, isDone });
    }

    updateList(listId: string, changes: { name?: string; isDone?: boolean; position?: number }): Observable<BoardList> {
        return this.http.patch<BoardList>(`${this.apiUrl}/lists/${listId}`, changes);
    }

    deleteList(listId: string, moveToListId?: string): Observable<void> {
        const params = moveToListId ? new HttpParams().set('moveToListId', moveToListId) : undefined;
        return this.http.delete<void>(`${this.apiUrl}/lists/${listId}`, { params });
    }
}
