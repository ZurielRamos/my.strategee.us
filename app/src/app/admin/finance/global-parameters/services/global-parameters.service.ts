import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { GlobalParameter, CreateGlobalParameterDto, UpdateGlobalParameterDto } from '../models/global-parameter.model';

@Injectable({
  providedIn: 'root'
})
export class GlobalParametersService {
  private apiUrl = `${environment.apiUrl}/global-parameters`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<GlobalParameter[]> {
    return this.http.get<GlobalParameter[]>(this.apiUrl);
  }

  getOne(id: string): Observable<GlobalParameter> {
    return this.http.get<GlobalParameter>(`${this.apiUrl}/${id}`);
  }

  getHistory(key: string): Observable<GlobalParameter[]> {
    return this.http.get<GlobalParameter[]>(`${this.apiUrl}/${key}/history`);
  }

  getCurrentValue(key: string, date?: string): Observable<{ value: number }> {
    const params: Record<string, string> = { key };
    if (date) {
      params['date'] = date;
    }
    return this.http.get<{ value: number }>(`${this.apiUrl}/current-value`, { params });
  }

  create(data: CreateGlobalParameterDto): Observable<GlobalParameter> {
    return this.http.post<GlobalParameter>(this.apiUrl, data);
  }

  update(id: string, data: UpdateGlobalParameterDto): Observable<GlobalParameter> {
    return this.http.patch<GlobalParameter>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
