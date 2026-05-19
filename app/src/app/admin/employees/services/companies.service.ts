import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Company {
    id: string;
    name: string;
    nit: string;
}

@Injectable({
    providedIn: 'root'
})
export class CompaniesService {
    private readonly apiUrl = `${environment.apiUrl}/companies`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Company[]> {
        return this.http.get<Company[]>(this.apiUrl);
    }
}
