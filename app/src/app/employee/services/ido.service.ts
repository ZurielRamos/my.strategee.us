import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface IdoResponse {
    ido: number;
    idoLimit: number;
    meetsRequirement: boolean;
    consultedAt: string;
    date: string;
}

@Injectable({
    providedIn: 'root'
})
export class IdoService {
    private apiUrl = `${environment.apiUrl}/employees`;

    constructor(private http: HttpClient) { }

    getMyIdo(): Observable<IdoResponse> {
        return this.http.get<IdoResponse>(`${this.apiUrl}/current-ido`);
    }
}
