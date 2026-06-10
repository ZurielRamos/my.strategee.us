import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ApiKeyResponse {
    id: number;
    name: string;
    key: string;
    maskedKey: string;
    createdAt: string;
    lastUsedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApiKeyService {
    private apiUrl = `${environment.apiUrl}/api-keys`;

    constructor(private http: HttpClient) {}

    getApiKeys(): Observable<ApiKeyResponse[]> {
        return this.http.get<ApiKeyResponse[]>(this.apiUrl);
    }

    createApiKey(name: string): Observable<ApiKeyResponse> {
        return this.http.post<ApiKeyResponse>(this.apiUrl, { name });
    }

    revokeApiKey(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
