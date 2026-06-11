import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MinuteListItem, MinuteDetail, MinuteClient, MinuteProject, MinutesFilter } from '../models/minute.model';

@Injectable({
  providedIn: 'root'
})
export class MinutesService {
  private readonly apiUrl = `${environment.apiUrl}/minutes`;

  constructor(private http: HttpClient) {}

  getMyClients(): Observable<MinuteClient[]> {
    return this.http.get<MinuteClient[]>(`${this.apiUrl}/clients`);
  }

  getMyProjects(clientId?: string): Observable<MinuteProject[]> {
    let params = new HttpParams();
    if (clientId) {
      params = params.set('client_id', clientId);
    }
    return this.http.get<MinuteProject[]>(`${this.apiUrl}/projects`, { params });
  }

  getMyMinutes(page: number = 1, filters?: MinutesFilter): Observable<MinuteListItem[]> {
    let params = new HttpParams().set('page', page.toString());
    if (filters?.client_id) {
      params = params.set('client_id', filters.client_id);
    }
    if (filters?.project_id) {
      params = params.set('project_id', filters.project_id);
    }
    return this.http.get<MinuteListItem[]>(this.apiUrl, { params });
  }

  getMinuteDetail(id: string): Observable<MinuteDetail> {
    return this.http.get<MinuteDetail>(`${this.apiUrl}/${id}`);
  }

  getTeamUsers(clientId?: string): Observable<{ colaboradores: any[]; externos: any[] }> {
    let params = new HttpParams();
    if (clientId) {
      params = params.set('client_id', clientId);
    }
    return this.http.get<{ colaboradores: any[]; externos: any[] }>(`${this.apiUrl}/team/users`, { params });
  }

  createMinute(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  uploadImage(minuteId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/${minuteId}/images`, formData);
  }

  uploadDocument(minuteId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/${minuteId}/documents`, formData);
  }

  updateMinute(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/update`, data);
  }

  sendMinute(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/update`, { state: 0 });
  }

  discardMinute(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/discard`, {});
  }
}
