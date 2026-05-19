import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Compensation, CompensationFrequency, CompensationCondition } from '../models/compensation.model';

export interface CreateCompensationDto {
    employeeId: string;
    concept: string;
    isLinkedGlobalParameter: boolean;
    condition: CompensationCondition;
    frequency: CompensationFrequency;
    amount?: number;
    linkedGlobalParameter?: string;
    startDate: string;
    endDate?: string;
    paymentDate?: string;
    paymentDay?: number;
    secondPaymentDay?: number;
}

@Injectable({
    providedIn: 'root'
})
export class CompensationService {
    private readonly apiUrl = `${environment.apiUrl}/compensation`;

    constructor(private http: HttpClient) { }

    /**
     * Crea una nueva compensación
     */
    create(dto: CreateCompensationDto): Observable<Compensation> {
        return this.http.post<Compensation>(this.apiUrl, dto);
    }

    /**
     * Obtiene todas las compensaciones
     */
    getAll(): Observable<Compensation[]> {
        return this.http.get<Compensation[]>(this.apiUrl);
    }

    /**
     * Obtiene compensaciones activas de un empleado
     */
    getActiveByEmployee(employeeId: string): Observable<Compensation[]> {
        return this.http.get<Compensation[]>(`${this.apiUrl}/employee/${employeeId}/active`);
    }

    /**
     * Obtiene todas las compensaciones de un empleado (historial completo)
     */
    getAllByEmployee(employeeId: string): Observable<Compensation[]> {
        return this.http.get<Compensation[]>(`${this.apiUrl}/employee/${employeeId}/all`);
    }

    /**
     * Cancela una compensación
     */
    cancel(id: string): Observable<Compensation> {
        return this.http.patch<Compensation>(`${this.apiUrl}/${id}/cancel`, {});
    }

    /**
     * Obtiene una compensación por ID
     */
    getById(id: string): Observable<Compensation> {
        return this.http.get<Compensation>(`${this.apiUrl}/${id}`);
    }

    /**
     * Actualiza una compensación
     */
    update(id: string, dto: Partial<CreateCompensationDto>): Observable<Compensation> {
        return this.http.patch<Compensation>(`${this.apiUrl}/${id}`, dto);
    }

    /**
     * Elimina físicamente una compensación
     * NOTA: Este método solo debe usarse en casos excepcionales por administradores.
     * En operaciones normales, usar cancel() para marcar como cancelada.
     */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
