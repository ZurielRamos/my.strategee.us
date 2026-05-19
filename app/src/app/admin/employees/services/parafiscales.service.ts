import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmployeeParafiscales, UpsertParafiscalesDto } from '../models/parafiscales.model';

@Injectable({
    providedIn: 'root',
})
export class ParafiscalesService {
    private readonly apiUrl = `${environment.apiUrl}/parafiscales`;

    constructor(private http: HttpClient) {}

    /**
     * Obtiene la configuración de parafiscales de un empleado.
     */
    getByEmployee(employeeId: string): Observable<EmployeeParafiscales | null> {
        return this.http.get<EmployeeParafiscales | null>(`${this.apiUrl}/${employeeId}`);
    }

    /**
     * Crea o actualiza la configuración de parafiscales de un empleado.
     */
    upsert(employeeId: string, dto: UpsertParafiscalesDto): Observable<EmployeeParafiscales> {
        return this.http.put<EmployeeParafiscales>(`${this.apiUrl}/${employeeId}`, dto);
    }
}
